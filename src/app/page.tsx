import Link from "next/link";
import { formatDateTime, getDashboardOpdrachten, getStatusLabel } from "@/lib/opdrachten";

function statusClasses(status: string) {
  switch (status) {
    case "afgerond":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in behandeling":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export default async function Home() {
  const { opdrachten, error: databaseError } = await getDashboardOpdrachten();
  const openCount = opdrachten.filter((opdracht) => opdracht.status !== "afgerond").length;
  const activeCount = opdrachten.filter((opdracht) => opdracht.status === "in behandeling").length;

  return (
    <main className="mx-auto min-h-screen max-w-screen-2xl px-4 py-6 lg:px-6">
      {/* Hero header */}
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
            Eigen Huis inspectie
          </p>
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Opdrachtenoverzicht</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Professioneel dashboard voor woninginspecties, keuringsdossiers en rapportage.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/opdracht/nieuw"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Nieuwe opdracht
          </Link>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400">
            {opdrachten.length} dossiers zichtbaar
          </div>
        </div>
      </div>

      {databaseError ? (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          De database is nu niet bereikbaar, dus het dashboard toont tijdelijk geen opdrachten.
          Controleer of je Supabase DATABASE_URL klopt en of de database online is.
        </div>
      ) : null}

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Open dossiers</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{openCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">In behandeling</p>
          <p className="mt-2 text-3xl font-semibold text-blue-700 dark:text-blue-400">{activeCount}</p>
        </div>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Opdrachten</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Klik een opdracht open om naar de dossierwerkruimte te gaan.</p>
        </div>

        {opdrachten.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">Nog geen opdrachten aanwezig</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Maak een nieuwe opdracht aan om het inspectiedossier te starten.</p>
            <div className="mt-6">
              <Link
                href="/opdracht/nieuw"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Eerste opdracht toevoegen
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800/80">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4">Opdracht</th>
                    <th className="px-6 py-4">Opdrachtgever</th>
                    <th className="px-6 py-4">Woning</th>
                    <th className="px-6 py-4">Adres</th>
                    <th className="px-6 py-4">Aangemaakt</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {opdrachten.map((opdracht) => (
                    <tr key={opdracht.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <Link href={`/opdracht/${opdracht.id}/details`} className="font-semibold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400">
                          #{opdracht.id}
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{getStatusLabel(opdracht.status)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{opdracht.opdrachtgeverNaam}</div>
                        <div className="text-slate-500 dark:text-slate-400">{opdracht.opdrachtgeverEmail ?? "Geen e-mail"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {opdracht.woning?.typeWoning ?? opdracht.typeWoning ?? "-"}
                        {opdracht.woning?.woningGrootte ? (
                          <div className="text-slate-500 dark:text-slate-400">{opdracht.woning.woningGrootte}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        <div>{opdracht.adresStraat}</div>
                        <div className="text-slate-500 dark:text-slate-400">{opdracht.adresPostcode} {opdracht.adresPlaats}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{formatDateTime(opdracht.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(opdracht.status)}`}>
                          {getStatusLabel(opdracht.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {opdrachten.map((opdracht) => (
                <Link
                  key={opdracht.id}
                  href={`/opdracht/${opdracht.id}/details`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white dark:border-slate-700 dark:bg-slate-700/50 dark:hover:border-blue-500 dark:hover:bg-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Opdracht #{opdracht.id}</p>
                      <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{opdracht.opdrachtgeverNaam}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{opdracht.adresStraat}, {opdracht.adresPlaats}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(opdracht.status)}`}>
                      {getStatusLabel(opdracht.status)}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>{opdracht.woning?.typeWoning ?? opdracht.typeWoning ?? "Woning"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
