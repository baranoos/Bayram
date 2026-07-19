"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SafeUser = {
  id: number;
  name: string | null;
  email: string | null;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });

function fmt(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

function roleLabel(role: string) {
  return role === "OWNER" ? "Eigenaar" : "Medewerker";
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        role === "OWNER"
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      {roleLabel(role)}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {active ? "Actief" : "Inactief"}
    </span>
  );
}

const fieldInputClass = "mt-1 block w-full rounded-xl border border-slate-200 p-3 dark:border-slate-600 dark:bg-slate-900";

function ModalActions({ onCancel, submitLabel, loading }: { onCancel: () => void; submitLabel: string; loading: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        Annuleren
      </button>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Bezig…" : submitLabel}
      </button>
    </div>
  );
}

function RowActions({
  user,
  isSelf,
  busy,
  open,
  onToggle,
  onClose,
  onEdit,
  onResetPassword,
  onToggleActive,
  onDelete,
}: {
  user: SafeUser;
  isSelf: boolean;
  busy: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const iconButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700";
  const menuItemClass =
    "flex w-full items-center rounded-xl px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <div className="flex items-center justify-end gap-1.5" ref={containerRef}>
      <button type="button" onClick={onEdit} aria-label="Bewerken" title="Bewerken" className={iconButtonClass}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.06 2.06 0 112.914 2.914L7.5 19.677l-4 1 1-4L16.862 4.487z" />
        </svg>
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Meer acties"
          aria-haspopup="menu"
          aria-expanded={open}
          className={iconButtonClass}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-600 dark:bg-slate-800"
          >
            <button type="button" role="menuitem" onClick={onResetPassword} className={menuItemClass}>
              Wachtwoord resetten
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={isSelf || busy}
              onClick={onToggleActive}
              className={`${menuItemClass} text-amber-700 dark:text-amber-400`}
            >
              {user.active ? "Deactiveren" : "Activeren"}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={isSelf || busy}
              onClick={onDelete}
              className={`${menuItemClass} text-red-600 dark:text-red-400`}
            >
              Verwijderen
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ModalState =
  | { type: "create" }
  | { type: "edit"; user: SafeUser }
  | { type: "reset"; user: SafeUser }
  | null;

export default function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: SafeUser[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [modal, setModal] = useState<ModalState>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setUsers(d.users ?? []);
    } catch {
      setListError("Kon gebruikers niet vernieuwen");
    }
  }

  async function toggleActive(user: SafeUser) {
    const verb = user.active ? "deactiveren" : "activeren";
    if (!confirm(`Weet u zeker dat u ${user.email ?? user.username} wilt ${verb}?`)) return;
    setBusyId(user.id);
    setListError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Actie mislukt");
      await refresh();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Actie mislukt");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: SafeUser) {
    if (!confirm(`Weet u zeker dat u ${user.email ?? user.username} permanent wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    setBusyId(user.id);
    setListError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || "Verwijderen mislukt");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Verwijderen mislukt");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Gebruikers</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Beheer wie kan inloggen in het bedrijfsaccount · {users.length} {users.length === 1 ? "gebruiker" : "gebruikers"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
          >
            + Nieuwe gebruiker
          </button>
        </div>

        {listError ? <p className="mt-4 text-sm text-red-600">{listError}</p> : null}

        {/* Desktop table — normal laptop/monitor widths and up */}
        <div className="mt-6 hidden xl:block">
          <table className="w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aangemaakt</th>
                <th className="px-4 py-3">Laatste login</th>
                <th className="px-4 py-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const busy = busyId === user.id;
                return (
                  <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3.5">
                      <p className="max-w-45 truncate font-medium text-slate-900 dark:text-slate-100" title={user.name ?? undefined}>
                        {user.name || "—"}
                      </p>
                      {isSelf ? <span className="text-xs text-slate-400">(jij)</span> : null}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="max-w-60 truncate text-slate-600 dark:text-slate-300" title={user.email ?? undefined}>
                        {user.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge active={user.active} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{fmt(user.createdAt)}</td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{fmt(user.lastLoginAt)}</td>
                    <td className="px-4 py-3.5">
                      <RowActions
                        user={user}
                        isSelf={isSelf}
                        busy={busy}
                        open={openMenuId === user.id}
                        onToggle={() => setOpenMenuId((id) => (id === user.id ? null : user.id))}
                        onClose={() => setOpenMenuId((id) => (id === user.id ? null : id))}
                        onEdit={() => {
                          setOpenMenuId(null);
                          setModal({ type: "edit", user });
                        }}
                        onResetPassword={() => {
                          setOpenMenuId(null);
                          setModal({ type: "reset", user });
                        }}
                        onToggleActive={() => {
                          setOpenMenuId(null);
                          toggleActive(user);
                        }}
                        onDelete={() => {
                          setOpenMenuId(null);
                          deleteUser(user);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards — phones, and tablets in both orientations */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:hidden">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const busy = busyId === user.id;
            return (
              <div
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
                      {user.name || "—"}
                      {isSelf ? <span className="ml-1.5 text-xs font-normal text-slate-400">(jij)</span> : null}
                    </p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email ?? "—"}</p>
                  </div>
                  <RowActions
                    user={user}
                    isSelf={isSelf}
                    busy={busy}
                    open={openMenuId === user.id}
                    onToggle={() => setOpenMenuId((id) => (id === user.id ? null : user.id))}
                    onClose={() => setOpenMenuId((id) => (id === user.id ? null : id))}
                    onEdit={() => {
                      setOpenMenuId(null);
                      setModal({ type: "edit", user });
                    }}
                    onResetPassword={() => {
                      setOpenMenuId(null);
                      setModal({ type: "reset", user });
                    }}
                    onToggleActive={() => {
                      setOpenMenuId(null);
                      toggleActive(user);
                    }}
                    onDelete={() => {
                      setOpenMenuId(null);
                      deleteUser(user);
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <RoleBadge role={user.role} />
                  <StatusBadge active={user.active} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-200 pt-3 text-sm dark:border-slate-600">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Aangemaakt</dt>
                    <dd className="mt-0.5 text-slate-600 dark:text-slate-300">{fmt(user.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Laatste login</dt>
                    <dd className="mt-0.5 text-slate-600 dark:text-slate-300">{fmt(user.lastLoginAt)}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </div>

      {modal?.type === "create" ? (
        <CreateUserModal onClose={() => setModal(null)} onCreated={refresh} />
      ) : null}
      {modal?.type === "edit" ? (
        <EditUserModal user={modal.user} onClose={() => setModal(null)} onSaved={refresh} />
      ) : null}
      {modal?.type === "reset" ? (
        <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} />
      ) : null}
    </>
  );
}

function ModalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Aanmaken mislukt");
      await onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmaken mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title="Nieuwe gebruiker">
      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Naam
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldInputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          E-mail
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={fieldInputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Wachtwoord
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required className={fieldInputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)} className={fieldInputClass}>
            <option value="EMPLOYEE">Medewerker</option>
            <option value="OWNER">Eigenaar</option>
          </select>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <ModalActions onCancel={onClose} submitLabel="Aanmaken" loading={loading} />
      </form>
    </ModalShell>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: SafeUser;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Opslaan mislukt");
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title={`${user.email ?? user.username} bewerken`}>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Naam
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldInputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          E-mail
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={fieldInputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)} className={fieldInputClass}>
            <option value="EMPLOYEE">Medewerker</option>
            <option value="OWNER">Eigenaar</option>
          </select>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <ModalActions onCancel={onClose} submitLabel="Opslaan" loading={loading} />
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({ user, onClose }: { user: SafeUser; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Resetten mislukt");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resetten mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title={`Wachtwoord resetten voor ${user.email ?? user.username}`}>
      {done ? (
        <>
          <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">Wachtwoord is gewijzigd.</p>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Sluiten
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nieuw wachtwoord
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" minLength={8} required className={fieldInputClass} />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <ModalActions onCancel={onClose} submitLabel="Wachtwoord opslaan" loading={loading} />
        </form>
      )}
    </ModalShell>
  );
}

