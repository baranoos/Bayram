"use client";

import { useState } from "react";

type Modal = "afronden" | "verwijderen" | null;

export default function OpdrachtActieKnoppen({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [modal, setModal] = useState<Modal>(null);

  function triggerHidden(id: string) {
    (document.getElementById(id) as HTMLButtonElement | null)?.click();
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="submit"
          form="opdracht-main-form"
          name="intent"
          value="save"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        >
          Opslaan
        </button>
        <button
          type="button"
          onClick={() => setModal("afronden")}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Afronden
        </button>
        <button
          type="button"
          onClick={() => setModal("verwijderen")}
          className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
        >
          Verwijderen
        </button>
      </div>

      {/* Verborgen submit-knop voor "Afronden" — wordt aangeroepen vanuit de modal */}
      <button
        id="btn-finish-hidden"
        type="submit"
        form="opdracht-main-form"
        name="intent"
        value="finish"
        className="hidden"
        aria-hidden
      />

      {/* Verborgen formulier voor verwijderen */}
      <form action={deleteAction}>
        <button id="btn-delete-hidden" type="submit" className="hidden" aria-hidden />
      </form>

      {/* Confirmatie-modal: Afronden */}
      {modal === "afronden" && (
        <ConfirmatieModal
          titel="Opdracht afronden"
          tekst="Weet u zeker dat u deze opdracht wilt afronden? De status wordt gewijzigd naar afgerond."
          bevestigLabel="Ja, afronden"
          bevestigKlasse="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
          onBevestig={() => {
            setModal(null);
            triggerHidden("btn-finish-hidden");
          }}
          onAnnuleer={() => setModal(null)}
        />
      )}

      {/* Confirmatie-modal: Verwijderen */}
      {modal === "verwijderen" && (
        <ConfirmatieModal
          titel="Opdracht verwijderen"
          tekst="Weet u zeker dat u deze opdracht definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
          bevestigLabel="Ja, verwijderen"
          bevestigKlasse="bg-red-600 hover:bg-red-700 shadow-red-600/20"
          onBevestig={() => {
            setModal(null);
            triggerHidden("btn-delete-hidden");
          }}
          onAnnuleer={() => setModal(null)}
        />
      )}
    </>
  );
}

function ConfirmatieModal({
  titel,
  tekst,
  bevestigLabel,
  bevestigKlasse,
  onBevestig,
  onAnnuleer,
}: {
  titel: string;
  tekst: string;
  bevestigLabel: string;
  bevestigKlasse: string;
  onBevestig: () => void;
  onAnnuleer: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">{titel}</h2>
        <p className="mt-2 text-sm text-slate-600">{tekst}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onAnnuleer}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={onBevestig}
            className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition ${bevestigKlasse}`}
          >
            {bevestigLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
