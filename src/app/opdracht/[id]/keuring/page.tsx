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
    include: { child: true },
    orderBy: { sortOrder: "asc" },
  });

  const initialNodes = await Promise.all(
    relations.map(async (relation) => ({
      id: relation.child.id,
      omschrijving: relation.child.omschrijving,
      hasChildren:
        (await prisma.keuringNodeRelation.count({
          where: { parentId: relation.child.id },
        })) > 0,
    }))
  );

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Keuring
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Recursieve inspectienavigatie</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Kies per kolom een inspectiepunt. Wanneer een eindnode wordt geselecteerd, verschijnt het defectenpaneel.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <KeuringColumnNavigator initialNodes={initialNodes} opdrachtId={opdrachtId} />
      </div>
    </div>
  );
}
