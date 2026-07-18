import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_JWT_SECRET ?? "";
if (!JWT_SECRET) {
  // fail early in dev if missing
  if (process.env.NODE_ENV !== "production") {
    console.warn("AUTH_JWT_SECRET is not set. Set it in .env to enable auth.");
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export type AuthTokenPayload = JwtPayload & {
  sub: string;
  role: string;
  email?: string;
};

export function signToken(payload: AuthTokenPayload) {
  if (!JWT_SECRET) throw new Error("AUTH_JWT_SECRET not configured");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  if (!JWT_SECRET) throw new Error("AUTH_JWT_SECRET not configured");
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

/** verifyToken(), but returns null instead of throwing for a missing/invalid/expired token. */
export function safeVerifyToken(token: string | null | undefined): AuthTokenPayload | null {
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** Numeric user id from a token payload's `sub` claim, or null if absent/malformed. */
export function payloadUserId(payload: AuthTokenPayload | null): number | null {
  if (!payload) return null;
  const id = Number(payload.sub);
  return Number.isNaN(id) ? null : id;
}

export function parseBearer(token?: string | null) {
  if (!token) return null;
  const m = token.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : token;
}
