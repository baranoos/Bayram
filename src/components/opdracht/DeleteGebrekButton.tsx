"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteGebrekButton({ gebrekId }: { gebrekId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Weet je zeker dat je dit gebrek wilt verwijderen?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gebreken/${gebrekId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Verwijderen mislukt");
      router.refresh();
    } catch (err) {
      alert(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-medium text-rose-600 transform transition duration-150 ease-in-out hover:bg-rose-100 hover:text-rose-700 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
      </svg>
      Verwijderen
    </button>
  );
}
