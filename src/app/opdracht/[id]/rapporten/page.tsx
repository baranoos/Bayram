import { notFound } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";
import RapportForm from "@/components/opdracht/RapportForm";
import { getWorkspaceOptions } from "@/lib/dynamicOptions";

export default async function RapportenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);
  const opdracht = await getWorkspaceOpdracht(opdrachtId);
  const options = await getWorkspaceOptions();

  if (!opdracht) {
    notFound();
  }

  const rapporten = opdracht.rapporten;

  return (
    <div className="space-y-6">
      <SectionCard title="Rapporten" description="Genereer een rapport en rond het dossier af wanneer de inspectie klaar is.">
        <div className="space-y-6">
          <RapportForm
            opdrachtId={opdrachtId}
            initial={rapporten[0]}
            rapportTypeOptions={options.rapportType}
          />
        </div>
      </SectionCard>

      <SectionCard title="Historie" description="Eerder gegenereerde rapportversies.">
        {rapporten.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
            Nog geen rapporten aangemaakt voor dit dossier.
          </div>
        ) : (
          <div className="space-y-3">
            {rapporten.map((rapport) => (
              <div key={rapport.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{rapport.rapporttype}</p>
                  <p className="text-sm text-slate-500">{rapport.representatiefEmail ?? "Geen e-mail geregistreerd"}</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {rapport.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
