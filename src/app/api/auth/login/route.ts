import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth-cookie";
import { verifyPassword, signToken } from "@/lib/auth";
import { normalizeEmail } from "@/lib/users";

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

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

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
