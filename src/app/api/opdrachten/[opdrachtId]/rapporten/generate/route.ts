import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Body = {
  intent?: string;
  rapporttype?: string;
  representatiefEmail?: string | null;
  signatureClient?: string | null;
  signatureRepresentative?: string | null;
};

function nvt(v: string | null | undefined): string {
  return v?.trim() || "n.v.t.";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: raw } = await params;
  const opdrachtId = Number(raw);
  if (Number.isNaN(opdrachtId))
    return NextResponse.json({ error: "Ongeldige opdracht" }, { status: 400 });

  const body = (await request.json()) as Body;

  const opdracht = await prisma.opdracht.findUnique({
    where: { id: opdrachtId },
    include: { woning: true, meterstanden: true },
  });
  if (!opdracht) return NextResponse.json({ error: "Opdracht niet gevonden" }, { status: 404 });

  const missing: string[] = [];
  const w = opdracht.woning;

  // Opdracht required fields
  if (!opdracht.adresStraat) missing.push("Adres (opdracht)");
  if (!opdracht.adresPostcode) missing.push("Postcode (opdracht)");
  if (!opdracht.adresPlaats) missing.push("Plaats (opdracht)");
  if (!opdracht.typeWoning) missing.push("Type woning (opdracht)");
  if (!opdracht.opdrachtgeverNaam) missing.push("Naam opdrachtgever (opdracht)");
  if (!opdracht.opdrachtgeverEmail) missing.push("E-mail opdrachtgever (opdracht)");

  // Woning required fields
  if (!w?.bouwwijze) missing.push("Bouwwijze (woning)");
  if (!w?.contractpartij) missing.push("Contractpartij (woning)");
  if (!w?.bouwer) missing.push("Bouwer (woning)");

  // Proces-verbaal requires signatures + rep email
  if (body.rapporttype === "Proces-verbaal") {
    if (!body.signatureClient) missing.push("Handtekening klant");
    if (!body.signatureRepresentative) missing.push("Handtekening vertegenwoordiger");
    if (!body.representatiefEmail) missing.push("E-mail vertegenwoordiger");
  }

  if (missing.length > 0) {
    return NextResponse.json({ missing }, { status: 422 });
  }

  // Normalise meterstanden — set empty values to "n.v.t." in the database
  if (opdracht.meterstanden) {
    const ms = opdracht.meterstanden;
    await prisma.meterstand.update({
      where: { opdrachtId },
      data: {
        elektraI: nvt(ms.elektraI),
        elektraII: nvt(ms.elektraII),
        elektraRetourI: nvt(ms.elektraRetourI),
        elektraRetourII: nvt(ms.elektraRetourII),
        water: nvt(ms.water),
        warmte: nvt(ms.warmte),
        warmwater: nvt(ms.warmwater),
        koeling: nvt(ms.koeling),
        gas: nvt(ms.gas),
      },
    });
  }

  const newStatus =
    body.intent === "akkoord"
      ? "akkoord"
      : body.intent === "nietAkkoord"
      ? "niet akkoord"
      : "concept";

  const rapport = await prisma.rapport.create({
    data: {
      opdrachtId,
      rapporttype: body.rapporttype ?? "",
      representatiefEmail: body.representatiefEmail ?? null,
      signatureClient: body.signatureClient ?? null,
      signatureRepresentative: body.signatureRepresentative ?? null,
      status: newStatus,
    },
  });

  if (body.intent === "akkoord") {
    await prisma.opdracht.update({ where: { id: opdrachtId }, data: { status: "afgerond" } });
  } else if (body.intent === "nietAkkoord") {
    await prisma.opdracht.update({ where: { id: opdrachtId }, data: { status: "in behandeling" } });
  }

  return NextResponse.json({ rapport }, { status: 201 });
}
