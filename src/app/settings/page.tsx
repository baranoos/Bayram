"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [me, setMe] = useState<{ id: number; email: string | null; role: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user || null));
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

  if (!me) {
    return <div className="p-6 text-sm text-slate-500">Laden…</div>;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Instellingen</h1>
        <p className="mt-1 text-sm text-slate-500">{me.email ?? "Account"}</p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Wachtwoord wijzigen</h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Huidig wachtwoord
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Nieuw wachtwoord
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Bevestig nieuw wachtwoord
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3"
              type="password"
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
    </main>
  );
}
