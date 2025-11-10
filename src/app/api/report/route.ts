import { NextResponse } from "next/server";
import { z } from "zod";
import { submitIncident } from "@/lib/repositories/loop-repository";

const schema = z.object({
  loopId: z.string().min(2),
  type: z.enum(["safety", "noShow", "other"]),
  description: z.string().min(10).max(500),
});

export async function POST(request: Request) {
  const reporterId = request.headers.get("x-user-id");
  if (!reporterId) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validierung fehlgeschlagen" }, { status: 422 });
  }
  const result = await submitIncident({ ...parsed.data, reporterId });
  return NextResponse.json(result);
}
