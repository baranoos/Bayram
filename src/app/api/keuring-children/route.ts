import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const cache = new Map<
  number,
  { id: number; omschrijving: string; hasChildren: boolean }[]
>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id || Number.isNaN(id)) {
      return NextResponse.json([]);
    }

    const cached = cache.get(id);
    if (cached) {
      return NextResponse.json(cached);
    }

    const relations = await prisma.keuringNodeRelation.findMany({
      where: { parentId: id },
      orderBy: { sortOrder: "asc" },
      include: {
        child: {
          include: {
            childRelations: {
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    const children = relations.map((relation) => ({
      id: relation.child.id,
      omschrijving: relation.child.omschrijving,
      hasChildren: relation.child.childRelations.length > 0,
    }));

    cache.set(id, children);

    return NextResponse.json(children);
  } catch (error) {
    console.error("Failed to load keuring children", error);
    return NextResponse.json(
      { error: "Failed to load keuring children" },
      { status: 500 }
    );
  }
}