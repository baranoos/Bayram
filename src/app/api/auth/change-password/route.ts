import { NextResponse } from "next/server";
import { hashPassword, payloadUserId, verifyPassword } from "@/lib/auth";
import { getAuthPayloadFromRequest } from "@/lib/auth-request";
import { prisma } from "@/lib/prisma";
import { MIN_PASSWORD_LENGTH } from "@/lib/users";

export async function POST(req: Request) {
  const payload = getAuthPayloadFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Vul alle velden in" }, { status: 400 });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Nieuw wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn` }, { status: 400 });
  }

  const id = payloadUserId(payload);
  const user = id === null ? null : await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Huidig wachtwoord is onjuist" }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
