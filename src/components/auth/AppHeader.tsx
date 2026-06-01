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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="text-sm font-semibold text-slate-900">
          Eigen Huis
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {me ? (
            <>
              <span className="hidden text-slate-500 sm:inline">{me.email ?? "Gebruiker"}</span>
              <Link href="/settings" className="text-slate-600 hover:text-blue-700">
                Instellingen
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300"
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
