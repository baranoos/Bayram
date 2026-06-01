import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RequestBody = {
  keuringNodeId?: number;
  aantal?: number;
  ernstig?: boolean;
  standaardtekst?: string;
  opmerking?: string;
  locatie?: string;
  categorie?: string;
  titel?: string;
  omschrijving?: string;
  ernst?: string;
  fotoPad?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: rawOpdrachtId } = await params;
  const opdrachtId = Number(rawOpdrachtId);

  if (Number.isNaN(opdrachtId)) {
    return NextResponse.json({ error: "Ongeldige opdracht" }, { status: 400 });
  }

  const body = (await request.json()) as RequestBody;
  const keuringNodeId = Number(body.keuringNodeId);

  if (Number.isNaN(keuringNodeId)) {
    return NextResponse.json({ error: "Ongeldige keuringnode" }, { status: 400 });
  }

  const aantal = Number.isFinite(body.aantal) && body.aantal && body.aantal > 0 ? Math.floor(body.aantal) : 1;

  const opdracht = await prisma.opdracht.findUnique({
    where: { id: opdrachtId },
    select: { id: true },
  });

  if (!opdracht) {
    return NextResponse.json({ error: "Opdracht niet gevonden" }, { status: 404 });
  }

  const resultaat = await prisma.keuringResultaat.upsert({
    where: {
      opdrachtId_keuringNodeId: {
        opdrachtId,
        keuringNodeId,
      },
    },
    create: {
      opdrachtId,
      keuringNodeId,
      status: "open",
      opmerking: body.opmerking ?? null,
    },
    update: {
      status: "open",
      opmerking: body.opmerking ?? undefined,
    },
  });

  const gebrek = await prisma.gebrek.create({
    data: {
      keuringResultaatId: resultaat.id,
      aantal,
      ernstig: Boolean(body.ernstig),
      standaardtekst: body.standaardtekst?.trim() || null,
      locatie: body.locatie?.trim() || null,
      categorie: body.categorie?.trim() || null,
      titel: body.titel?.trim() || null,
      omschrijving: body.omschrijving?.trim() || null,
      ernst: body.ernst?.trim() || null,
      fotoPad: body.fotoPad?.trim() || null,
    },
  });

  return NextResponse.json({ resultaat, gebrek }, { status: 201 });
}