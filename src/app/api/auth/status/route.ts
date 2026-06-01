import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ hasUsers: userCount > 0, userCount });
  } catch (error) {
    console.error("Auth status database error", error);
    return NextResponse.json(
      { hasUsers: false, userCount: 0, databaseError: true },
      { status: 503 }
    );
  }
}
