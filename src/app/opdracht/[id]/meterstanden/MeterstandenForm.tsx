"use client";

import { useState } from "react";
import SectionCard from "@/components/workspace/SectionCard";
import { usePWA } from "@/components/pwa/PWAProvider";

const METER_FIELDS = [
  { name: "elektraI",       label: "Elektra I" },
  { name: "elektraII",      label: "Elektra II" },
  { name: "elektraRetourI", label: "Elektra retour I" },
  { name: "elektraRetourII",label: "Elektra retour II" },
  { name: "water",          label: "Water" },
  { name: "warmte",         label: "Warmte" },
  { name: "warmwater",      label: "Warmwater" },
  { name: "koeling",        label: "Koeling" },
  { name: "gas",            label: "Gas" },
] as const;

type FieldName = (typeof METER_FIELDS)[number]["name"];

type InitialValues = Partial<Record<FieldName, string | null>>;

interface Props {
  opdrachtId:    number;
  initialValues: InitialValues;
}

type SaveState = "idle" | "saving" | "saved" | "queued" | "error";

export default function MeterstandenForm({ opdrachtId, initialValues }: Props) {
  const { isOnline, enqueue } = usePWA();

  const [values, setValues] = useState<Record<FieldName, string>>(() => {
    const init: Record<string, string> = {};
    for (const { name } of METER_FIELDS) {
      init[name] = initialValues[name] ?? "";
    }
    return init as Record<FieldName, string>;
  });

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg,  setErrorMsg ] = useState<string | null>(null);

  function handleChange(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body: Record<string, string | null> = {};
    for (const { name } of METER_FIELDS) {
      body[name] = values[name].trim() || null;
    }

    setSaveState("saving");
    setErrorMsg(null);

    if (!isOnline) {
      try {
        await enqueue({
          url:         `/api/opdrachten/${opdrachtId}/meterstanden`,
          method:      "PUT",
          body:        JSON.stringify(body),
          type:        "meterstand",
          description: `Meterstanden (opdracht #${opdrachtId})`,
          opdrachtId,
        });
        setSaveState("queued");
      } catch {
        setSaveState("error");
        setErrorMsg("Opslaan in offline wachtrij mislukt. Probeer opnieuw.");
      }
      return;
    }

    try {
      const response = await fetch(`/api/opdrachten/${opdrachtId}/meterstanden`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      // 202 = queued by service worker when network failed mid-request
      const isQueued = response.headers.get("X-Offline-Queue") === "true";

      if (!response.ok && response.status !== 202) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      setSaveState(isQueued ? "queued" : "saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Opslaan mislukt. Probeer opnieuw.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard
        title="Meterstanden"
        description="Registreer de beginstanden van alle relevante aansluitingen."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {METER_FIELDS.map(({ name, label }) => (
            <label key={name} className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
              <input
                name={name}
                value={values[name]}
                onChange={(e) => handleChange(name, e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-700 dark:bg-slate-700/50 dark:text-white dark:focus:bg-slate-700"
              />
            </label>
          ))}
        </div>
      </SectionCard>

      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-end gap-4">
        {saveState === "saved" && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            Meterstanden opgeslagen ✓
          </span>
        )}
        {saveState === "queued" && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            Opgeslagen offline — wordt gesynchroniseerd zodra verbinding terugkomt ⏳
          </span>
        )}
        {!isOnline && saveState === "idle" && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Offline modus</span>
        )}
        <button
          type="submit"
          disabled={saveState === "saving"}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveState === "saving" ? "Opslaan…" : "Meterstanden opslaan"}
        </button>
      </div>
    </form>
  );
}
