import { NextResponse } from "next/server";
import { type AuthTokenPayload, payloadUserId, safeVerifyToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export function getTokenFromRequest(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1];
  }
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(^|; )${AUTH_COOKIE_NAME}=([^;]+)`));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

export function getAuthPayloadFromRequest(req: Request): AuthTokenPayload | null {
  return safeVerifyToken(getTokenFromRequest(req));
}

type RequireOwnerResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

/**
 * Re-checks role and active status against the database (not just the JWT
 * claim) so a demoted/deactivated owner loses access immediately on their
 * next call to a user-management endpoint, without waiting for token expiry.
 */
export async function requireOwner(req: Request): Promise<RequireOwnerResult> {
  const payload = getAuthPayloadFromRequest(req);
  if (!payload) {
    return { ok: false, response: NextResponse.json({ error: "Niet ingelogd" }, { status: 401 }) };
  }

  const id = payloadUserId(payload);
  const user = id === null ? null : await prisma.user.findUnique({ where: { id } });

  if (!user || !user.active || user.role !== "OWNER") {
    return { ok: false, response: NextResponse.json({ error: "Geen toegang" }, { status: 403 }) };
  }

  return { ok: true, user };
}
