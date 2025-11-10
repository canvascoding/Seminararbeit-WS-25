import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelSlot } from "@/lib/repositories/loop-repository";

const bodySchema = z.object({
  slotId: z.string().min(2),
});

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültige Daten" }, { status: 400 });
  }
  await cancelSlot(parsed.data.slotId, userId);
  return NextResponse.json({ status: "canceled" });
}
