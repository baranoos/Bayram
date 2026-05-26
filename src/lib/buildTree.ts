import { prisma } from "@/lib/prisma";

export type TreeNodeType = {
  id: number;
  omschrijving: string;
  children: TreeNodeType[];
};

export async function buildTree(
  rootId: number,
  maxDepth = 3,
  visited = new Set<number>()
): Promise<TreeNodeType | null> {
  if (visited.has(rootId)) return null;
  if (maxDepth < 0) return null;

  visited.add(rootId);

  const root = await prisma.keuringNode.findUnique({
    where: { id: rootId },
  });

  if (!root) return null;

  if (maxDepth === 0) {
    return {
      id: root.id,
      omschrijving: root.omschrijving,
      children: [],
    };
  }

  const relations = await prisma.keuringNodeRelation.findMany({
    where: { parentId: rootId },
    include: { child: true },
    orderBy: { sortOrder: "asc" },
  });

  const children = await Promise.all(
    relations.map((relation) =>
      buildTree(relation.childId, maxDepth - 1, new Set(visited))
    )
  );

  return {
    id: root.id,
    omschrijving: root.omschrijving,
    children: children.filter((child): child is TreeNodeType => child !== null),
  };
}