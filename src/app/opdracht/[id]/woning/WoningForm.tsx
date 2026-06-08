"use client";

import { useRef, useState } from "react";
import SectionCard from "@/components/workspace/SectionCard";
import FotoVoorbladUpload from "@/components/woning/FotoVoorbladUpload";
import { usePWA } from "@/components/pwa/PWAProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WoningFormOptions {
  woningType:       string[];
  woningGrootte:    string[];
  bouwwijze:        string[];
  garantieRegeling: string[];
  weather:          string[];
  inregelrapport:   string[];
  energielabel:     string[];
  beglazing:        string[];
}

export interface WoningInitialValues {
  objectNaam?:                    string | null;
  projectNaam?:                   string | null;
  typeWoning?:                    string | null;
  woningGrootte?:                 string | null;
  bouwwijze?:                     string | null;
  bouwjaar?:                      number | null;
  omschrijving?:                  string | null;
  bouwer?:                        string | null;
  vestigingsplaatsBouwer?:        string | null;
  contractpartij?:                string | null;
  vestigingsplaatsContractpartij?: string | null;
  vertegenwoordiger?:             string | null;
  weersomstandigheden?:           string | null;
  inregelrapportMvwtw?:           string | null;
  energielabel?:                  string | null;
  beglazing?:                     string | null;
  opmerkingen?:                   string | null;
  garantieRegeling?:              string | null;
  omstandigheidItems?:            Array<{ id: number; label: string; waarde: string; toelichting: string | null }>;
  fotoVoorbladPad?:               string | null;
  opdrachtTypeWoning?:            string | null;
}

interface Props {
  opdrachtId:    number;
  initialValues: WoningInitialValues;
  options:       WoningFormOptions;
}

type SaveState = "idle" | "saving" | "saved" | "queued" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export default function WoningForm({ opdrachtId, initialValues, options }: Props) {
  const { isOnline, enqueue } = usePWA();
  const formRef = useRef<HTMLFormElement>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg,  setErrorMsg ] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formRef.current) return;

    const fd = new FormData(formRef.current);

    // Collect all fotoVoorblad hidden-input values (injected by FotoVoorbladUpload)
    const fotoUrls = fd.getAll("fotoVoorblad") as string[];
    const fotoVoorbladPad = fotoUrls.length > 0 ? JSON.stringify(fotoUrls) : null;

    const body = {
      objectNaam:                    fd.get("objectNaam")?.toString().trim() || null,
      projectNaam:                   fd.get("projectNaam")?.toString().trim() || null,
      typeWoning:                    fd.get("typeWoning")?.toString().trim() || null,
      woningGrootte:                 fd.get("woningGrootte")?.toString().trim() || null,
      bouwwijze:                     fd.get("bouwwijze")?.toString().trim() || null,
      bouwjaar:                      fd.get("bouwjaar")?.toString().trim() || null,
      omschrijving:                  fd.get("omschrijving")?.toString().trim() || null,
      bouwer:                        fd.get("bouwer")?.toString().trim() || null,
      vestigingsplaatsBouwer:        fd.get("vestigingsplaatsBouwer")?.toString().trim() || null,
      contractpartij:                fd.get("contractpartij")?.toString().trim() || null,
      vestigingsplaatsContractpartij: fd.get("vestigingsplaatsContractpartij")?.toString().trim() || null,
      vertegenwoordiger:             fd.get("vertegenwoordiger")?.toString().trim() || null,
      weersomstandigheden:           fd.get("weersomstandigheden")?.toString().trim() || null,
      inregelrapportMvwtw:           fd.get("inregelrapport")?.toString().trim() || null,
      energielabel:                  fd.get("energielabel")?.toString().trim() || null,
      beglazing:                     fd.get("beglazing")?.toString().trim() || null,
      opmerkingen:                   fd.get("opmerkingen")?.toString().trim() || null,
      garantieRegeling:              fd.get("garantieRegeling")?.toString().trim() || null,
      fotoVoorbladPad,
    };

    setSaveState("saving");
    setErrorMsg(null);

    // ── Offline path ──────────────────────────────────────────────────────────
    if (!isOnline) {
      try {
        await enqueue({
          url:         `/api/opdrachten/${opdrachtId}/woning`,
          method:      "PUT",
          body:        JSON.stringify(body),
          type:        "woning",
          description: `Woninggegevens (opdracht #${opdrachtId})`,
          opdrachtId,
        });
        setSaveState("queued");
      } catch {
        setSaveState("error");
        setErrorMsg("Opslaan in offline wachtrij mislukt. Probeer opnieuw.");
      }
      return;
    }

    // ── Online path ───────────────────────────────────────────────────────────
    try {
      const response = await fetch(`/api/opdrachten/${opdrachtId}/woning`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

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

  const iv = initialValues;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

      {/* ── Object ─────────────────────────────────────────────────────────── */}
      <SectionCard title="Object" description="Objectgegevens van het inspectiedossier.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Foto voorblad
            {isOnline ? (
              <FotoVoorbladUpload defaultValue={iv.fotoVoorbladPad} opdrachtId={opdrachtId} />
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Foto uploaden vereist internetverbinding.
              </p>
            )}
          </div>

          <SelectField
            name="typeWoning"
            label="Type woning*"
            defaultValue={iv.typeWoning ?? iv.opdrachtTypeWoning ?? ""}
            options={options.woningType}
          />
          <SelectField
            name="woningGrootte"
            label="Woninggrootte"
            defaultValue={iv.woningGrootte ?? ""}
            options={options.woningGrootte}
          />
          <SelectField
            name="bouwwijze"
            label="Bouwwijze*"
            defaultValue={iv.bouwwijze ?? ""}
            options={options.bouwwijze}
          />
          <SelectField
            name="garantieRegeling"
            label="Garantie regeling"
            defaultValue={iv.garantieRegeling ?? ""}
            options={options.garantieRegeling}
          />
          <TextField name="objectNaam"   label="Objectnaam"   defaultValue={iv.objectNaam   ?? ""} />
          <TextField name="projectNaam"  label="Projectnaam"  defaultValue={iv.projectNaam  ?? ""} />
          <TextField
            name="bouwjaar"
            label="Bouwjaar"
            defaultValue={iv.bouwjaar?.toString() ?? ""}
            type="number"
          />
        </div>
      </SectionCard>

      {/* ── Projectgegevens ────────────────────────────────────────────────── */}
      <SectionCard title="Projectgegevens" description="Context van het project en het bouwwerk.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
            Omschrijving
            <input
              name="omschrijving"
              defaultValue={iv.omschrijving ?? ""}
              className={inputClass}
            />
          </label>
          <TextField name="bouwer"                        label="Bouwer"                         defaultValue={iv.bouwer                        ?? ""} />
          <TextField name="vestigingsplaatsBouwer"        label="Vestigingsplaats bouwer"        defaultValue={iv.vestigingsplaatsBouwer        ?? ""} />
          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
            Contractpartij*
            <input name="contractpartij" defaultValue={iv.contractpartij ?? ""} className={inputClass} />
          </label>
          <TextField name="vestigingsplaatsContractpartij" label="Vestigingsplaats contractpartij*" defaultValue={iv.vestigingsplaatsContractpartij ?? ""} />
          <TextField name="vertegenwoordiger"              label="Vertegenwoordiger*"               defaultValue={iv.vertegenwoordiger              ?? ""} />
        </div>
      </SectionCard>

      {/* ── Omstandigheden ─────────────────────────────────────────────────── */}
      <SectionCard title="Omstandigheden" description="Inspectieomstandigheden en aanvullende aandachtspunten.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <SelectField
              name="weersomstandigheden"
              label="Weersomstandigheden"
              defaultValue={iv.weersomstandigheden ?? ""}
              options={options.weather}
            />
            <SelectField
              name="inregelrapport"
              label="Inregelrapport MV/WTW *"
              defaultValue={iv.inregelrapportMvwtw ?? ""}
              options={options.inregelrapport}
            />
            <SelectField
              name="energielabel"
              label="Energielabel *"
              defaultValue={iv.energielabel ?? ""}
              options={options.energielabel}
            />
            <SelectField
              name="beglazing"
              label="Beglazing"
              defaultValue={iv.beglazing ?? ""}
              options={options.beglazing}
            />
            <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Opmerkingen / bijzonderheden
              <textarea
                name="opmerkingen"
                defaultValue={iv.opmerkingen ?? ""}
                rows={4}
                className={inputClass}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/30">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Geregistreerde omstandigheden
            </p>
            <div className="mt-4 space-y-3">
              {(iv.omstandigheidItems ?? []).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nog geen afzonderlijke omstandigheden geregistreerd.
                </p>
              ) : (
                iv.omstandigheidItems!.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.waarde}</p>
                    </div>
                    {item.toelichting ? (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.toelichting}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Status / submit ────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-end gap-4">
        {saveState === "saved" && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            Woninggegevens opgeslagen ✓
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
          {saveState === "saving" ? "Opslaan…" : "Woninggegevens opslaan"}
        </button>
      </div>
    </form>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

const inputClass =
  "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-700 dark:bg-slate-700/50 dark:text-white dark:focus:bg-slate-700";

const selectClass =
  "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white dark:border-slate-700 dark:bg-slate-700/50 dark:text-white dark:focus:bg-slate-700";

function TextField({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} className={inputClass} />
    </label>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      <select name={name} defaultValue={defaultValue} className={selectClass}>
        <option value="">Maak een keuze</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
