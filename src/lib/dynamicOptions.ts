import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type OptionGroup =
  | "woningType"
  | "woningGrootte"
  | "bouwwijze"
  | "garantieRegeling"
  | "weather"
  | "inregelrapport"
  | "energielabel"
  | "beglazing"
  | "rapportType";

export type WorkspaceOptions = Record<OptionGroup, string[]>;

const allGroups: OptionGroup[] = [
  "woningType",
  "woningGrootte",
  "bouwwijze",
  "garantieRegeling",
  "weather",
  "inregelrapport",
  "energielabel",
  "beglazing",
  "rapportType",
];

export const getWorkspaceOptions = cache(async function getWorkspaceOptions(): Promise<WorkspaceOptions> {
  const rows = await prisma.dynamicOption.findMany({
    where: {
      group: { in: allGroups },
      isActive: true,
    },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  const grouped: WorkspaceOptions = {
    woningType: [],
    woningGrootte: [],
    bouwwijze: [],
    garantieRegeling: [],
    weather: [],
    inregelrapport: [],
    energielabel: [],
    beglazing: [],
    rapportType: [],
  };

  for (const row of rows) {
    const key = row.group as OptionGroup;
    if (!grouped[key]) continue;
    grouped[key].push(row.label?.trim() || row.value);
  }

  return grouped;
});
