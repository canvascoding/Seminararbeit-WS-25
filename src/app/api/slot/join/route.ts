import { NextResponse } from "next/server";
import { z } from "zod";
import { joinSlot } from "@/lib/repositories/loop-repository";

const bodySchema = z.object({
  slotId: z.string().min(2),
});

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userName = request.headers.get("x-user-name") ?? "Loop User";
  const userEmail = request.headers.get("x-user-email") ?? "";
  const university = request.headers.get("x-user-university") ?? "";

  if (!userId) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültige Daten" }, { status: 400 });
  }

  await joinSlot(parsed.data.slotId, {
    uid: userId,
    displayName: userName,
    email: userEmail,
    university,
  });

  return NextResponse.json({ status: "pending" });
}
