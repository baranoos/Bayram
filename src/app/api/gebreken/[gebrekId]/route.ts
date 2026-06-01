import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gebrekId: string }> }
) {
  const { gebrekId: rawId } = await params;
  const id = Number(rawId);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Ongeldig gebrek id" }, { status: 400 });
  }

  try {
    // Ensure the gebrek exists
    const existing = await prisma.gebrek.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Gebrek niet gevonden" }, { status: 404 });
    }

    await prisma.gebrek.delete({ where: { id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
