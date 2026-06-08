import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const METER_FIELDS = [
  "elektraI",
  "elektraII",
  "elektraRetourI",
  "elektraRetourII",
  "water",
  "warmte",
  "warmwater",
  "koeling",
  "gas",
] as const;

type MeterField = (typeof METER_FIELDS)[number];
type MeterBody  = Partial<Record<MeterField, string | null>>;

function trim(v: unknown): string | null {
  return typeof v === "string" ? v.trim() || null : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: rawId } = await params;
  const opdrachtId = Number(rawId);

  if (Number.isNaN(opdrachtId)) {
    return NextResponse.json({ error: "Ongeldige opdracht-id" }, { status: 400 });
  }

  let body: MeterBody;
  try {
    body = (await request.json()) as MeterBody;
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body" }, { status: 400 });
  }

  const fields: Record<MeterField, string | null> = {} as Record<MeterField, string | null>;
  for (const field of METER_FIELDS) {
    fields[field] = trim(body[field]);
  }

  try {
    const meterstanden = await prisma.meterstand.upsert({
      where:  { opdrachtId },
      create: { opdrachtId, ...fields },
      update: fields,
    });

    return NextResponse.json({ success: true, meterstanden });
  } catch (err) {
    console.error("[PUT /api/opdrachten/:id/meterstanden]", err);
    return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  }
}

/** GET — return current meterstanden (used for offline cache warm-up). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: rawId } = await params;
  const opdrachtId = Number(rawId);

  if (Number.isNaN(opdrachtId)) {
    return NextResponse.json({ error: "Ongeldige opdracht-id" }, { status: 400 });
  }

  const meterstanden = await prisma.meterstand.findUnique({ where: { opdrachtId } });
  return NextResponse.json(meterstanden ?? null);
}
