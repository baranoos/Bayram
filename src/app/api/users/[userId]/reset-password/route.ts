import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireOwner } from "@/lib/auth-request";
import { MIN_PASSWORD_LENGTH, resolveTargetUser } from "@/lib/users";

/**
 * POST /api/users/[userId]/reset-password — owner sets a new password for
 * another account. Also clears any active lockout, since a fresh password
 * from the owner is a legitimate reason to let the user back in immediately.
 */
export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireOwner(req);
  if (!auth.ok) return auth.response;

  const { userId: raw } = await params;
  const resolved = await resolveTargetUser(prisma, raw);
  if (!resolved.ok) return resolved.response;
  const target = resolved.user;

  let body: { newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const newPassword = String(body.newPassword ?? "");
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn` }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  });

  return NextResponse.json({ success: true });
}
