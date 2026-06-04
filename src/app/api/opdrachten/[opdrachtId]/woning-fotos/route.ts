import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: rawId } = await params;
  const opdrachtId = Number(rawId);

  if (Number.isNaN(opdrachtId)) {
    return NextResponse.json({ error: "Ongeldige opdracht" }, { status: 400 });
  }

  const { urls } = (await request.json()) as { urls: string[] };

  if (!Array.isArray(urls)) {
    return NextResponse.json({ error: "urls moet een array zijn" }, { status: 400 });
  }

  const fotoVoorbladPad = urls.length > 0 ? JSON.stringify(urls) : null;

  await prisma.woning.upsert({
    where: { opdrachtId },
    create: { opdrachtId, fotoVoorbladPad },
    update: { fotoVoorbladPad },
  });

  return NextResponse.json({ ok: true });
}
