"use client";

import { useState } from "react";
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Gebruikers</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Beheer wie kan inloggen in het bedrijfsaccount.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            + Nieuwe gebruiker
          </button>
        </div>

        {listError ? <p className="mt-4 text-sm text-red-600">{listError}</p> : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4">Naam</th>
                <th className="py-3 pr-4">E-mail</th>
                <th className="py-3 pr-4">Rol</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Aangemaakt</th>
                <th className="py-3 pr-4">Laatste login</th>
                <th className="py-3 pr-4 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const busy = busyId === user.id;
                return (
                  <tr key={user.id}>
                    <td className="py-3 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {user.name || "—"}
                      {isSelf ? <span className="ml-2 text-xs font-normal text-slate-400">(jij)</span> : null}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-600 dark:text-slate-300">{user.email ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                          user.role === "OWNER"
                            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                          user.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {user.active ? "Actief" : "Inactief"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-500 dark:text-slate-400">{fmt(user.createdAt)}</td>
                    <td className="py-3 pr-4 text-sm text-slate-500 dark:text-slate-400">{fmt(user.lastLoginAt)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModal({ type: "edit", user })}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-600 dark:text-slate-200"
                        >
                          Bewerken
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ type: "reset", user })}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-600 dark:text-slate-200"
                        >
                          Wachtwoord resetten
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || busy}
                          onClick={() => toggleActive(user)}
                          className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-800 dark:text-amber-300"
                        >
                          {user.active ? "Deactiveren" : "Activeren"}
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || busy}
                          onClick={() => deleteUser(user)}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-800 dark:text-red-400"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

