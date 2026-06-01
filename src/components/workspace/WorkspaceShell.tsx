"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigationItems = [
  { href: "details", label: "Details" },
  { href: "woning", label: "Woning" },
  { href: "keuring", label: "Keuring" },
  { href: "meterstanden", label: "Meterstanden" },
  { href: "overzicht", label: "Overzicht" },
  { href: "opdracht", label: "Opdracht" },
  { href: "rapporten", label: "Rapporten" },
] as const;

function statusTone(status: string) {
  switch (status) {
    case "afgerond":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in behandeling":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export default function WorkspaceShell({
  opdrachtId,
  title,
  address,
  status,
  children,
}: {
  opdrachtId: number;
  title: string;
  address: string;
  status: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
              Eigen Huis inspectie
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-xl font-semibold text-slate-950">
                Opdracht #{opdrachtId}
              </h1>
              <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusTone(status)}`}>
                {status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{title} · {address}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              Home
            </Link>
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Werkruimte actief
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:px-6">
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Navigatie</p>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Tabs
              </span>
            </div>
            <div className="grid gap-2 md:hidden">
              {navigationItems.map((item) => {
                const href = `/opdracht/${opdrachtId}/${item.href}`;
                const active = pathname === href;

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <nav className="hidden flex-col gap-2 md:flex">
              {navigationItems.map((item) => {
                const href = `/opdracht/${opdrachtId}/${item.href}`;
                const active = pathname === href;

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs uppercase tracking-[0.3em] opacity-70">
                      {active ? "Actief" : "Open"}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Dossier
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div>
                <p className="text-slate-500">Opdracht</p>
                <p className="font-medium text-white">#{opdrachtId}</p>
              </div>
              <div>
                <p className="text-slate-500">Adres</p>
                <p className="font-medium text-white">{address}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-medium text-white">{status}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
