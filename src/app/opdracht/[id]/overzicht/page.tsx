import { notFound } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";
import dynamic from "next/dynamic";

const DeleteGebrekButton = dynamic(() => import("@/components/opdracht/DeleteGebrekButton"));

function severityTone(value: string | null) {
  if (value?.toLowerCase().includes("ern")) return "border-rose-200 bg-rose-50 text-rose-700";
  if (value?.toLowerCase().includes("laag")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function OverzichtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdracht = await getWorkspaceOpdracht(Number(id));

  if (!opdracht) notFound();

  const gebreken = opdracht.resultaten.flatMap((r) =>
    r.gebreken.map((g) => ({ ...g, resultaatId: r.id }))
  );

  const grouped = new Map<string, Map<string, typeof gebreken>>();
  for (const gebrek of gebreken) {
    const locatie = gebrek.locatie ?? "Onbekende locatie";
    const categorie = gebrek.categorie ?? "Onbekende categorie";
    if (!grouped.has(locatie)) grouped.set(locatie, new Map());
    const lg = grouped.get(locatie)!;
    if (!lg.has(categorie)) lg.set(categorie, []);
    lg.get(categorie)!.push(gebrek);
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Overzicht" description="Alle geregistreerde gebreken gegroepeerd op locatie, categorie en ernst.">
        {gebreken.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-400">
            Nog geen gebreken geregistreerd binnen deze opdracht.
          </div>
        ) : (
          <div className="space-y-5">
            {Array.from(grouped.entries()).map(([locatie, categories]) => (
              <div key={locatie} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/40">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{locatie}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    {Array.from(categories.values()).flat().length} gebreken
                  </span>
                </div>
                <div className="space-y-4">
                  {Array.from(categories.entries()).map(([categorie, items]) => (
                    <div key={categorie} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{categorie}</h4>
                        <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                          {items.length} items
                        </span>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {items.map((gebrek) => (
                          <article key={gebrek.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-slate-950 dark:text-white">{gebrek.titel ?? "Gebrek"}</p>
                              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${severityTone(gebrek.ernst)}`}>
                                {gebrek.ernst ?? (gebrek.ernstig ? "Ernstig" : "Normaal")}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{gebrek.omschrijving ?? "Geen omschrijving geregistreerd."}</p>
                            <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
                              <span>Aantal: {gebrek.aantal}</span>
                              <span>{gebrek.standaardtekst ?? "Standaardtekst ontbreekt"}</span>
                            </div>
                            <div className="mt-3 flex items-end justify-end">
                              <DeleteGebrekButton gebrekId={gebrek.id} />
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
