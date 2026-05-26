import KeuringColumnNavigator from "@/components/keuring/KeuringColumnNavigator";
import { prisma } from "@/lib/prisma";

export default async function KeuringPage() {
  const relations = await prisma.keuringNodeRelation.findMany({
    where: { parentId: 1 },
    include: { child: true },
    orderBy: { sortOrder: "asc" },
  });

  const initialNodes = relations.map((relation) => ({
    id: relation.child.id,
    omschrijving: relation.child.omschrijving,
  }));

  return (
    <main className="min-h-screen bg-white">
      <KeuringColumnNavigator initialNodes={initialNodes} />
    </main>
  );
}