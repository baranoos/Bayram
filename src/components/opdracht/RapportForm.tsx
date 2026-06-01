"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RapportFormInitial = {
  rapporttype?: string | null;
  representatiefEmail?: string | null;
};

export default function RapportForm({
  opdrachtId,
  initial,
  rapportTypeOptions,
}: {
  opdrachtId: number;
  initial?: RapportFormInitial;
  rapportTypeOptions: string[];
}) {
  const router = useRouter();
  const [rapporttype, setRapporttype] = useState(initial?.rapporttype ?? "");
  const [email, setEmail] = useState(initial?.representatiefEmail ?? "");
  const [errors, setErrors] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  async function submit(intent: string) {
    setLoading(true);
    setErrors(null);
    try {
      const res = await fetch(`/api/opdrachten/${opdrachtId}/rapporten/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent, rapporttype, representatiefEmail: email }),
      });

      if (res.status === 422) {
        const data = await res.json();
        setErrors(data.missing ?? ["Onbekende validatiefout"]);
        return;
      }

      if (!res.ok) throw new Error("Fout bij genereren");

      // success
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrors([message]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Kies een rapporttype
          <select value={rapporttype} onChange={(e) => setRapporttype(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white">
            <option value="">Maak een keuze</option>
            {rapportTypeOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Representatieve e-mail
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-300 focus:bg-white" />
        </label>
      </div>

      {errors ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Let op</p>
          <ul className="mt-2 list-disc pl-4">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onMouseEnter={() => setHovered("genereer")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => submit("genereer")}
          disabled={loading}
          style={{
            backgroundColor: hovered === "genereer" ? "#1e40af" : "#2563eb",
            color: "#fff",
          }}
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm"
        >
          Genereer rapport
        </button>

        <button
          onMouseEnter={() => setHovered("akkoord")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => submit("akkoord")}
          disabled={loading}
          style={{
            backgroundColor: hovered === "akkoord" ? "#047857" : "#059669",
            color: "#fff",
          }}
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm"
        >
          Akkoord en afronden
        </button>

        <button
          onMouseEnter={() => setHovered("niet")}
          onMouseLeave={() => setHovered(null)}
          onClick={() => submit("nietAkkoord")}
          disabled={loading}
          style={{
            backgroundColor: hovered === "niet" ? "#b91c1c" : "#ef4444",
            color: "#fff",
          }}
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm"
        >
          Niet akkoord
        </button>
      </div>
    </div>
  );
}
