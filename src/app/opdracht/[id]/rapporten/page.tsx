import { notFound } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { getWorkspaceOpdracht } from "@/lib/opdrachten";
import RapportForm from "@/components/opdracht/RapportForm";

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  dateStyle: "medium",
  timeStyle: "short",
});

function statusStyle(status: string): string {
  switch (status) {
    case "akkoord":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
    case "niet akkoord":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-400";
    default:
      return "border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "akkoord":       return "Akkoord";
    case "niet akkoord":  return "Niet akkoord";
    case "concept":       return "Concept";
    default:              return status;
  }
}

export default async function RapportenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);
  const opdracht = await getWorkspaceOpdracht(opdrachtId);

  if (!opdracht) notFound();

  const rapporten = opdracht.rapporten;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Rapporten"
        description="Genereer een rapport en rond het dossier af wanneer de inspectie klaar is."
      >
        <RapportForm opdrachtId={opdrachtId} />
      </SectionCard>

      <SectionCard
        title="Historie"
        description="Eerder gegenereerde rapportversies — klik op 'Download PDF' om een rapport opnieuw te openen."
      >
        {rapporten.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-400">
            Nog geen rapporten aangemaakt voor dit dossier.
          </div>
        ) : (
          <div className="space-y-3">
            {rapporten.map((rapport) => (
              <div
                key={rapport.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-700/40"
              >
                {/* Left: info */}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {rapport.rapporttype}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {dateFormatter.format(rapport.createdAt)}
                  </p>
                  {rapport.representatiefEmail && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {rapport.representatiefEmail}
                    </p>
                  )}
                </div>

                {/* Right: status badge + download */}
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(rapport.status)}`}
                  >
                    {statusLabel(rapport.status)}
                  </span>

                  <a
                    href={`/api/opdrachten/${opdrachtId}/rapporten/${rapport.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
