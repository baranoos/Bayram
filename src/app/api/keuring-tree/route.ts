import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const revalidate = 86400; // keuring tree is structural — revalidate once per day

type Child = { id: number; omschrijving: string; hasChildren: boolean };

/**
 * Returns the entire keuring tree in one query so the service worker can
 * populate its API cache with every /api/keuring-children?id=X response at
 * once, enabling full offline tree navigation.
 *
 * Shape: { tree: { [parentId]: Child[] } }
 */
export async function GET() {
  try {
    const allRelations = await prisma.keuringNodeRelation.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        child: {
          include: {
            parentRelations: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    const tree: Record<number, Child[]> = {};

    for (const rel of allRelations) {
      if (!tree[rel.parentId]) tree[rel.parentId] = [];
      tree[rel.parentId].push({
        id:          rel.child.id,
        omschrijving: rel.child.omschrijving,
        hasChildren: rel.child.parentRelations.length > 0,
      });
    }

    return NextResponse.json({ tree });
  } catch (err) {
    console.error("[keuring-tree]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
