import { type AuthTokenPayload, verifyToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

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
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    return verifyToken(token) as AuthTokenPayload;
  } catch {
    return null;
  }
}
