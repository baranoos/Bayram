"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme, type Theme, type FontSize } from "@/components/ThemeProvider";
import { usePWA } from "@/components/pwa/PWAProvider";
import PasswordInput from "@/components/auth/PasswordInput";

function ThemeCard({
  value,
  label,
  active,
  onClick,
}: {
  value: Theme;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col overflow-hidden rounded-2xl border-2 transition focus:outline-none ${
        active
          ? "border-blue-500 shadow-md shadow-blue-500/20"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-500"
      }`}
    >
      {/* Mini UI preview */}
      <div className="pointer-events-none select-none">
        {value === "light" && <LightPreview />}
        {value === "dark" && <DarkPreview />}
        {value === "system" && <SystemPreview />}
      </div>

      {/* Label row */}
      <div className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium ${
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}>
        <span>{label}</span>
        {active && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] text-white">✓</span>
        )}
      </div>
    </button>
  );
}

function LightPreview() {
  return (
    <div className="h-24 w-full p-2" style={{ backgroundColor: "#e2e8f0" }}>
      <div className="mb-2 flex h-5 items-center gap-1 rounded-md px-2" style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
        <div className="h-2 w-8 rounded" style={{ backgroundColor: "#94a3b8" }} />
        <div className="ml-auto h-2 w-5 rounded" style={{ backgroundColor: "#cbd5e1" }} />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="h-8 rounded-md" style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
          <div className="m-1.5 h-1.5 w-8 rounded" style={{ backgroundColor: "#94a3b8" }} />
          <div className="mx-1.5 h-1.5 w-5 rounded" style={{ backgroundColor: "#cbd5e1" }} />
        </div>
        <div className="h-8 rounded-md" style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
          <div className="m-1.5 h-1.5 w-6 rounded" style={{ backgroundColor: "#94a3b8" }} />
          <div className="mx-1.5 h-1.5 w-8 rounded" style={{ backgroundColor: "#cbd5e1" }} />
        </div>
      </div>
    </div>
  );
}

function DarkPreview() {
  return (
    <div className="h-24 w-full p-2" style={{ backgroundColor: "#0f172a" }}>
      <div className="mb-2 flex h-5 items-center gap-1 rounded-md px-2" style={{ backgroundColor: "#1e293b" }}>
        <div className="h-2 w-8 rounded" style={{ backgroundColor: "#475569" }} />
        <div className="ml-auto h-2 w-5 rounded" style={{ backgroundColor: "#334155" }} />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="h-8 rounded-md" style={{ backgroundColor: "#1e293b" }}>
          <div className="m-1.5 h-1.5 w-8 rounded" style={{ backgroundColor: "#475569" }} />
          <div className="mx-1.5 h-1.5 w-5 rounded" style={{ backgroundColor: "#334155" }} />
        </div>
        <div className="h-8 rounded-md" style={{ backgroundColor: "#1e293b" }}>
          <div className="m-1.5 h-1.5 w-6 rounded" style={{ backgroundColor: "#475569" }} />
          <div className="mx-1.5 h-1.5 w-8 rounded" style={{ backgroundColor: "#334155" }} />
        </div>
      </div>
    </div>
  );
}

function SystemPreview() {
  return (
    <div className="h-24 w-full overflow-hidden" style={{ display: "flex" }}>
      {/* Lichte helft */}
      <div style={{ width: "50%", backgroundColor: "#e2e8f0", padding: "6px" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: 4, height: 14, marginBottom: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", padding: "0 4px", gap: 3 }}>
          <div style={{ backgroundColor: "#94a3b8", borderRadius: 2, height: 4, width: 18 }} />
          <div style={{ backgroundColor: "#cbd5e1", borderRadius: 2, height: 4, width: 10, marginLeft: "auto" }} />
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: 4, flex: 1, height: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.12)", padding: 4 }}>
            <div style={{ backgroundColor: "#94a3b8", borderRadius: 2, height: 4, width: "70%", marginBottom: 3 }} />
            <div style={{ backgroundColor: "#cbd5e1", borderRadius: 2, height: 4, width: "50%" }} />
          </div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: 4, flex: 1, height: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.12)", padding: 4 }}>
            <div style={{ backgroundColor: "#94a3b8", borderRadius: 2, height: 4, width: "60%", marginBottom: 3 }} />
            <div style={{ backgroundColor: "#cbd5e1", borderRadius: 2, height: 4, width: "80%" }} />
          </div>
        </div>
      </div>
      {/* Donkere helft */}
      <div style={{ width: "50%", backgroundColor: "#0f172a", padding: "6px" }}>
        <div style={{ backgroundColor: "#1e293b", borderRadius: 4, height: 14, marginBottom: 4, display: "flex", alignItems: "center", padding: "0 4px", gap: 3 }}>
          <div style={{ backgroundColor: "#475569", borderRadius: 2, height: 4, width: 18 }} />
          <div style={{ backgroundColor: "#334155", borderRadius: 2, height: 4, width: 10, marginLeft: "auto" }} />
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ backgroundColor: "#1e293b", borderRadius: 4, flex: 1, height: 28, padding: 4 }}>
            <div style={{ backgroundColor: "#475569", borderRadius: 2, height: 4, width: "70%", marginBottom: 3 }} />
            <div style={{ backgroundColor: "#334155", borderRadius: 2, height: 4, width: "50%" }} />
          </div>
          <div style={{ backgroundColor: "#1e293b", borderRadius: 4, flex: 1, height: 28, padding: 4 }}>
            <div style={{ backgroundColor: "#475569", borderRadius: 2, height: 4, width: "60%", marginBottom: 3 }} />
            <div style={{ backgroundColor: "#334155", borderRadius: 2, height: 4, width: "80%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
          : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
      }`}
    >
      {children}
    </button>
  );
}

type DeletedOpdracht = {
  id: number;
  opdrachtgeverNaam: string;
  adresStraat: string;
  adresPostcode: string;
  adresPlaats: string;
  updatedAt: string;
};

export default function SettingsPage() {
  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  const { isOnline } = usePWA();
  const router = useRouter();
  const [me, setMe] = useState<{ id: number; email: string | null; role: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletedOpdrachten, setDeletedOpdrachten] = useState<DeletedOpdracht[] | null>(null);
  const [deletedError, setDeletedError] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<number | null>(null);

  function loadDeletedOpdrachten() {
    setDeletedError(null);
    fetch("/api/opdrachten/deleted")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setDeletedOpdrachten(d.opdrachten ?? []);
      })
      .catch(() => setDeletedError("Kon verwijderde opdrachten niet laden"));
  }

  useEffect(() => {
    loadDeletedOpdrachten();
  }, []);

  async function purgeOpdracht(id: number) {
    if (!confirm("Weet u zeker dat u deze opdracht permanent wilt wissen uit de database? Dit kan niet ongedaan worden gemaakt.")) return;
    setPurgingId(id);
    try {
      const res = await fetch(`/api/opdrachten/deleted/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeletedOpdrachten((prev) => prev?.filter((o) => o.id !== id) ?? null);
    } catch {
      setDeletedError("Permanent wissen mislukt");
    } finally {
      setPurgingId(null);
    }
  }

  // Load from localStorage first so the page renders offline
  useEffect(() => {
    try {
      const s = localStorage.getItem("eh-user");
      if (s) setMe(JSON.parse(s));
    } catch {}
  }, []);

  // Refresh from network when online
  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        if (d?.user) {
          setMe(d.user);
          try { localStorage.setItem("eh-user", JSON.stringify(d.user)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Nieuwe wachtwoorden komen niet overeen");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Wachtwoord gewijzigd");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        return;
      }
      setError(data?.error || "Wachtwoord wijzigen mislukt");
    } catch {
      setError("Kon niet verbinden met de server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-8">

      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </button>

      {/* Comfort */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Instellingen</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{me?.email ?? "Account"}</p>

        {me?.role === "OWNER" ? (
          <Link
            href="/settings/gebruikers"
            className="mt-6 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Gebruikersbeheer
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : null}

        {/* Theme cards */}
        <h2 className="mt-8 text-base font-semibold text-slate-900 dark:text-slate-100">Weergave</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kies de kleurmodus die het prettigst werkt.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "light" as Theme, label: "Licht" },
            { value: "dark" as Theme, label: "Donker" },
            { value: "system" as Theme, label: "Systeem" },
          ]).map(({ value, label }) => (
            <ThemeCard
              key={value}
              value={value}
              label={label}
              active={theme === value}
              onClick={() => setTheme(value)}
            />
          ))}
        </div>

        {/* Font size */}
        <h2 className="mt-8 text-base font-semibold text-slate-900 dark:text-slate-100">Lettergrootte</h2>
        <p className="mb-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pas de tekstgrootte aan voor meer leescomfort.
        </p>
        <div className="flex gap-2">
          {(["normaal", "groot"] as FontSize[]).map((f) => (
            <SizeButton key={f} active={fontSize === f} onClick={() => setFontSize(f)}>
              {f === "normaal" ? "Aa Normaal" : "Aa Groot"}
            </SizeButton>
          ))}
        </div>
      </div>

      {/* Wachtwoord */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Wachtwoord wijzigen</h2>
        {!isOnline && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Wachtwoord wijzigen vereist een internetverbinding.
          </p>
        )}
        <form onSubmit={changePassword} className={`mt-4 space-y-4 ${!isOnline ? "pointer-events-none opacity-50" : ""}`}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Huidig wachtwoord
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nieuw wachtwoord
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Bevestig nieuw wachtwoord
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Opslaan…" : "Wachtwoord opslaan"}
          </button>
        </form>
      </div>

      {/* Verwijderde opdrachten */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Verwijderde opdrachten</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Opdrachten die zijn verwijderd staan hier. Ze zijn niet meer zichtbaar op het dashboard.
          Je kunt ze hier permanent wissen uit de database.
        </p>

        {deletedError ? (
          <p className="mt-4 text-sm text-red-600">{deletedError}</p>
        ) : null}

        {deletedOpdrachten === null ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Laden…</p>
        ) : deletedOpdrachten.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Geen verwijderde opdrachten.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
            {deletedOpdrachten.map((opdracht) => (
              <li key={opdracht.id} className="flex items-center justify-between gap-4 py-3">
                <div className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    #{opdracht.id} — {opdracht.opdrachtgeverNaam}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {opdracht.adresStraat}, {opdracht.adresPostcode} {opdracht.adresPlaats}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => purgeOpdracht(opdracht.id)}
                  disabled={purgingId === opdracht.id}
                  className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                >
                  {purgingId === opdracht.id ? "Bezig…" : "Permanent wissen"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
