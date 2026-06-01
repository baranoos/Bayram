import { NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/auth-request";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const payload = getAuthPayloadFromRequest(req);
  if (!payload) return NextResponse.json({ user: null }, { status: 200 });

  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } });
}
