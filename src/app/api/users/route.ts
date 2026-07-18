import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireOwner } from "@/lib/auth-request";
import {
  isRole,
  isUniqueConstraintError,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  sanitizeUser,
  uniqueUsername,
  usernameFromEmail,
} from "@/lib/users";

/**
 * GET /api/users — list every account (owner only), for the user-management page.
 */
export async function GET(req: Request) {
  const auth = await requireOwner(req);
  if (!auth.ok) return auth.response;

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ users: users.map(sanitizeUser) });
}

/**
 * POST /api/users — create a new employee/owner account (owner only).
 */
export async function POST(req: Request) {
  const auth = await requireOwner(req);
  if (!auth.ok) return auth.response;

  let body: { name?: string; email?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim() || null;
  const emailRaw = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "EMPLOYEE").toUpperCase();

  if (!emailRaw || !emailRaw.includes("@")) {
    return NextResponse.json({ error: "Vul een geldig e-mailadres in" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn` }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 409 });
  }

  const username = await uniqueUsername(prisma, usernameFromEmail(email));
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { username, email, name, passwordHash, role, active: true },
    });
    return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
  } catch (err) {
    // Two simultaneous requests for the same email can both pass the findUnique
    // check above before either inserts — the DB's unique constraint is the real
    // guard; this just turns that race into the same clean 409 instead of a 500.
    if (isUniqueConstraintError(err)) {
      return NextResponse.json({ error: "Dit e-mailadres is al in gebruik" }, { status: 409 });
    }
    throw err;
  }
}
