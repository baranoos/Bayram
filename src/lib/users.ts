import type { PrismaClient } from "@prisma/client";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function usernameFromEmail(email: string) {
  const base = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, "") ?? "";
  return base || "user";
}

export async function uniqueUsername(prisma: PrismaClient, base: string) {
  let username = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${suffix}`;
    suffix += 1;
  }
  return username;
}
