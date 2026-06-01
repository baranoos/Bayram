import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: raw } = await params;
  const opdrachtId = Number(raw);
  if (Number.isNaN(opdrachtId)) {
    return new Response(JSON.stringify({ error: "Ongeldige opdracht" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const opdracht = await prisma.opdracht.findUnique({
    where: { id: opdrachtId },
    include: {
      woning: { include: { omstandigheidItems: true } },
      resultaten: { include: { gebreken: true, fotos: true } },
      meterstanden: true,
      rapporten: true,
      opmerkingen: true,
      fotos: true,
    },
  });

  if (!opdracht) {
    return new Response(JSON.stringify({ error: "Opdracht niet gevonden" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const json = JSON.stringify(opdracht, null, 2);

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="opdracht-${opdrachtId}.json"`,
    },
  });
}
