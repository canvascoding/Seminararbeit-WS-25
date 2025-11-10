import { NextResponse } from "next/server";
import { getLoopStatus } from "@/lib/repositories/loop-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loopId = searchParams.get("loopId");
  if (!loopId) {
    return NextResponse.json({ message: "loopId fehlt" }, { status: 400 });
  }
  const loop = await getLoopStatus(loopId);
  if (!loop) {
    return NextResponse.json({ message: "Loop unbekannt" }, { status: 404 });
  }
  return NextResponse.json(loop);
}
