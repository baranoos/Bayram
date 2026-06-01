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
        gebreken: true;
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
            gebreken: true,
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
      (total, resultaat) => total + resultaat.gebreken.length,
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

export async function getWorkspaceOpdracht(opdrachtId: number) {
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
    const updated = await prisma.opdracht.update({
      where: { id: opdrachtId },
      data: { status: "in behandeling" },
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

    return updated;
  }

  return opdracht;
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "nieuw":
      return "Nieuw";
    case "in behandeling":
      return "In behandeling";
    case "afgerond":
      return "Afgerond";
    default:
      return status;
  }
}
