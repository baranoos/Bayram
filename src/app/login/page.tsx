"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("from") || "/";

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.ok) {
        router.push(redirectTo.startsWith("/login") ? "/" : redirectTo);
        router.refresh();
        return;
      }
      setError(data?.error || "Inloggen mislukt");
    } catch {
      setError("Kon niet verbinden met de server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Eigen Huis</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Inloggen</h1>
        <p className="mt-2 mb-6 text-sm text-slate-500">Log in met je e-mailadres en wachtwoord.</p>

        <form onSubmit={submitLogin}>
          <label className="mb-4 block text-sm font-medium text-slate-700">
            E-mail
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-slate-900"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="mb-4 block text-sm font-medium text-slate-700">
            Wachtwoord
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 p-3 text-slate-900"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}

          <button
            className="w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Even geduld…" : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
          Laden…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
