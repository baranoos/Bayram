import { PrismaClient } from "@prisma/client";
import rawData from "./keuring_nodes_extracted.json";

const prisma = new PrismaClient();

type RawNode = {
  omschrijving: string;
  isRapport?: boolean;
  level?: number;
  children?: string[];
};

const nodes = rawData as Record<string, RawNode>;

const dynamicOptionsSeed: Array<{ group: string; value: string; sortOrder: number }> = [
  { group: "woningType", value: "Appartement/flat", sortOrder: 1 },
  { group: "woningType", value: "Tussenwoning", sortOrder: 2 },
  { group: "woningType", value: "Hoek- of eindwoning", sortOrder: 3 },
  { group: "woningType", value: "Twee-onder-1-kap", sortOrder: 4 },
  { group: "woningType", value: "Vrijstaand huis", sortOrder: 5 },
  { group: "woningType", value: "Gemeenschappelijk gedeelte appartementencomplex", sortOrder: 6 },

  { group: "woningGrootte", value: "Gemiddeld", sortOrder: 1 },
  { group: "woningGrootte", value: "Groot", sortOrder: 2 },
  { group: "woningGrootte", value: "Zeer groot", sortOrder: 3 },

  { group: "bouwwijze", value: "Traditioneel", sortOrder: 1 },
  { group: "bouwwijze", value: "Gietbouw (beton)", sortOrder: 2 },
  { group: "bouwwijze", value: "Geprefabriceerde bouw", sortOrder: 3 },
  { group: "bouwwijze", value: "Houtskelet bouw", sortOrder: 4 },
  { group: "bouwwijze", value: "Anders, te weten…", sortOrder: 5 },

  { group: "garantieRegeling", value: "Nee", sortOrder: 1 },
  { group: "garantieRegeling", value: "Ja", sortOrder: 2 },

  { group: "weather", value: "Regen", sortOrder: 1 },
  { group: "weather", value: "Sneeuw", sortOrder: 2 },
  { group: "weather", value: "Bewolkt", sortOrder: 3 },
  { group: "weather", value: "Zonnig", sortOrder: 4 },
  { group: "weather", value: "Vorst", sortOrder: 5 },
  { group: "weather", value: "Storm", sortOrder: 6 },

  { group: "inregelrapport", value: "Wel", sortOrder: 1 },
  { group: "inregelrapport", value: "Niet", sortOrder: 2 },
  { group: "inregelrapport", value: "N.v.t.", sortOrder: 3 },

  { group: "energielabel", value: "Wel", sortOrder: 1 },
  { group: "energielabel", value: "Niet", sortOrder: 2 },
  { group: "energielabel", value: "N.v.t.", sortOrder: 3 },

  { group: "beglazing", value: "N.v.t.", sortOrder: 1 },
  { group: "beglazing", value: "Onvoldoende schoon", sortOrder: 2 },
  { group: "beglazing", value: "Regenaanslag", sortOrder: 3 },
  { group: "beglazing", value: "Onvoldoende licht", sortOrder: 4 },
  { group: "beglazing", value: "Condensatie", sortOrder: 5 },

  { group: "rapportType", value: "Schaduwrapport", sortOrder: 1 },
  { group: "rapportType", value: "Proces-verbaal", sortOrder: 2 },
  { group: "rapportType", value: "Woning niet gereed", sortOrder: 3 },
  { group: "rapportType", value: "Woning niet gereed met sleutelverklaring", sortOrder: 4 },
  { group: "rapportType", value: "Voorschouw", sortOrder: 5 },
  { group: "rapportType", value: "Naschouw", sortOrder: 6 },
  { group: "rapportType", value: "Opname", sortOrder: 7 },
];

async function main() {
  console.log(`Found ${Object.keys(nodes).length} nodes`);

  await prisma.foto.deleteMany();
  await prisma.gebrek.deleteMany();
  await prisma.keuringResultaat.deleteMany();
  await prisma.opmerking.deleteMany();
  await prisma.rapport.deleteMany();
  await prisma.meterstand.deleteMany();
  await prisma.omstandigheid.deleteMany();
  await prisma.woning.deleteMany();
  await prisma.opdracht.deleteMany();
  await prisma.dynamicOption.deleteMany();
  await prisma.keuringNodeRelation.deleteMany();
  await prisma.keuringNode.deleteMany();

  await prisma.dynamicOption.createMany({
    data: dynamicOptionsSeed,
  });

  await prisma.keuringNode.createMany({
    data: Object.entries(nodes).map(([id, node]) => ({
      id: Number(id),
      parentId: null,
      omschrijving: node.omschrijving,
      level: node.level ?? null,
      isRapport: node.isRapport ?? null,
      pdfSortOrder: null,
    })),
  });

  const relationRows = Object.entries(nodes).flatMap(([parentId, node]) =>
    (node.children ?? [])
      .map((childId, index) => {
        if (!nodes[childId]) return null;
        return {
          parentId: Number(parentId),
          childId: Number(childId),
          sortOrder: index,
        };
      })
      .filter((row): row is { parentId: number; childId: number; sortOrder: number } => row !== null)
  );

  if (relationRows.length > 0) {
    await prisma.keuringNodeRelation.createMany({
      data: relationRows,
    });
  }

  console.log(`Imported ${Object.keys(nodes).length} nodes`);
  console.log(`Imported ${relationRows.length} relations`);

  console.log("Seeded only base keuring tree data; no demo opdrachten were created");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });