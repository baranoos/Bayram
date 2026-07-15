import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth-cookie";
import { verifyPassword, signToken } from "@/lib/auth";
import { normalizeEmail } from "@/lib/users";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  const identifier = normalizeEmail(email);

  let user;
  try {
    user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  } catch (error) {
    console.error("Login database error", error);
    return NextResponse.json(
      { error: "Database niet bereikbaar. Controleer DATABASE_URL en of Supabase online is." },
      { status: 503 }
    );
  }

  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Te veel mislukte pogingen. Probeer over ${minutesLeft} minuut/minuten opnieuw.` },
      { status: 429 }
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      },
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  const token = signToken({
    sub: String(user.id),
    role: user.role,
    email: user.email ?? user.username,
  });

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
  });
  res.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return res;
}
