import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type WoningBody = {
  objectNaam?:                   string | null;
  projectNaam?:                  string | null;
  typeWoning?:                   string | null;
  woningGrootte?:                string | null;
  bouwwijze?:                    string | null;
  bouwjaar?:                     number | string | null;
  omschrijving?:                 string | null;
  bouwer?:                       string | null;
  vestigingsplaatsBouwer?:       string | null;
  contractpartij?:               string | null;
  vestigingsplaatsContractpartij?: string | null;
  vertegenwoordiger?:            string | null;
  weersomstandigheden?:          string | null;
  inregelrapportMvwtw?:          string | null;
  energielabel?:                 string | null;
  beglazing?:                    string | null;
  opmerkingen?:                  string | null;
  garantieRegeling?:             string | null;
  omstandigheden?:               string | null;
  opmerking?:                    string | null;
  fotoVoorbladPad?:              string | null;
};

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

  let body: WoningBody;
  try {
    body = (await request.json()) as WoningBody;
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON body" }, { status: 400 });
  }

  const bouwjaarRaw = body.bouwjaar;
  const bouwjaar =
    bouwjaarRaw !== null && bouwjaarRaw !== undefined && bouwjaarRaw !== ""
      ? Number(bouwjaarRaw) || null
      : null;

  const fields = {
    objectNaam:                    trim(body.objectNaam),
    projectNaam:                   trim(body.projectNaam),
    typeWoning:                    trim(body.typeWoning),
    woningGrootte:                 trim(body.woningGrootte),
    bouwwijze:                     trim(body.bouwwijze),
    bouwjaar,
    omschrijving:                  trim(body.omschrijving),
    bouwer:                        trim(body.bouwer),
    vestigingsplaatsBouwer:        trim(body.vestigingsplaatsBouwer),
    contractpartij:                trim(body.contractpartij),
    vestigingsplaatsContractpartij: trim(body.vestigingsplaatsContractpartij),
    vertegenwoordiger:             trim(body.vertegenwoordiger),
    weersomstandigheden:           trim(body.weersomstandigheden),
    inregelrapportMvwtw:           trim(body.inregelrapportMvwtw),
    energielabel:                  trim(body.energielabel),
    beglazing:                     trim(body.beglazing),
    opmerkingen:                   trim(body.opmerkingen),
    garantieRegeling:              trim(body.garantieRegeling),
    omstandigheden:                trim(body.omstandigheden),
    opmerking:                     trim(body.opmerking),
    // Only update photo field if explicitly provided (null = clear, undefined = keep)
    ...(body.fotoVoorbladPad !== undefined
      ? { fotoVoorbladPad: trim(body.fotoVoorbladPad) }
      : {}),
  };

  try {
    const woning = await prisma.woning.upsert({
      where:  { opdrachtId },
      create: { opdrachtId, ...fields },
      update: fields,
    });

    return NextResponse.json({ success: true, woning });
  } catch (err) {
    console.error("[PUT /api/opdrachten/:id/woning]", err);
    return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  }
}

/** GET — return current woning data (used for offline cache warm-up). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: rawId } = await params;
  const opdrachtId = Number(rawId);

  if (Number.isNaN(opdrachtId)) {
    return NextResponse.json({ error: "Ongeldige opdracht-id" }, { status: 400 });
  }

  const woning = await prisma.woning.findUnique({ where: { opdrachtId } });
  return NextResponse.json(woning ?? null);
}
