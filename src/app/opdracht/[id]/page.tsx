import KeuringColumnNavigator from "@/components/keuring/KeuringColumnNavigator";
import { prisma } from "@/lib/prisma";

export default async function OpdrachtKeuringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);

  const relations = await prisma.keuringNodeRelation.findMany({
    where: { parentId: 1 },
    include: {
      child: {
        include: {
          parentRelations: {
            select: { id: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const initialNodes = relations.map((relation) => ({
    id: relation.child.id,
    omschrijving: relation.child.omschrijving,
    hasChildren: relation.child.parentRelations.length > 0,
  }));

  return (
    <main className="min-h-screen bg-white">
      <KeuringColumnNavigator
        initialNodes={initialNodes}
        opdrachtId={opdrachtId}
      />
    </main>
  );
}