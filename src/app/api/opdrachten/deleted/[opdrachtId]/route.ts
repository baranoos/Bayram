import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * DELETE /api/opdrachten/deleted/[opdrachtId]
 * Permanently removes a soft-deleted opdracht (and its cascaded records)
 * from the database. Only allowed when the opdracht is already marked
 * "verwijderd", so this can't be used to hard-delete an active dossier.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ opdrachtId: string }> }
) {
  const { opdrachtId: rawOpdrachtId } = await params;
  const opdrachtId = Number(rawOpdrachtId);

  if (Number.isNaN(opdrachtId)) {
    return NextResponse.json({ error: "Ongeldige opdracht" }, { status: 400 });
  }

  const opdracht = await prisma.opdracht.findUnique({
    where: { id: opdrachtId },
    select: { id: true, status: true },
  });

  if (!opdracht) {
    return NextResponse.json({ error: "Opdracht niet gevonden" }, { status: 404 });
  }

  if (opdracht.status !== "verwijderd") {
    return NextResponse.json(
      { error: "Opdracht is niet verwijderd en kan niet permanent worden gewist" },
      { status: 400 }
    );
  }

  await prisma.opdracht.delete({ where: { id: opdrachtId } });

  return NextResponse.json({ success: true });
}
