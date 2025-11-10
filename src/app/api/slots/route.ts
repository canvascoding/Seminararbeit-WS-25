import { NextResponse } from "next/server";
import { listSlots } from "@/lib/repositories/loop-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId") ?? undefined;
  const from = searchParams.get("from");
  const slots = await listSlots(venueId, from ? new Date(from) : undefined);
  return NextResponse.json({ slots });
}
