import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Body = {
  intent?: string;
  rapporttype?: string;
  representatiefEmail?: string | null;
};

export async function POST(request: Request, { params }: { params: Promise<{ opdrachtId: string }> }) {
  const { opdrachtId: raw } = await params;
  const opdrachtId = Number(raw);
  if (Number.isNaN(opdrachtId)) return NextResponse.json({ error: "Ongeldige opdracht" }, { status: 400 });

  const body = (await request.json()) as Body;

  const opdracht = await prisma.opdracht.findUnique({ where: { id: opdrachtId }, include: { woning: true } });
  if (!opdracht) return NextResponse.json({ error: "Opdracht niet gevonden" }, { status: 404 });

  const missing: string[] = [];

  // Check required woning fields (all fields marked with '*' in the Woning form)
  const woning = opdracht.woning;
  if (!woning?.typeWoning) missing.push("Een verplicht veld is niet ingevuld: Type woning (woning)");
  if (!woning?.bouwwijze) missing.push("Een verplicht veld is niet ingevuld: Bouwwijze (woning)");
  if (!woning?.contractpartij) missing.push("Een verplicht veld is niet ingevuld: Contractpartij (woning)");
  if (!woning?.vestigingsplaatsContractpartij) missing.push("Een verplicht veld is niet ingevuld: Vestigingsplaats contractpartij (woning)");
  if (!woning?.vertegenwoordiger) missing.push("Een verplicht veld is niet ingevuld: Vertegenwoordiger (woning)");
  if (!woning?.inregelrapportMvwtw) missing.push("Geef aan of het inregelrapport aanwezig is.");
  if (!woning?.energielabel) missing.push("Geef aan of het energielabel aanwezig is.");

  if (missing.length > 0) {
    return NextResponse.json({ missing }, { status: 422 });
  }

  // Create rapport
  const rapport = await prisma.rapport.create({
    data: {
      opdrachtId,
      rapporttype: body.rapporttype ?? "",
      representatiefEmail: body.representatiefEmail ?? null,
      status: body.intent === "akkoord" ? "akkoord" : body.intent === "nietAkkoord" ? "niet akkoord" : "concept",
    },
  });

  if (body.intent === "akkoord") {
    await prisma.opdracht.update({ where: { id: opdrachtId }, data: { status: "afgerond" } });
  }

  if (body.intent === "nietAkkoord") {
    await prisma.opdracht.update({ where: { id: opdrachtId }, data: { status: "in behandeling" } });
  }

  return NextResponse.json({ rapport }, { status: 201 });
}
