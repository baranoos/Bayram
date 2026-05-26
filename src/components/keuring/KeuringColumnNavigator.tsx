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

function GebrekFormPanel() {
  return (
    <div className="min-w-0 flex-[1.4] rounded border bg-gray-50 p-3 text-black">
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm">Aantal:</label>

        <input
          type="number"
          defaultValue={1}
          min={1}
          className="w-20 rounded border px-2 py-1"
        />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" />
          Ernstig gebrek
        </label>
      </div>

      <select className="mb-3 w-full rounded border px-2 py-2 text-sm">
        <option value="">Kies standaardtekst</option>
        {standaardOpties.map((optie) => (
          <option key={optie} value={optie}>
            {optie}
          </option>
        ))}
      </select>

      <textarea
        className="h-[170px] w-full resize-none rounded border p-2 text-sm"
        placeholder="Opmerking..."
      />

      <div className="mt-3 flex justify-between">
        <button className="rounded bg-blue-600 px-4 py-2 text-white">
          📷
        </button>

        <button className="rounded bg-green-600 px-4 py-2 text-white">
          Toevoegen
        </button>
      </div>
    </div>
  );
}

export default function KeuringColumnNavigator({
  initialNodes,
}: {
  initialNodes: Node[];
}) {
  const [columns, setColumns] = useState<Column[]>([
    { parentId: null, nodes: initialNodes },
  ]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);

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
      } else {
        setShowForm(true);
      }

      return next;
    });
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-white p-2">
      <div className="flex h-[340px] w-full gap-1 overflow-hidden">
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="min-w-0 flex-1 rounded border bg-white text-black"
          >
            <div className="h-[285px] overflow-y-auto">
              {column.nodes.map((node) => {
                const selected = selectedIds[columnIndex] === node.id;

                return (
                  <button
                    key={node.id}
                    onClick={() => selectNode(node, columnIndex)}
                    className={`flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    <span className="truncate">{node.omschrijving}</span>
                    <span className="ml-2 shrink-0">
                      {node.hasChildren ? "›" : "¶"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t px-3 py-2 text-sm text-gray-500">
              Locatie info
            </div>
          </div>
        ))}

        {showForm && <GebrekFormPanel />}
      </div>
    </div>
  );
}