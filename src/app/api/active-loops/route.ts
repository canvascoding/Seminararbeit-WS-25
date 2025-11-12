import { NextResponse } from "next/server";
import { listActiveLoops } from "@/lib/repositories/loop-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ message: "venueId erforderlich" }, { status: 400 });
  }
  const loops = await listActiveLoops(venueId);
  return NextResponse.json({ loops });
}
