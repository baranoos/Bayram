import { NextResponse } from "next/server";
import { getDeletedOpdrachten } from "@/lib/opdrachten";

/**
 * GET /api/opdrachten/deleted
 * Lists opdrachten with status "verwijderd" (soft-deleted), for the admin
 * cleanup view in Settings. Protected by the global JWT middleware.
 */
export async function GET() {
  try {
    const opdrachten = await getDeletedOpdrachten();
    return NextResponse.json({ opdrachten });
  } catch {
    return NextResponse.json({ error: "Kon verwijderde opdrachten niet ophalen" }, { status: 500 });
  }
}
