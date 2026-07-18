import { cache } from "react";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DashboardOpdrachtRow = Prisma.OpdrachtGetPayload<{
  include: {
    woning: {
      select: {
        typeWoning: true;
        woningGrootte: true;
      };
    };
    resultaten: {
      include: {
        _count: { select: { gebreken: true } };
      };
    };
  };
}>;

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value: Date) {
  return dateFormatter.format(value);
}

export type DashboardOpdracht = {
  id: number;
  status: string;
  createdAt: Date;
  opdrachtgeverNaam: string;
  opdrachtgeverEmail: string | null;
  opdrachtgeverTelefoon: string | null;
  typeWoning: string | null;
  adresStraat: string;
  adresPostcode: string;
  adresPlaats: string;
  betalingswijze: string | null;
  extraUren: number;
  correcties: string | null;
  woning: {
    typeWoning: string | null;
    woningGrootte: string | null;
  } | null;
  resultaatCount: number;
  gebrekCount: number;
  laatsteWijziging: Date;
};

export async function getDashboardOpdrachten(): Promise<{
  opdrachten: DashboardOpdracht[];
  error: boolean;
}> {
  let opdrachten: DashboardOpdrachtRow[];

  try {
    opdrachten = await prisma.opdracht.findMany({
      where: { status: { not: "verwijderd" } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        woning: {
          select: {
            typeWoning: true,
            woningGrootte: true,
          },
        },
        resultaten: {
          include: {
            _count: { select: { gebreken: true } },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to load dashboard opdrachten", error);
    return { opdrachten: [], error: true };
  }

  return {
    opdrachten: opdrachten.map((opdracht) => {
    const gebrekCount = opdracht.resultaten.reduce(
      (total, resultaat) => total + resultaat._count.gebreken,
      0
    );

    const laatsteResultaat = opdracht.resultaten[0];
    const laatsteWijziging = laatsteResultaat?.createdAt ?? opdracht.updatedAt;

    return {
      id: opdracht.id,
      status: opdracht.status,
      createdAt: opdracht.createdAt,
      opdrachtgeverNaam: opdracht.opdrachtgeverNaam,
      opdrachtgeverEmail: opdracht.opdrachtgeverEmail,
      opdrachtgeverTelefoon: opdracht.opdrachtgeverTelefoon,
      typeWoning: opdracht.typeWoning,
      adresStraat: opdracht.adresStraat,
      adresPostcode: opdracht.adresPostcode,
      adresPlaats: opdracht.adresPlaats,
      betalingswijze: opdracht.betalingswijze,
      extraUren: opdracht.extraUren,
      correcties: opdracht.correcties,
      woning: opdracht.woning
        ? {
            typeWoning: opdracht.woning.typeWoning,
            woningGrootte: opdracht.woning.woningGrootte,
          }
        : null,
      resultaatCount: opdracht.resultaten.length,
      gebrekCount,
      laatsteWijziging,
    };
    }),
    error: false,
  };
}

export const getWorkspaceOpdracht = cache(async function getWorkspaceOpdracht(opdrachtId: number) {
  if (Number.isNaN(opdrachtId)) return null;

  const opdracht = await prisma.opdracht.findUnique({
    where: { id: opdrachtId },
    include: {
      woning: {
        include: {
          omstandigheidItems: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      meterstanden: true,
      rapporten: {
        orderBy: { createdAt: "desc" },
      },
      opmerkingen: {
        orderBy: { createdAt: "desc" },
      },
      resultaten: {
        include: {
          gebreken: true,
          fotos: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!opdracht) return null;

  // If the dossier is freshly created ('nieuw'), mark it as 'in behandeling' when opened.
  if (opdracht.status === "nieuw") {
    await prisma.opdracht.update({
      where: { id: opdrachtId },
      data: { status: "in behandeling" },
      select: { id: true },
    });
    return { ...opdracht, status: "in behandeling" };
  }

  return opdracht;
});

export function getStatusLabel(status: string) {
  switch (status) {
    case "nieuw":
      return "Nieuw";
    case "in behandeling":
      return "In behandeling";
    case "afgerond":
      return "Afgerond";
    case "verwijderd":
      return "Verwijderd";
    default:
      return status;
  }
}

export type DeletedOpdracht = {
  id: number;
  opdrachtgeverNaam: string;
  adresStraat: string;
  adresPostcode: string;
  adresPlaats: string;
  updatedAt: Date;
};

export async function getDeletedOpdrachten(): Promise<DeletedOpdracht[]> {
  return prisma.opdracht.findMany({
    where: { status: "verwijderd" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      opdrachtgeverNaam: true,
      adresStraat: true,
      adresPostcode: true,
      adresPlaats: true,
      updatedAt: true,
    },
  });
}
