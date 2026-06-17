"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePWA } from "@/components/pwa/PWAProvider";

const SignaturePad = dynamic(() => import("./SignaturePad"), { ssr: false });

const RAPPORT_TYPES = ["Schaduwrapport", "Proces-verbaal", "Opname"] as const;
type RapportType = (typeof RAPPORT_TYPES)[number];

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function RapportForm({ opdrachtId }: { opdrachtId: number }) {
  const router = useRouter();
  const { isOnline: pwaIsOnline } = usePWA();
  // Treat as online until the component has mounted on the client.
  // Prevents SSR/hydration mismatch: server has no navigator.onLine.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isOnline = mounted ? pwaIsOnline : true;
  const [rapporttype, setRapporttype] = useState<string>("");
  const [email, setEmail] = useState("");
  const [sigClient, setSigClient] = useState<string | null>(null);
  const [sigRep, setSigRep] = useState<string | null>(null);
  const [openPad, setOpenPad] = useState<"client" | "representative" | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState<number | null>(null);

  const isProcesVerbaal = rapporttype === "Proces-verbaal";

  const procesVerbaalReady =
    !isProcesVerbaal ||
    (sigClient !== null && sigRep !== null && isValidEmail(email));

  async function submit(intent: string) {
    if (!rapporttype) {
      setErrors(["Selecteer eerst een rapporttype."]);
      return;
    }
    if (isProcesVerbaal && !isValidEmail(email)) {
      setErrors(["Voer een geldig e-mailadres in voor de vertegenwoordiger."]);
      return;
    }
    if (isProcesVerbaal && (!sigClient || !sigRep)) {
      setErrors(["Voeg beide handtekeningen toe voor een Proces-verbaal."]);
      return;
    }

    setLoading(true);
    setErrors(null);
    setGeneratedId(null);

    try {
      const res = await fetch(`/api/opdrachten/${opdrachtId}/rapporten/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent,
          rapporttype,
          representatiefEmail: email || null,
          signatureClient: sigClient,
          signatureRepresentative: sigRep,
        }),
      });

      if (res.status === 422) {
        const data = await res.json();
        setErrors(data.missing ?? ["Onbekende validatiefout"]);
        return;
      }
      if (!res.ok) throw new Error("Fout bij genereren rapport");

      const data = await res.json();
      const newId: number | null = data.rapport?.id ?? null;
      setGeneratedId(newId);
      router.refresh();
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : String(err)]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Form row ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Kies een rapporttype
          <select
            value={rapporttype}
            onChange={(e) => {
              setRapporttype(e.target.value as RapportType | "");
              setGeneratedId(null);
              setErrors(null);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Maak een keuze…</option>
            {RAPPORT_TYPES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          E-mail vertegenwoordiger{isProcesVerbaal && <span className="text-rose-500"> *</span>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="naam@bedrijf.nl"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      </div>

      {/* ── Signature section (Proces-verbaal only) ── */}
      {isProcesVerbaal && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Handtekeningen{" "}
            <span className="font-normal text-slate-500">— vereist voor Proces-verbaal</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Klant */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">De Verkrijger (Klant)</span>
              {sigClient ? (
                <div className="relative rounded-2xl border border-slate-200 bg-white p-2">
                  <img src={sigClient} alt="Handtekening klant" className="h-24 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setSigClient(null)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs text-slate-500 hover:text-rose-600"
                  >
                    Verwijder
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenPad("client")}
                  className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                >
                  + Handtekening zetten
                </button>
              )}
            </div>

            {/* Vertegenwoordiger */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">De Contractpartij (Vertegenwoordiger)</span>
              {sigRep ? (
                <div className="relative rounded-2xl border border-slate-200 bg-white p-2">
                  <img src={sigRep} alt="Handtekening vertegenwoordiger" className="h-24 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setSigRep(null)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs text-slate-500 hover:text-rose-600"
                  >
                    Verwijder
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenPad("representative")}
                  className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                >
                  + Handtekening zetten
                </button>
              )}
            </div>
          </div>

          {!procesVerbaalReady && (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
              Voeg beide handtekeningen toe en een geldig e-mailadres om te kunnen genereren.
            </p>
          )}
        </div>
      )}

      {/* ── Errors ── */}
      {errors && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
          <p className="font-semibold">Let op</p>
          <ul className="mt-2 list-disc pl-4">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── Success banner: download just-generated rapport ── */}
      {generatedId !== null && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Rapport aangemaakt — ook terug te vinden in de Historie hieronder.
          </span>
          <a
            href={`/api/opdrachten/${opdrachtId}/rapporten/${generatedId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </a>
        </div>
      )}

      {/* ── Offline melding ── */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Internetverbinding vereist om een rapport te genereren. Verbind eerst met internet.
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => submit("genereer")}
          disabled={!isOnline || loading || !rapporttype || !procesVerbaalReady}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isOnline ? "Genereer rapport" : "Online vereist"}
        </button>

        <button
          type="button"
          onClick={() => submit("akkoord")}
          disabled={!isOnline || loading || !rapporttype || !procesVerbaalReady}
          className="inline-flex items-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Akkoord en afronden
        </button>

        <button
          type="button"
          onClick={() => submit("nietAkkoord")}
          disabled={!isOnline || loading || !rapporttype}
          className="inline-flex items-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Niet akkoord
        </button>
      </div>

      {/* ── Signature pad modal ── */}
      {openPad === "client" && (
        <SignaturePad
          label="Handtekening — De Verkrijger (Klant)"
          onSave={(b64) => { setSigClient(b64); setOpenPad(null); }}
          onClose={() => setOpenPad(null)}
        />
      )}
      {openPad === "representative" && (
        <SignaturePad
          label="Handtekening — De Contractpartij (Vertegenwoordiger)"
          onSave={(b64) => { setSigRep(b64); setOpenPad(null); }}
          onClose={() => setOpenPad(null)}
        />
      )}
    </div>
  );
}
