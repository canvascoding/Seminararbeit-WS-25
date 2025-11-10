import { NextResponse } from "next/server";
import { listPartnerSlots } from "@/lib/repositories/loop-repository";

export async function GET(request: Request) {
  const partnerId = request.headers.get("x-partner-id");
  if (!partnerId) {
    return NextResponse.json({ message: "Partnerrolle fehlt" }, { status: 401 });
  }
  const data = await listPartnerSlots(partnerId);
  return NextResponse.json(data);
}
