import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-request";
import { countActiveOwners, isRole, isUniqueConstraintError, normalizeEmail, resolveTargetUser, sanitizeUser } from "@/lib/users";

/**
 * PATCH /api/users/[userId] — edit name/email/role/active (owner only).
 * Self-modification of role/active is blocked, and the last active OWNER
 * can't be demoted or deactivated — both would lock the company out.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireOwner(req);
  if (!auth.ok) return auth.response;

  const { userId: raw } = await params;
  const resolved = await resolveTargetUser(prisma, raw);
  if (!resolved.ok) return resolved.response;
  const target = resolved.user;

  let body: { name?: string | null; email?: string; role?: string; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const isSelf = target.id === auth.user.id;
  const data: { name?: string | null; email?: string; role?: string; active?: boolean } = {};

  if (body.name !== undefined) {
    data.name = String(body.name ?? "").trim() || null;
  }

  if (body.email !== undefined) {
    const email = normalizeEmail(String(body.email ?? "").trim());
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Vul een geldig e-mailadres in" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== target.id) {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 409 });
    }
    data.email = email;
  }

  if (body.role !== undefined) {
    if (isSelf) {
      return NextResponse.json({ error: "Je kunt je eigen rol niet wijzigen" }, { status: 400 });
    }
    const role = String(body.role).toUpperCase();
    if (!isRole(role)) {
      return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
    }
    if (target.role === "OWNER" && role !== "OWNER" && (await countActiveOwners(prisma, target.id)) === 0) {
      return NextResponse.json(
        { error: "Er moet minimaal één actieve eigenaar overblijven" },
        { status: 400 }
      );
    }
    data.role = role;
  }

  if (body.active !== undefined) {
    if (isSelf) {
      return NextResponse.json({ error: "Je kunt je eigen account niet deactiveren" }, { status: 400 });
    }
    if (
      target.role === "OWNER" &&
      body.active === false &&
      (await countActiveOwners(prisma, target.id)) === 0
    ) {
      return NextResponse.json(
        { error: "Er moet minimaal één actieve eigenaar overblijven" },
        { status: 400 }
      );
    }
    data.active = body.active;
  }

  try {
    const updated = await prisma.user.update({ where: { id: target.id }, data });
    return NextResponse.json({ user: sanitizeUser(updated) });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 409 });
    }
    throw err;
  }
}

/**
 * DELETE /api/users/[userId] — permanently remove an account (owner only).
 * References from Opdracht.createdByUserId / Rapport.generatedByUserId are
 * set to null (onDelete: SetNull), so historical dossiers/reports are kept.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireOwner(req);
  if (!auth.ok) return auth.response;

  const { userId: raw } = await params;
  const resolved = await resolveTargetUser(prisma, raw);
  if (!resolved.ok) return resolved.response;
  const target = resolved.user;

  if (target.id === auth.user.id) {
    return NextResponse.json({ error: "Je kunt jezelf niet verwijderen" }, { status: 400 });
  }

  if (target.role === "OWNER" && target.active && (await countActiveOwners(prisma, target.id)) === 0) {
    return NextResponse.json(
      { error: "Er moet minimaal één actieve eigenaar overblijven" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: target.id } });
  return NextResponse.json({ success: true });
}
