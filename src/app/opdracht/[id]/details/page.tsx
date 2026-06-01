import { notFound } from "next/navigation";
import SectionCard from "@/components/workspace/SectionCard";
import { formatDateTime, getStatusLabel, getWorkspaceOpdracht } from "@/lib/opdrachten";

function metricLabel(value: number) {
  return new Intl.NumberFormat("nl-NL").format(value);
}

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opdrachtId = Number(id);
  const opdracht = await getWorkspaceOpdracht(opdrachtId);

  if (!opdracht) {
    notFound();
  }

  const fundaQuery = encodeURIComponent(`${opdracht.adresStraat} ${opdracht.adresPostcode} ${opdracht.adresPlaats}`);

  const defectCount = opdracht.resultaten.reduce(
    (total, resultaat) => total + resultaat.gebreken.length,
    0
  );
  const fotoCount = opdracht.resultaten.reduce(
    (total, resultaat) => total + resultaat.fotos.length,
    0
  );
  const rapportCount = opdracht.rapporten.length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Details
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Dossieroverzicht
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Overzicht van opdrachtgever, woning en voortgang binnen de opdrachtwerkruimte.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{getStatusLabel(opdracht.status)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Defecten</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{metricLabel(defectCount)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Foto&apos;s</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{metricLabel(fotoCount)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <a
          href={`/api/opdrachten/${opdracht.id}/export`}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
        >
          Export JSON
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Opdrachtgegevens" description="Kerninformatie van het dossier.">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Opdrachtgever</dt>
              <dd className="mt-1 font-medium text-slate-900">{opdracht.opdrachtgeverNaam}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Adres</dt>
              <dd className="mt-1 font-medium text-slate-900">{opdracht.adresStraat}</dd>
              <dd className="text-sm text-slate-500">{opdracht.adresPostcode} {opdracht.adresPlaats}</dd>
              <dd className="mt-2">
                <a
                  href={`https://www.funda.nl/zoeken/koop?q=${fundaQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3" />
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 21H3V3h7" />
                  </svg>
                  <span>Locatie Funda</span>
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">E-mail</dt>
              <dd className="mt-1 font-medium text-slate-900">{opdracht.opdrachtgeverEmail ?? "Niet ingevuld"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Telefoon</dt>
              <dd className="mt-1 font-medium text-slate-900">{opdracht.opdrachtgeverTelefoon ?? "Niet ingevuld"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Type woning</dt>
              <dd className="mt-1 font-medium text-slate-900">{opdracht.typeWoning ?? "Niet ingevuld"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-400">Aangemaakt</dt>
              <dd className="mt-1 font-medium text-slate-900">{formatDateTime(opdracht.createdAt)}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Voortgang" description="Laatste registraties binnen het dossier.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Resultaten</p>
                <p className="text-sm text-slate-500">Aantal keuringresultaten in MySQL</p>
              </div>
              <p className="text-lg font-semibold text-slate-950">{metricLabel(opdracht.resultaten.length)}</p>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Rapporten</p>
                <p className="text-sm text-slate-500">Beschikbare rapportversies</p>
              </div>
              <p className="text-lg font-semibold text-slate-950">{metricLabel(rapportCount)}</p>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Laatste wijziging</p>
                <p className="text-sm text-slate-500">Op basis van de meest recente registratie</p>
              </div>
              <p className="text-sm font-semibold text-slate-950">
                {formatDateTime(opdracht.updatedAt)}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Werkvoorraad" description="Snelle startpunten voor het inspectiedossier.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Woning</p>
            <p className="mt-1 text-sm text-slate-500">Vul object- en projectgegevens verder aan.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Keuring</p>
            <p className="mt-1 text-sm text-slate-500">Werk door de kolommen en registreer gebreken.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Rapportage</p>
            <p className="mt-1 text-sm text-slate-500">Bereid de rapportversie voor en rond af.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
