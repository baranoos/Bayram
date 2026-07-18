import type { PrismaClient, User } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// --- Roles ---------------------------------------------------------------

export const ROLES = ["OWNER", "EMPLOYEE"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

// --- Password policy -------------------------------------------------------

export const MIN_PASSWORD_LENGTH = 8;

// --- Safe user projection --------------------------------------------------

export type SafeUser = {
  id: number;
  name: string | null;
  email: string | null;
  username: string;
  role: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export function sanitizeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

// --- Prisma error helpers ----------------------------------------------

/** True for a Prisma unique-constraint violation (P2002) — e.g. a duplicate email race. */
export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

// --- Owner-count / last-owner guard ----------------------------------------

/** Number of active OWNER accounts, optionally excluding one user (e.g. the one being edited). */
export async function countActiveOwners(prisma: PrismaClient, excludeUserId?: number) {
  return prisma.user.count({
    where: {
      role: "OWNER",
      active: true,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

// --- Target-user resolution for /api/users/[userId] routes -----------------

type ResolveTargetUserResult = { ok: true; user: User } | { ok: false; response: NextResponse };

/** Parses a route param into a user id and loads that user, or returns the 400/404 response to send back. */
export async function resolveTargetUser(prisma: PrismaClient, rawUserId: string): Promise<ResolveTargetUserResult> {
  const userId = Number(rawUserId);
  if (Number.isNaN(userId)) {
    return { ok: false, response: NextResponse.json({ error: "Ongeldige gebruiker" }, { status: 400 }) };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 }) };
  }

  return { ok: true, user };
}

// --- Email / username normalization -----------------------------------

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
