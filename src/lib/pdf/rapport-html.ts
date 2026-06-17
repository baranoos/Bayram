const dateFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" });
function fmt(d: Date) { return dateFormatter.format(d); }

function esc(v: string | null | undefined): string {
  if (v == null || v === "") return "—";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nvt(v: string | null | undefined): string {
  return v?.trim() || "n.v.t.";
}

const ORANGE = "#e8562b";
const NAVY   = "#1e3165";

/* ─────────────────────────────────────────────────────────────── */
/* Types                                                          */
/* ─────────────────────────────────────────────────────────────── */

export type GebrekenGroup = {
  locatie: string;
  gebreken: Array<{
    id: number;
    titel: string | null;
    omschrijving: string | null;
    categorie: string | null;
    aantal: number;
    ernstig: boolean;
    directHerstel: boolean;
    genoteerd: boolean;
    ernst: string | null;
    fotoPad: string | null;
  }>;
};

export type PdfInput = {
  coverPhoto: string;
  opdracht: {
    id: number;
    opdrachtgeverNaam: string;
    opdrachtgeverEmail: string | null;
    opdrachtgeverTelefoon: string | null;
    adresStraat: string;
    adresPostcode: string;
    adresPlaats: string;
    typeWoning: string | null;
    createdAt: Date;
  };
  woning: {
    fotoVoorbladPad: string | null;
    typeWoning: string | null;
    woningGrootte: string | null;
    bouwwijze: string | null;
    garantieRegeling: string | null;
    objectNaam: string | null;
    projectNaam: string | null;
    bouwjaar: number | null;
    bouwer: string | null;
    vestigingsplaatsBouwer: string | null;
    contractpartij: string | null;
    vestigingsplaatsContractpartij: string | null;
    vertegenwoordiger: string | null;
    weersomstandigheden: string | null;
    energielabel: string | null;
    beglazing: string | null;
    opmerkingen: string | null;
  } | null;
  meterstanden: {
    elektraI: string | null;
    elektraII: string | null;
    elektraRetourI: string | null;
    elektraRetourII: string | null;
    water: string | null;
    warmte: string | null;
    warmwater: string | null;
    koeling: string | null;
    gas: string | null;
  } | null;
  gebrekenGroups: GebrekenGroup[];
  rapport: {
    id: number;
    rapporttype: string;
    representatiefEmail: string | null;
    signatureClient: string | null;
    signatureRepresentative: string | null;
    createdAt: Date;
  };
};

/* ─────────────────────────────────────────────────────────────── */
/* Helpers                                                        */
/* ─────────────────────────────────────────────────────────────── */

function logoSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 48 48">
    <polygon points="24,0 12,12 24,24 36,12" fill="#4a2d84"/>
    <polygon points="36,12 48,24 36,36 24,24" fill="${ORANGE}"/>
    <polygon points="24,24 36,36 24,48 12,36" fill="#f5a619"/>
    <polygon points="12,12 24,24 12,36 0,24"  fill="#4a2d84"/>
  </svg>`;
}

/* ─────────────────────────────────────────────────────────────── */
/* Gebreken table                                                  */
/* Structure matches official PDF:                                 */
/*   locatie   = group header row spanning all columns            */
/*   categorie = RUIMTE/ONDERDEEL column (prefixed w/ row number) */
/*   omschrijving = GEBREKEN column                               */
/*   Opname type: only AANTAL + ERNSTIG columns                   */
/*   Other types: AANTAL + ERNSTIG + GENOTEERD + DIRECT HERSTEL  */
/* ─────────────────────────────────────────────────────────────── */
function gebrekenRows(groups: GebrekenGroup[], isOpname: boolean): string {
  const cols = isOpname ? 4 : 6;

  if (groups.length === 0) {
    return `<tr>
      <td colspan="${cols}" style="padding:18px;text-align:center;color:#999;font-style:italic;font-size:10px;">
        Geen gebreken geregistreerd.
      </td>
    </tr>`;
  }

  let rowNum = 0;
  let totalAantal = 0;
  let totalErnstig = 0;

  const rows = groups.map((group) => {
    const dataRows = group.gebreken.map((g) => {
      rowNum++;
      totalAantal += g.aantal;
      if (g.ernstig) totalErnstig++;

      const bg = rowNum % 2 === 0 ? "#f9f9f9" : "#ffffff";

      const fotoRow = g.fotoPad
        ? `<tr>
            <td colspan="${cols}" style="padding:8px 14px 12px;background:#fef9f7;text-align:center;border-bottom:1px solid #f0e0d8;">
              <img src="${esc(g.fotoPad)}" style="max-height:180px;max-width:95%;border:1px solid #e0c8bc;border-radius:4px;" alt="foto"/>
              <div style="font-size:9px;color:#999;font-style:italic;margin-top:4px;">Foto: ${esc(g.categorie || g.omschrijving)}</div>
            </td>
          </tr>`
        : "";

      const ruimte = `${rowNum}&nbsp;&nbsp;${esc(g.categorie || g.titel || "—")}`;

      const extraCols = isOpname ? "" : `
        <td style="padding:6px 4px;text-align:center;font-size:10px;width:7%;">${g.genoteerd ? "●" : ""}</td>
        <td style="padding:6px 4px;text-align:center;font-size:10px;width:7%;">${g.directHerstel ? "●" : ""}</td>`;

      return `<tr style="background:${bg};border-bottom:1px solid #eeeeee;">
        <td style="padding:6px 10px;font-size:10px;color:#333;width:35%;">${ruimte}</td>
        <td style="padding:6px 10px;font-size:10px;color:#333;">${esc(g.omschrijving)}</td>
        <td style="padding:6px 4px;text-align:center;font-size:10px;width:7%;">${g.aantal}</td>
        <td style="padding:6px 4px;text-align:center;font-size:10px;width:7%;color:${g.ernstig ? "#c0392b" : "#333"};">${g.ernstig ? "●" : ""}</td>
        ${extraCols}
      </tr>${fotoRow}`;
    }).join("");

    return `<tr style="background:#fef3ed;">
      <td colspan="${cols}" style="padding:6px 10px;font-size:9.5px;font-weight:700;color:${ORANGE};letter-spacing:0.07em;text-transform:uppercase;border-top:1px solid #e8d0c4;border-bottom:1px solid #e8d0c4;">
        ${esc(group.locatie)}
      </td>
    </tr>${dataRows}`;
  }).join("");

  const totalExtraCols = isOpname ? "" : `<td colspan="2"></td>`;
  const totalRow = `<tr style="border-top:2px solid #ccc;background:#f5f5f5;">
    <td style="padding:7px 10px;font-size:10px;font-weight:700;color:#333;" colspan="2">Totaal aantal gebreken</td>
    <td style="padding:7px 4px;text-align:center;font-size:10px;font-weight:700;">${totalAantal}</td>
    <td style="padding:7px 4px;text-align:center;font-size:10px;font-weight:700;">${totalErnstig}</td>
    ${totalExtraCols}
  </tr>`;

  return rows + totalRow;
}

/* ─────────────────────────────────────────────────────────────── */
/* Report title                                                   */
/* ─────────────────────────────────────────────────────────────── */
function reportTitle(type: string): string {
  if (type === "Proces-verbaal") return "Opleveringsrapport / Proces-verbaal van oplevering";
  if (type === "Opname")        return "Opnamerapport / Opname";
  return "Opleveringsrapport / Schaduwrapport";
}

/* ─────────────────────────────────────────────────────────────── */
/* Intro text per rapport type                                    */
/* ─────────────────────────────────────────────────────────────── */
function introText(data: PdfInput): string {
  const { rapport, opdracht, woning } = data;

  if (rapport.rapporttype === "Opname") {
    /* Matches official Opname PDF wording exactly */
    return `De Bouwkundige heeft op <strong>${fmt(opdracht.createdAt)}</strong> op verzoek van
      <strong>${esc(opdracht.opdrachtgeverNaam)}</strong> een keuring verricht van (een deel van) de woning
      <strong>${esc(opdracht.adresStraat)}</strong> te <strong>${esc(opdracht.adresPlaats)}</strong>.<br/><br/>
      De bouwkundige heeft in dit rapport zijn bevindingen weergegeven.`;
  }

  if (rapport.rapporttype === "Proces-verbaal") {
    return `Aan <strong>${esc(opdracht.opdrachtgeverNaam)}</strong>, is de woning
      <strong>${esc(opdracht.adresStraat)}</strong> te <strong>${esc(opdracht.adresPlaats)}</strong>
      op <strong>${fmt(opdracht.createdAt)}</strong> door contractpartij
      <strong>${esc(woning?.contractpartij)}</strong>, gevestigd te
      <strong>${esc(woning?.vestigingsplaatsContractpartij)}</strong>, vertegenwoordigd door
      <strong>${esc(woning?.vertegenwoordiger)}</strong> opgeleverd.
      De verkrijger verklaart de sleutels van het pand in ontvangst te hebben genomen.`;
  }

  /* Schaduwrapport */
  return `Aan <strong>${esc(opdracht.opdrachtgeverNaam)}</strong>, is de woning
    <strong>${esc(opdracht.adresStraat)}</strong> te <strong>${esc(opdracht.adresPlaats)}</strong>
    op <strong>${fmt(opdracht.createdAt)}</strong> door contractpartij
    <strong>${esc(woning?.contractpartij)}</strong>, gevestigd te
    <strong>${esc(woning?.vestigingsplaatsContractpartij)}</strong>, vertegenwoordigd door
    <strong>${esc(woning?.vertegenwoordiger)}</strong> opgeleverd.<br/><br/>
    De contractpartij heeft een proces-verbaal opgesteld dat door de verkrijger en de vertegenwoordiger
    van de contractpartij is ondertekend. Het proces-verbaal is het officiële document waarin
    tekortkomingen en andere gegevens zijn vastgelegd.<br/>
    Dit opleveringsrapport kan als schaduwrapport worden beschouwd. De bouwkundige heeft hierin zijn
    bevindingen weergegeven.`;
}

/* ─────────────────────────────────────────────────────────────── */
/* Page 5 body (signatures / concept notice)                      */
/* Only rendered for Schaduwrapport and Proces-verbaal            */
/* ─────────────────────────────────────────────────────────────── */
function page5Body(data: PdfInput): string {
  const { rapport, opdracht } = data;

  if (rapport.rapporttype === "Proces-verbaal") {
    const sigRep    = rapport.signatureRepresentative ?? "";
    const sigClient = rapport.signatureClient ?? "";

    return `
      <p style="font-size:10.5px;color:#333;line-height:1.75;margin-bottom:10px;">
        De contractpartij verklaart zich akkoord met de in dit proces-verbaal geregistreerde gegevens.
      </p>
      <p style="font-size:10.5px;color:#333;line-height:1.75;margin-bottom:10px;">
        Tevens verklaart de contractpartij dat hij bovenstaande tekortkomingen binnen de in de
        contractstukken bepaalde periode zal hebben hersteld. Indien en voor zover de contractstukken
        geen periode voorschrijven, zullen de genoemde tekortkomingen onverwijld, maar uiterlijk
        binnen 3 maanden na heden worden hersteld.
      </p>
      <p style="font-size:10.5px;font-weight:700;color:#111;margin-bottom:30px;">
        Datum: ${fmt(opdracht.createdAt)}
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;">
        <div style="border:1px solid #e0e0e0;border-radius:6px;padding:14px;text-align:center;">
          <div style="font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-bottom:12px;">De Contractpartij</div>
          <div style="height:100px;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:4px;">
            ${sigRep ? `<img src="${sigRep}" style="max-height:96px;max-width:100%;object-fit:contain;" alt="Handtekening contractpartij"/>` : '<span style="color:#ccc;font-size:11px;">Geen handtekening</span>'}
          </div>
        </div>
        <div style="border:1px solid #e0e0e0;border-radius:6px;padding:14px;text-align:center;">
          <div style="font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-bottom:12px;">De Verkrijger</div>
          <div style="height:100px;display:flex;align-items:center;justify-content:center;background:#fafafa;border-radius:4px;">
            ${sigClient ? `<img src="${sigClient}" style="max-height:96px;max-width:100%;object-fit:contain;" alt="Handtekening verkrijger"/>` : '<span style="color:#ccc;font-size:11px;">Geen handtekening</span>'}
          </div>
        </div>
      </div>`;
  }

  return `
    <div style="border:1px solid #e5e7eb;border-radius:6px;padding:28px;text-align:center;background:#fafafa;margin-top:10px;">
      <p style="font-size:12px;color:#666;font-style:italic;">
        Dit betreft een concept-schaduwrapport zonder definitieve digitale fiattering.
      </p>
    </div>`;
}

/* ─────────────────────────────────────────────────────────────── */
/* Shared sub-components                                          */
/* ─────────────────────────────────────────────────────────────── */

function tr(label: string, value: string | null | undefined, idx: number): string {
  const bg = idx % 2 === 0 ? "#ffffff" : "#f5f5f5";
  return `<tr style="background:${bg};border-bottom:1px solid #eeeeee;">
    <td style="padding:6px 12px;font-size:10px;font-weight:600;color:#555;width:38%;">${label}</td>
    <td style="padding:6px 12px;font-size:10px;color:#333;">${esc(value)}</td>
  </tr>`;
}

function tableHeader(title: string): string {
  return `<tr>
    <th colspan="2" style="background:${ORANGE};color:#fff;font-size:10px;font-weight:700;padding:8px 12px;text-align:left;letter-spacing:0.06em;text-transform:uppercase;font-family:'Raleway',Arial,sans-serif;">
      ${title}
    </th>
  </tr>`;
}

function footer(opdrachtId: number, page: number, total: number): string {
  return `<div style="border-top:1px solid #ddd;padding-top:8px;margin-top:auto;display:flex;justify-content:space-between;font-size:8px;color:#aaa;font-family:'Raleway',Arial,sans-serif;">
    <span>Opdrachtnummer ${opdrachtId}</span>
    <span>${page} van ${total}</span>
  </div>`;
}

function disclaimer(): string {
  return `<div style="margin-top:24px;">
    <p style="font-size:8.5px;font-weight:700;color:#444;margin-bottom:3px;">Disclaimer</p>
    <p style="font-size:8.5px;color:#666;line-height:1.7;margin-bottom:10px;">
      ©2026 Eigen Huis Bouwkundig Advies B.V.<br/>
      Niets van de inhoud van dit rapport mag worden overgenomen, tenzij met uitdrukkelijke schriftelijke
      toestemming van Eigen Huis Bouwkundig Advies B.V.
    </p>
    <div style="border:1px solid #ddd;border-radius:4px;padding:9px 12px;">
      <p style="font-size:8.5px;color:#555;line-height:1.7;">
        Dit is een uitgave van <strong>Eigen Huis Bouwkundig Advies B.V.</strong> (een 100% dochter van Vereniging Eigen Huis)<br/>
        Postbus 735, 3800 AS, Amersfoort
      </p>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════ */
/* MAIN EXPORT                                                    */
/* ═══════════════════════════════════════════════════════════════ */
export function generateRapportHtml(data: PdfInput): string {
  const { opdracht, woning, meterstanden: ms, rapport, coverPhoto } = data;
  const datumKeuring = fmt(opdracht.createdAt);
  const isOpname = rapport.rapporttype === "Opname";

  /* Opname = 4 pages (no signatures page); others = 5 pages */
  const totalPages = isOpname ? 4 : 5;

  /* Satisfy = orange script headings, Raleway = all body/UI text */
  const fonts = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Satisfy&family=Raleway:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8"/>
${fonts}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Raleway', Arial, sans-serif;
    color: #333;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 0; }
  .page { width: 210mm; page-break-after: always; background: #fff; }
  .page:last-child { page-break-after: avoid; }
  .script { font-family: 'Satisfy', cursive; color: ${ORANGE}; }
  table { border-collapse: collapse; width: 100%; }
  th, td { vertical-align: middle; }
</style>
</head>
<body>


<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 1 — VOORBLAD                                            -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page" style="min-height:297mm;display:flex;flex-direction:column;overflow:hidden;">

  <!-- Cover photo — full width, ~62% of page height -->
  <div style="width:100%;height:185mm;overflow:hidden;flex-shrink:0;">
    ${coverPhoto
      ? `<img src="${coverPhoto}" style="width:100%;height:100%;object-fit:cover;object-position:center;" alt="cover"/>`
      : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${NAVY},#2d4a8a);"></div>`}
  </div>

  <!-- White info section -->
  <div style="flex:1;padding:16px 28px 14px;display:flex;flex-direction:column;justify-content:space-between;">

    <!-- "Rapport" script + "Opleveringskeuring" heavy -->
    <div style="margin-bottom:14px;">
      <div class="script" style="font-size:26px;line-height:1.1;">Rapport</div>
      <div style="font-size:34px;font-weight:900;color:${NAVY};line-height:1;letter-spacing:-0.5px;">Opleveringskeuring</div>
    </div>

    <!-- Info blocks: OPDRACHTNUMMER + GEKEURD OBJECT on same row, DATUM below -->
    <div>
      <div style="display:grid;grid-template-columns:140px 1fr;gap:0 24px;margin-bottom:14px;">
        <div>
          <div style="font-size:8px;font-weight:700;color:${ORANGE};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px;">Opdrachtnummer</div>
          <div style="font-size:11px;color:#333;font-weight:500;">${opdracht.id}</div>
        </div>
        <div>
          <div style="font-size:8px;font-weight:700;color:${ORANGE};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px;">Gekeurd Object</div>
          <div style="font-size:11px;color:#333;font-weight:500;">${esc(opdracht.adresStraat)}</div>
          <div style="font-size:11px;color:#333;font-weight:500;">${esc(opdracht.adresPlaats)}</div>
        </div>
      </div>
      <div>
        <div style="font-size:8px;font-weight:700;color:${ORANGE};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px;">Datum</div>
        <div style="font-size:11px;color:#333;font-weight:500;">${datumKeuring}</div>
      </div>
    </div>

    <!-- Logo bottom-right -->
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:10px;">
      <div style="line-height:1.3;text-align:right;">
        <div style="font-size:13px;font-weight:700;color:${NAVY};">vereniging</div>
        <div style="font-size:13px;font-weight:700;color:${NAVY};">eigen huis</div>
      </div>
      ${logoSvg()}
      <div style="border-left:1px solid #ccc;padding-left:10px;line-height:1.3;">
        <div style="font-size:12px;font-weight:700;color:#555;">sta</div>
        <div style="font-size:12px;font-weight:700;color:#555;">sterker</div>
      </div>
    </div>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 2 — TOELICHTING                                         -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page" style="padding:17mm 20mm 14mm;display:flex;flex-direction:column;min-height:297mm;">
  <div style="flex:1;">
    <h2 class="script" style="font-size:22px;margin-bottom:18px;">Toelichting</h2>

    <section style="margin-bottom:16px;">
      <h3 style="font-size:9.5px;font-weight:700;color:${ORANGE};text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;">Introductie</h3>
      <p style="font-size:10px;color:#333;line-height:1.8;">
        Via Eigen Huis Bouwkundig Advies B.V. heeft de bouwkundige u begeleid bij de oplevering van uw nieuwbouwwoning.
        Samen met u is de bouwkundige en een vertegenwoordiger van de contractpartij (bijvoorbeeld de bouwer) door de
        woning gelopen. Gebreken zijn vastgelegd in dit rapport naar aanleiding van bevindingen tijdens de Opleveringskeuring.
        Deze rapportage van de bouwkundige is meestal een zogenaamd 'schaduwrapport', terwijl de vertegenwoordiger van de
        contractpartij het officiële opleveringsrapport opmaakt. Het officiële opleveringsrapport wordt het proces-verbaal van
        oplevering genoemd en is door u en de vertegenwoordiger ondertekend.
      </p>
      <p style="font-size:10px;color:#333;line-height:1.8;margin-top:8px;">
        Door deze Opleveringskeuring heeft u meer inzicht gekregen in uw nieuwe woning, zijn bouwkundige gebreken vastgelegd
        en heeft u een sterke positie tegenover de contractpartij.
      </p>
      <p style="font-size:10px;color:#333;line-height:1.8;margin-top:8px;">
        Tijdens een keuring geeft de bouwkundige vaak verschillende tips over het gebruik van een nieuwe woning en de
        installaties, over het schoonmaken van onderdelen en toegepaste materialen. Deze tips zijn niet opgenomen in dit rapport.
      </p>
    </section>

    <section style="margin-bottom:16px;">
      <h3 style="font-size:9.5px;font-weight:700;color:${ORANGE};text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;">Gebreken na oplevering</h3>
      <p style="font-size:10px;color:#333;line-height:1.8;">
        Bij het in gebruik nemen van de woning kunnen nog meer zaken aan het licht komen die niet (helemaal) in orde zijn.
        De deuren sluiten bijvoorbeeld niet goed, het water in de doucheruimte loopt niet direct weg, een wandcontactdoos
        blijkt niet te werken of bij het inrichten met meubels ziet u dat een muur niet helemaal recht is. Deze gebreken kunt
        u, meestal tot zes maanden na de oplevering, melden bij uw contractpartij. Houd er rekening mee dat krassen en
        beschadigingen na oplevering doorgaans lastig onder de aansprakelijkheid van de contractpartij zijn te brengen, tenzij
        u aannemelijk kunt maken dat u deze beschadigingen niet zelf heeft kunnen veroorzaken.
      </p>
      <p style="font-size:10px;color:#333;line-height:1.8;margin-top:8px;">
        Voor alle gebreken die u tegenkomt geldt: meld dit gebrek direct schriftelijk aan de contractpartij. Is uw woning
        gebouwd met een garantieregeling (SWK, Woningborg of BouwGarant), stuur dan een kopie van uw melding naar de
        betreffende instantie. De gebreken die in het proces-verbaal van oplevering zijn gemeld, moet de contractpartij
        binnen drie maanden herstellen. Zijn deze gebreken (gedeeltelijk) niet hersteld dan kunt u terugvallen op de 5%-regeling.
      </p>
    </section>

    <section style="margin-bottom:16px;">
      <h3 style="font-size:9.5px;font-weight:700;color:${ORANGE};text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;">5%-Regeling</h3>
      <p style="font-size:10px;color:#333;line-height:1.8;">
        U heeft het recht om bij oplevering de laatste 5% van de aanneemsom in depot te storten bij de notaris. In plaats
        daarvan kan de contractpartij ervoor kiezen een bankgarantie bij de notaris te stellen.
      </p>
      <p style="font-size:10px;color:#333;line-height:1.8;margin-top:8px;">
        Mocht de contractpartij de opleveringsgebreken, of gebreken die tijdens de eerste drie maanden opduiken niet
        herstellen, dan heeft u met deze 5%-regeling een stok achter de deur. Laat de notaris vóór het verstrijken van de
        driemaandentermijn in een (aangetekende) brief weten dat u (een redelijk deel van) het depot of de bankgarantie wilt
        handhaven totdat de nog openstaande gebreken zijn hersteld.
      </p>
    </section>

    <section>
      <h3 style="font-size:9.5px;font-weight:700;color:${ORANGE};text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;">Vragen</h3>
      <p style="font-size:10px;color:#333;line-height:1.8;">
        Heeft u nog vragen? Neem dan contact op met het informatie en adviescentrum van Vereniging Eigen Huis via
        <strong>(033) 450 77 50</strong>.
      </p>
    </section>
  </div>
  ${footer(opdracht.id, 2, totalPages)}
</div>


<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 3 — BASISGEGEVENS                                       -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page" style="padding:17mm 20mm 14mm;display:flex;flex-direction:column;min-height:297mm;">
  <div style="flex:1;">
    <h2 class="script" style="font-size:22px;margin-bottom:18px;">Basisgegevens</h2>

    <!-- AANVRAGER — fixed constants -->
    <div style="margin-bottom:16px;border:1px solid #e0e0e0;border-radius:3px;overflow:hidden;">
      <table>
        <thead>${tableHeader("Aanvrager")}</thead>
        <tbody>
          ${tr("Naam",       "T. Vereniging Eigen Huis", 0)}
          ${tr("Adres",      "Displayweg 1",             1)}
          ${tr("Postcode",   "3821BT",                   2)}
          ${tr("Woonplaats", "Amersfoort",               3)}
          ${tr("Lidnummer",  "526614",                   4)}
          ${tr("E-mail",     "526614@eigenhuis.nl",      5)}
        </tbody>
      </table>
    </div>

    <!-- BOUWKUNDIGE — fixed constants -->
    <div style="margin-bottom:16px;border:1px solid #e0e0e0;border-radius:3px;overflow:hidden;">
      <table>
        <thead>${tableHeader("Bouwkundige")}</thead>
        <tbody>
          ${tr("Naam",     "Erbisim, B.",     0)}
          ${tr("Nummer",   "M2267",           1)}
          ${tr("Telefoon", "(033) 450 77 50", 2)}
        </tbody>
      </table>
    </div>

    <!-- GEGEVENS GEKEURD OBJECT — dynamic from opdracht -->
    <div style="border:1px solid #e0e0e0;border-radius:3px;overflow:hidden;">
      <table>
        <thead>${tableHeader("Gegevens Gekeurd Object")}</thead>
        <tbody>
          ${tr("Adres",            opdracht.adresStraat,                                                           0)}
          ${tr("Postcode",         opdracht.adresPostcode,                                                         1)}
          ${tr("Woonplaats",       opdracht.adresPlaats,                                                           2)}
          ${tr("Datum keuring",    datumKeuring,                                                                   3)}
          ${tr("Weersgesteldheid", woning?.weersomstandigheden,                                                    4)}
          ${tr("Woningtype",       woning?.typeWoning || opdracht.typeWoning,                                      5)}
          ${tr("Inhoud",           woning?.woningGrootte ? woning.woningGrootte + " m³" : "onbekend",             6)}
          ${tr("Bouwwijze",        woning?.bouwwijze,                                                              7)}
          ${tr("Project",          woning?.projectNaam,                                                            8)}
          ${tr("Contractpartij",   woning?.contractpartij
                                     ? `${woning.contractpartij}${woning.vestigingsplaatsContractpartij ? ", " + woning.vestigingsplaatsContractpartij : ""}`
                                     : null,                                                                       9)}
          ${tr("Bouwer",           woning?.bouwer,                                                                10)}
        </tbody>
      </table>
    </div>
  </div>
  ${footer(opdracht.id, 3, totalPages)}
</div>


<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 4 — RAPPORTAGE (meterstanden + gebreken)                -->
<!-- For Opname: also contains disclaimer at bottom (= last page)  -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page" style="padding:17mm 20mm 14mm;display:flex;flex-direction:column;min-height:297mm;">
  <div style="flex:1;">

    <!-- Report title (orange Satisfy script) -->
    <h2 class="script" style="font-size:22px;margin-bottom:10px;">${reportTitle(rapport.rapporttype)}</h2>

    <!-- Intro paragraph(s) -->
    <p style="font-size:10px;color:#333;line-height:1.8;margin-bottom:18px;">${introText(data)}</p>

    <!-- METERSTANDEN — 3-column layout matching official PDF -->
    <p style="font-size:9.5px;font-weight:700;color:${ORANGE};text-transform:uppercase;letter-spacing:0.09em;margin-bottom:8px;">Meterstanden</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;row-gap:5px;font-size:10px;color:#333;margin-bottom:20px;">
      <!-- Col 1: Elektra group (4 rows) -->
      <!-- Col 2: Water/Gas (2 rows, rest empty) -->
      <!-- Col 3: Warmte group (3 rows) -->
      <div><strong>Elektra I</strong>&emsp;${esc(nvt(ms?.elektraI))}</div>
      <div><strong>Water</strong>&emsp;${esc(nvt(ms?.water))}</div>
      <div><strong>Warmte</strong>&emsp;${esc(nvt(ms?.warmte))}</div>
      <div><strong>Elektra II</strong>&emsp;${esc(nvt(ms?.elektraII))}</div>
      <div><strong>Gas</strong>&emsp;${esc(nvt(ms?.gas))}</div>
      <div><strong>Warmwater</strong>&emsp;${esc(nvt(ms?.warmwater))}</div>
      <div><strong>Elektra retour I</strong>&emsp;${esc(nvt(ms?.elektraRetourI))}</div>
      <div></div>
      <div><strong>Koeling</strong>&emsp;${esc(nvt(ms?.koeling))}</div>
      <div><strong>Elektra retour II</strong>&emsp;${esc(nvt(ms?.elektraRetourII))}</div>
    </div>

    <!-- Rapportage sub-heading -->
    <h3 class="script" style="font-size:20px;margin-bottom:8px;">Rapportage</h3>
    <p style="font-size:10px;color:#333;line-height:1.7;margin-bottom:12px;">
      In onderstaand overzicht zijn de geconstateerde gebreken door de bouwkundige vastgelegd en eventuele opmerkingen geplaatst.
    </p>

    <!-- Column legend — only for Schaduwrapport and Proces-verbaal -->
    ${!isOpname ? `
    <table style="width:100%;font-size:9.5px;color:#444;margin-bottom:10px;">
      <tr>
        <td style="font-weight:700;padding:1px 10px 3px 0;white-space:nowrap;vertical-align:top;width:1%;">Ernstig:</td>
        <td style="line-height:1.6;">Gebreken die door de bouwkundige zijn aangemerkt als ernstig gebrek.</td>
      </tr>
      <tr>
        <td style="font-weight:700;padding:1px 10px 3px 0;white-space:nowrap;vertical-align:top;">Genoteerd:</td>
        <td style="line-height:1.6;">Gebreken die niet alleen in dit rapport zijn opgenomen maar ook door de contractpartij in het proces-verbaal van oplevering zijn genoteerd.</td>
      </tr>
      <tr>
        <td style="font-weight:700;padding:1px 10px 3px 0;white-space:nowrap;vertical-align:top;">Direct herstel:</td>
        <td style="line-height:1.6;">Gebreken waarvan de contractpartij heeft toegezegd deze tijdens de rondgang direct te herstellen.</td>
      </tr>
    </table>` : ""}

    <!-- Gebreken table -->
    <div style="border:1px solid #ddd;border-radius:3px;overflow:hidden;">
      <table>
        <thead>
          <tr style="background:${ORANGE};color:#fff;">
            <th style="padding:8px 10px;font-size:9px;font-weight:700;text-align:left;text-transform:uppercase;width:38%;">Ruimte/Onderdeel</th>
            <th style="padding:8px 10px;font-size:9px;font-weight:700;text-align:left;text-transform:uppercase;">Gebreken</th>
            <th style="padding:4px 3px;width:7%;vertical-align:bottom;text-align:center;">
              <div style="writing-mode:vertical-lr;transform:rotate(180deg);font-size:8px;font-weight:700;text-transform:uppercase;white-space:nowrap;padding-bottom:4px;">Aantal</div>
            </th>
            <th style="padding:4px 3px;width:7%;vertical-align:bottom;text-align:center;">
              <div style="writing-mode:vertical-lr;transform:rotate(180deg);font-size:8px;font-weight:700;text-transform:uppercase;white-space:nowrap;padding-bottom:4px;">Ernstig</div>
            </th>
            ${!isOpname ? `
            <th style="padding:4px 3px;width:7%;vertical-align:bottom;text-align:center;">
              <div style="writing-mode:vertical-lr;transform:rotate(180deg);font-size:8px;font-weight:700;text-transform:uppercase;white-space:nowrap;padding-bottom:4px;">Genoteerd</div>
            </th>
            <th style="padding:4px 3px;width:7%;vertical-align:bottom;text-align:center;">
              <div style="writing-mode:vertical-lr;transform:rotate(180deg);font-size:8px;font-weight:700;text-transform:uppercase;white-space:nowrap;padding-bottom:4px;">Direct&nbsp;herstel</div>
            </th>` : ""}
          </tr>
        </thead>
        <tbody>
          ${gebrekenRows(data.gebrekenGroups, isOpname)}
        </tbody>
      </table>
    </div>

    <!-- For Opname: disclaimer lives here at bottom of page 4 -->
    ${isOpname ? disclaimer() : ""}
  </div>
  ${footer(opdracht.id, 4, totalPages)}
</div>


${!isOpname ? `
<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 5 — ONDERTEKENING / COLOFON (not for Opname)            -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div class="page" style="padding:17mm 20mm 14mm;display:flex;flex-direction:column;min-height:297mm;">
  <div style="flex:1;">
    <h2 class="script" style="font-size:22px;margin-bottom:16px;">
      ${rapport.rapporttype === "Proces-verbaal" ? "Ondertekening" : "Afronding"}
    </h2>
    ${page5Body(data)}
  </div>

  <div>
    ${disclaimer()}
    <div style="border-top:1px solid #ddd;padding-top:8px;margin-top:12px;display:flex;justify-content:space-between;font-size:8px;color:#aaa;">
      <span>Opdrachtnummer ${opdracht.id}</span>
      <span>5 van 5</span>
    </div>
  </div>
</div>
` : ""}


</body>
</html>`;
}
