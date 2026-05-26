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

async function main() {
  console.log(`Found ${Object.keys(nodes).length} nodes`);

  await prisma.keuringNodeRelation.deleteMany();
  await prisma.keuringResultaat.deleteMany();
  await prisma.keuringNode.deleteMany();

  for (const [id, node] of Object.entries(nodes)) {
    await prisma.keuringNode.create({
      data: {
        id: Number(id),
        parentId: null,
        omschrijving: node.omschrijving,
        level: node.level ?? null,
        isRapport: node.isRapport ?? null,
        pdfSortOrder: null,
      },
    });
  }

  let relationCount = 0;

  for (const [parentId, node] of Object.entries(nodes)) {
    for (const [index, childId] of (node.children ?? []).entries()) {
      if (!nodes[childId]) continue;

      await prisma.keuringNodeRelation.create({
        data: {
          parentId: Number(parentId),
          childId: Number(childId),
          sortOrder: index,
        },
      });

      relationCount++;
    }
  }

  console.log(`Imported ${Object.keys(nodes).length} nodes`);
  console.log(`Imported ${relationCount} relations`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });