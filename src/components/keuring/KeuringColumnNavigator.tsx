"use client";

import { useState } from "react";

type Node = {
  id: number;
  omschrijving: string;
  hasChildren?: boolean;
};

type Column = {
  parentId: number | null;
  nodes: Node[];
};

type GebrekFormState = {
  aantal: number;
  ernstig: boolean;
  standaardtekst: string;
  opmerkingen: string;
  fotoPad: string;
  fotoFile?: File | null;
};

const standaardOpties = [
  "betreft opmerking",
  "casco opgeleverd",
  "uitvoeren conform overeenkomst/tekening",
  "uitvoeren conform meer-/minderwerklijst",
  "bouwer toont aan de hand van norm aan",
  "nazien op installatievoorschriften",
  "nazien op overeenkomst",
  "koper is akkoord",
  "naar mening koper",
  "geen/ onvoldoende goed en deugdelijk werk",
  "bezien in onderhoudsperiode",
  "bouwer komt met voorstel",
  "in overleg met koper oplossen",
  "bouwer zegt toe te vervangen",
  "maakt deel uit van VVE",
  "geldt voor gehele woning",
  "betreft algemeen punt",
  "op meerdere plaatsen",
  "wordt / is in eigen beheer uitgevoerd",
  "wordt apart opgeleverd",
  "beschadigingen melden binnen dagen",
  "niet te controleren",
  "op verzoek van koper opgenomen",
];

function GebrekFormPanel({
  activeNode,
  formState,
  disabled,
  statusMessage,
  onChange,
  onSubmit,
  onCancel,
}: {
  activeNode: Node;
  formState: GebrekFormState;
  disabled: boolean;
  statusMessage: string | null;
  onChange: <K extends keyof GebrekFormState>(field: K, value: GebrekFormState[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div className="h-full w-full overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 shadow-sm md:flex-[1.2]">
      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Eindnode</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{activeNode.omschrijving}</p>
        </div>
        {statusMessage ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[88px_1fr] md:items-center">
        <label className="text-xs font-medium text-slate-700">Aantal</label>
        <input
          type="number"
          value={formState.aantal}
          min={1}
          onChange={(event) => onChange("aantal", Number(event.target.value) || 1)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition focus:border-blue-300"
        />

        <label className="text-xs font-medium text-slate-700">Ernstig gebrek</label>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={formState.ernstig}
            onChange={(event) => onChange("ernstig", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Markeer als ernstig
        </label>
      </div>

      <label className="mb-3 block text-xs font-medium text-slate-700">
        Standaardtekst
        <select
          value={formState.standaardtekst}
          onChange={(event) => onChange("standaardtekst", event.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition focus:border-blue-300"
        >
          <option value="">Kies standaardtekst</option>
          {standaardOpties.map((optie) => (
            <option key={optie} value={optie}>
              {optie}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-3 block text-xs font-medium text-slate-700">
        Opmerking
        <textarea
          value={formState.opmerkingen}
          onChange={(event) => onChange("opmerkingen", event.target.value)}
          className="mt-1 h-[130px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition focus:border-blue-300"
          placeholder="Beschrijf het gebrek of de herstelopmerking"
        />
      </label>

      <label className="mb-3 block text-xs font-medium text-slate-700">
        Foto upload
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = (event.target.files?.[0] ?? null) as File | null;
            onChange("fotoFile", file as GebrekFormState["fotoFile"]);
            onChange("fotoPad", file ? file.name : "");
          }}
          className="mt-1 block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-2 py-2 text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white"
        />
        {formState.fotoPad ? (
          <p className="mt-1 text-[11px] text-slate-500">Geselecteerd: {formState.fotoPad}</p>
        ) : null}
      </label>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          De foto wordt als bestandsnaam opgeslagen totdat de uploadopslag is gekoppeld.
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Niet bewaren
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={disabled}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            Bewaar
          </button>
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[min(360px,90%)] rounded-2xl bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold">Weet je het zeker?</h3>
            <p className="mt-2 text-xs text-slate-600">Deze actie slaat het gebrek definitief op in de database.</p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                Annuleer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  onSubmit();
                }}
                className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Ja, bewaar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function KeuringColumnNavigator({
  initialNodes,
  opdrachtId,
}: {
  initialNodes: Node[];
  opdrachtId?: number;
}) {
  const [columns, setColumns] = useState<Column[]>([
    { parentId: null, nodes: initialNodes },
  ]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<GebrekFormState>({
    aantal: 1,
    ernstig: false,
    standaardtekst: "",
    opmerkingen: "",
    fotoPad: "",
    fotoFile: null,
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function resetFormForNextEntry() {
    setFormState({
      aantal: 1,
      ernstig: false,
      standaardtekst: "",
      opmerkingen: "",
      fotoPad: "",
      fotoFile: null,
    });
  }

  async function selectNode(node: Node, columnIndex: number) {
    const response = await fetch(`/api/keuring-children?id=${node.id}`);
    const children: Node[] = await response.json();

    setSelectedIds((prev) => {
      const next = prev.slice(0, columnIndex);
      next[columnIndex] = node.id;
      return next;
    });

    setColumns((prev) => {
      const next = prev.slice(0, columnIndex + 1);

      if (children.length > 0) {
        next.push({
          parentId: node.id,
          nodes: children,
        });

        setShowForm(false);
        setActiveNode(null);
        setStatusMessage(null);
        setErrorMessage(null);
      } else {
        setShowForm(true);
        setActiveNode(node);
        setStatusMessage(null);
        setErrorMessage(null);
      }

      return next;
    });
  }

  async function addGebrek() {
    if (!opdrachtId) {
      setErrorMessage("Deze keuringpagina mist een opdrachtkoppeling.");
      return;
    }

    if (!activeNode) {
      setErrorMessage("Selecteer eerst een eindnode.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const parentColumnIndex = columns.length - 2;
    const parentNode =
      parentColumnIndex >= 0
        ? columns[parentColumnIndex]?.nodes.find(
            (node) => node.id === selectedIds[parentColumnIndex]
          ) ?? null
        : null;

    try {
      let fotoPath = formState.fotoPad || "";

      if (formState.fotoFile) {
        // If NEXT_PUBLIC_USE_SUPABASE is set, use Supabase upload endpoint.
        if (process.env.NEXT_PUBLIC_USE_SUPABASE === '1') {
          setStatusMessage('Uploaden foto naar Supabase...');

          const fd = new FormData();
          fd.append('file', formState.fotoFile as Blob);

          const uploadRes = await fetch('/api/supabase-upload', {
            method: 'POST',
            body: fd,
          });

          if (!uploadRes.ok) {
            const uploadText = await uploadRes.text();
            throw new Error(uploadText || 'Supabase upload mislukt');
          }

          const uploadJson = await uploadRes.json();
          fotoPath = uploadJson.publicUrl || uploadJson.path || fotoPath;
        } else {
          setStatusMessage("Uploaden foto naar R2...");

          const presignRes = await fetch("/api/r2-presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: formState.fotoFile.name, contentType: formState.fotoFile.type }),
          });

          if (!presignRes.ok) {
            const presignText = await presignRes.text();
            throw new Error(presignText || "Kon presigned URL niet ophalen");
          }

          const presignJson = await presignRes.json();
          const uploadUrl: string = presignJson.url;
          const publicUrl: string = presignJson.publicUrl;

          const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": formState.fotoFile.type || "application/octet-stream",
            },
            body: formState.fotoFile,
          });

          if (!putRes.ok) {
            const putText = await putRes.text();
            throw new Error(putText || "Upload naar R2 mislukt");
          }

          fotoPath = publicUrl || (presignJson.key ? `/r2/${presignJson.key}` : fotoPath);
        }
      }

      const response = await fetch(`/api/opdrachten/${opdrachtId}/gebreken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keuringNodeId: activeNode.id,
          aantal: formState.aantal,
          ernstig: formState.ernstig,
          standaardtekst: formState.standaardtekst,
          opmerking: formState.opmerkingen,
          locatie: parentNode?.omschrijving ?? activeNode.omschrijving,
          categorie: activeNode.omschrijving,
          titel: activeNode.omschrijving,
          omschrijving: formState.opmerkingen,
          ernst: formState.ernstig ? "Ernstig" : "Normaal",
          fotoPad: fotoPath,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || "Opslaan van gebrek mislukt");
      }

      setStatusMessage("Gebrek is opgeslagen in MySQL.");
      setErrorMessage(null);
      resetFormForNextEntry();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Gebrek opslaan is mislukt. Probeer het opnieuw.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full overflow-hidden bg-white p-2">
      <div className="mb-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-600">
        <span className="font-semibold tracking-tight">Recursieve inspectienavigatie</span>
        <span>{opdrachtId ? `Opdracht #${opdrachtId}` : "Zonder opdrachtkoppeling"}</span>
      </div>

      <div className="flex h-[calc(100dvh-180px)] min-h-[520px] w-full gap-3 overflow-hidden">
        <div className="flex h-full min-w-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2">
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="flex h-full min-w-[190px] max-w-[240px] flex-1 flex-col rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm"
            >
              <div className="flex-1 overflow-y-auto">
                {column.nodes.map((node) => {
                  const selected = selectedIds[columnIndex] === node.id;

                  return (
                    <button
                      key={node.id}
                      onClick={() => selectNode(node, columnIndex)}
                      className={`flex w-full items-center justify-between border-b border-slate-100 px-2 py-2 text-left text-xs transition ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate leading-tight">{node.omschrijving}</span>
                      <span className="ml-2 shrink-0 text-[10px] leading-none">
                        {node.hasChildren ? "›" : "¶"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 px-2 py-1.5 text-[11px] text-slate-500">
                Locatie info
              </div>
            </div>
          ))}
        </div>

        {showForm && activeNode ? (
          <div className="h-full w-[320px] flex-shrink-0">
            <GebrekFormPanel
              activeNode={activeNode}
              formState={formState}
              disabled={isSaving}
              statusMessage={statusMessage}
              onChange={(field, value) => {
                setFormState((previous) => ({
                  ...previous,
                  [field]: value,
                }));
              }}
              onSubmit={addGebrek}
              onCancel={() => {
                resetFormForNextEntry();
                setShowForm(false);
                setActiveNode(null);
                setStatusMessage(null);
                setErrorMessage(null);
              }}
            />
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}