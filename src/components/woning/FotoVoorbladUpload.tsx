"use client";

import { useRef, useState } from "react";

function parseUrls(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return [value];
}

async function uploadFile(file: File): Promise<string> {
  if (process.env.NEXT_PUBLIC_USE_SUPABASE === "1") {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/supabase-upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.text()) || "Upload mislukt");
    const json = await res.json();
    return json.publicUrl || json.path || "";
  }

  const presignRes = await fetch("/api/r2-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!presignRes.ok) throw new Error((await presignRes.text()) || "Kon presigned URL niet ophalen");
  const { url, publicUrl } = await presignRes.json();

  const putRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) throw new Error((await putRes.text()) || "Upload naar R2 mislukt");
  return publicUrl || "";
}

async function persistUrls(opdrachtId: number, urls: string[]) {
  await fetch(`/api/opdrachten/${opdrachtId}/woning-fotos`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
}

export default function FotoVoorbladUpload({
  defaultValue,
  opdrachtId,
}: {
  defaultValue?: string | null;
  opdrachtId: number;
}) {
  const [urls, setUrls] = useState<string[]>(() => parseUrls(defaultValue));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploaded = (await Promise.all(files.map(uploadFile))).filter(Boolean);
      const next = [...urls, ...uploaded];
      setUrls(next);
      await persistUrls(opdrachtId, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function remove(index: number) {
    const next = urls.filter((_, i) => i !== index);
    setUrls(next);
    await persistUrls(opdrachtId, next);
  }

  return (
    <div className="grid gap-3">
      {/* Hidden inputs zodat de hoofdform ook de fotos meestuurt bij opslaan */}
      {urls.map((url, i) => (
        <input key={i} type="hidden" name="fotoVoorblad" value={url} />
      ))}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {urls.map((url, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                onClick={() => setLightboxIndex(i)}
                className="h-24 w-24 cursor-zoom-in rounded-xl border border-slate-200 object-cover shadow-sm transition hover:opacity-85 sm:h-28 sm:w-28"
              />
              <button
                type="button"
                onClick={() => setConfirmIndex(i)}
                className="min-h-9 px-3 text-xs font-medium text-slate-400 transition hover:text-red-500 active:text-red-600"
              >
                Verwijderen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload knop — los van de thumbnails, geen label-wrapper */}
      <div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 transition hover:border-blue-300 hover:bg-white disabled:opacity-60"
        >
          {uploading ? "Uploaden..." : urls.length > 0 ? "+ Foto toevoegen" : "Foto toevoegen"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Confirmatie verwijderen */}
      {confirmIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">Foto verwijderen</h2>
            <p className="mt-2 text-sm text-slate-600">
              Weet u zeker dat u deze foto wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmIndex(null)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => { remove(confirmIndex); setConfirmIndex(null); }}
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
              >
                Ja, verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[lightboxIndex]}
            alt={`Foto ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex - 1 + urls.length) % urls.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl text-white transition hover:bg-white/30"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % urls.length);
                }}
                className="absolute right-16 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl text-white transition hover:bg-white/30"
              >
                ›
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
          >
            ✕
          </button>
          {urls.length > 1 && (
            <p className="absolute bottom-4 text-xs text-white/60">
              {lightboxIndex + 1} / {urls.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
