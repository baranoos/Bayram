import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/opdrachten?limit=20
 * Returns a minimal list of opdrachten used by the PWA cache-warming routine.
 * Protected by the global JWT middleware like all other API routes.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  try {
    const opdrachten = await prisma.opdracht.findMany({
      select: { id: true, updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
    });

    return NextResponse.json({ opdrachten });
  } catch {
    return NextResponse.json({ opdrachten: [] });
  }
}
