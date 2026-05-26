import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json([]);
  }

  const relations = await prisma.keuringNodeRelation.findMany({
    where: { parentId: id },
    include: { child: true },
    orderBy: { sortOrder: "asc" },
  });

  const children = await Promise.all(
    relations.map(async (relation) => {
      const childCount = await prisma.keuringNodeRelation.count({
        where: { parentId: relation.child.id },
      });

      return {
        id: relation.child.id,
        omschrijving: relation.child.omschrijving,
        hasChildren: childCount > 0,
      };
    })
  );

  return NextResponse.json(children);
}