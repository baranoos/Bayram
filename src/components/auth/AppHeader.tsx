"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Me = { id: number; email: string | null; role: string } | null;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Eigen Huis
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {me ? (
            <>
              <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">{me.email ?? "Gebruiker"}</span>
              <Link href="/settings" className="text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400">
                Instellingen
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
              >
                Uitloggen
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
