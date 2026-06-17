import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateRapportHtml, type GebrekenGroup } from "@/lib/pdf/rapport-html";

export const dynamic = "force-dynamic";

function defaultCoverPhoto(): string {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "image.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ opdrachtId: string; rapportId: string }> }
) {
  const { opdrachtId: rawO, rapportId: rawR } = await params;
  const opdrachtId = Number(rawO);
  const rapportId = Number(rawR);

  if (Number.isNaN(opdrachtId) || Number.isNaN(rapportId)) {
    return NextResponse.json({ error: "Ongeldige parameters" }, { status: 400 });
  }

  const [opdracht, rapport] = await Promise.all([
    prisma.opdracht.findUnique({
      where: { id: opdrachtId },
      include: {
        woning: true,
        meterstanden: true,
        resultaten: {
          include: {
            gebreken: { include: { fotos: true } },
          },
        },
      },
    }),
    prisma.rapport.findUnique({ where: { id: rapportId } }),
  ]);

  if (!opdracht) return NextResponse.json({ error: "Opdracht niet gevonden" }, { status: 404 });
  if (!rapport)  return NextResponse.json({ error: "Rapport niet gevonden" }, { status: 404 });
  if (rapport.opdrachtId !== opdrachtId) return NextResponse.json({ error: "Verboden" }, { status: 403 });

  // Cover photo: use woning's own photo if available, else the generic image.png
  const coverPhoto = opdracht.woning?.fotoVoorbladPad ?? defaultCoverPhoto();

  // Group all gebreken by locatie
  const allGebreken = opdracht.resultaten.flatMap((r) => r.gebreken);
  const groupMap = new Map<string, GebrekenGroup["gebreken"]>();
  for (const g of allGebreken) {
    const key = g.locatie ?? "Overige";
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push({
      id:           g.id,
      titel:        g.titel,
      omschrijving: g.omschrijving,
      categorie:    g.categorie,
      aantal:       g.aantal,
      ernstig:      g.ernstig,
      directHerstel: g.directHerstel,
      genoteerd:    g.genoteerd,
      ernst:        g.ernst,
      fotoPad:      g.fotoPad,
    });
  }
  const gebrekenGroups: GebrekenGroup[] = Array.from(groupMap.entries()).map(
    ([locatie, gebreken]) => ({ locatie, gebreken })
  );

  const html = generateRapportHtml({
    coverPhoto,
    opdracht: {
      id:                   opdracht.id,
      opdrachtgeverNaam:    opdracht.opdrachtgeverNaam,
      opdrachtgeverEmail:   opdracht.opdrachtgeverEmail,
      opdrachtgeverTelefoon: opdracht.opdrachtgeverTelefoon,
      adresStraat:          opdracht.adresStraat,
      adresPostcode:        opdracht.adresPostcode,
      adresPlaats:          opdracht.adresPlaats,
      typeWoning:           opdracht.typeWoning,
      createdAt:            opdracht.createdAt,
    },
    woning: opdracht.woning
      ? {
          fotoVoorbladPad:              opdracht.woning.fotoVoorbladPad,
          typeWoning:                   opdracht.woning.typeWoning,
          woningGrootte:                opdracht.woning.woningGrootte,
          bouwwijze:                    opdracht.woning.bouwwijze,
          garantieRegeling:             opdracht.woning.garantieRegeling,
          objectNaam:                   opdracht.woning.objectNaam,
          projectNaam:                  opdracht.woning.projectNaam,
          bouwjaar:                     opdracht.woning.bouwjaar,
          bouwer:                       opdracht.woning.bouwer,
          vestigingsplaatsBouwer:       opdracht.woning.vestigingsplaatsBouwer,
          contractpartij:               opdracht.woning.contractpartij,
          vestigingsplaatsContractpartij: opdracht.woning.vestigingsplaatsContractpartij,
          vertegenwoordiger:            opdracht.woning.vertegenwoordiger,
          weersomstandigheden:          opdracht.woning.weersomstandigheden,
          energielabel:                 opdracht.woning.energielabel,
          beglazing:                    opdracht.woning.beglazing,
          opmerkingen:                  opdracht.woning.opmerkingen,
        }
      : null,
    meterstanden: opdracht.meterstanden ?? null,
    gebrekenGroups,
    rapport: {
      id:                     rapport.id,
      rapporttype:            rapport.rapporttype,
      representatiefEmail:    rapport.representatiefEmail,
      signatureClient:        rapport.signatureClient,
      signatureRepresentative: rapport.signatureRepresentative,
      createdAt:              rapport.createdAt,
    },
  });

  try {
    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    try {
      const page = await browser.newPage();
      // waitUntil "load" waits for all resources including the Google Fonts stylesheet
      await page.setContent(html, { waitUntil: "load", timeout: 30000 });
      // Small delay to let web fonts finish rendering
      await new Promise((r) => setTimeout(r, 1500));

      const pdfBytes = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      await browser.close();

      return new Response(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="rapport-${opdrachtId}-${rapportId}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      await browser.close();
      throw err;
    }
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json({ error: "PDF generatie mislukt", detail: String(err) }, { status: 500 });
  }
}
