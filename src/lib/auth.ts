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

export function parseBearer(token?: string | null) {
  if (!token) return null;
  const m = token.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : token;
}
