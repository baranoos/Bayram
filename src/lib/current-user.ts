import { cookies } from "next/headers";
import { type AuthTokenPayload, payloadUserId, safeVerifyToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

/** For Server Components / Server Actions, which get the request via cookies() rather than a Request object. */
export async function getCurrentUserPayload(): Promise<AuthTokenPayload | null> {
  const store = await cookies();
  return safeVerifyToken(store.get(AUTH_COOKIE_NAME)?.value);
}

export async function getCurrentUserId(): Promise<number | null> {
  return payloadUserId(await getCurrentUserPayload());
}

/** Fresh DB row for the logged-in user — use for owner-gated Server Components. */
export async function getCurrentUser() {
  const id = await getCurrentUserId();
  if (id === null) return null;
  return prisma.user.findUnique({ where: { id } });
}
