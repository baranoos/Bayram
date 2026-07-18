import { NextResponse } from "next/server";
import { payloadUserId } from "@/lib/auth";
import { getAuthPayloadFromRequest } from "@/lib/auth-request";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const id = payloadUserId(getAuthPayloadFromRequest(req));
  if (id === null) return NextResponse.json({ user: null }, { status: 200 });

  const user = await prisma.user.findUnique({ where: { id } });

  // User was deleted or deactivated after this token was issued — end the
  // session now instead of waiting for the 7-day token to expire.
  if (!user || !user.active) {
    const res = NextResponse.json({ user: null }, { status: 200 });
    res.cookies.set(AUTH_COOKIE_NAME, "", { ...getAuthCookieOptions(0), maxAge: 0 });
    return res;
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
