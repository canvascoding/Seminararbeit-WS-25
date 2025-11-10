import { NextResponse } from "next/server";
import { z } from "zod";
import { createPartnerSlot, type PartnerSlotPayload } from "@/lib/repositories/loop-repository";

const schema = z.object({
  venueId: z.string().min(2),
  intent: z.enum(["smalltalk", "coStudy", "walkTalk", "coffeeBreak"]),
  startAt: z.string().datetime(),
  durationMinutes: z.number().min(10).max(30),
  capacity: z.number().min(2).max(4),
  meetPointId: z.string().min(2),
});

export async function POST(request: Request) {
  const partnerId = request.headers.get("x-partner-id");
  if (!partnerId) {
    return NextResponse.json({ message: "Partnerrolle fehlt" }, { status: 401 });
  }
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validierung fehlgeschlagen" }, { status: 400 });
  }
  const result = await createPartnerSlot(parsed.data as PartnerSlotPayload, partnerId);
  return NextResponse.json(result);
}
