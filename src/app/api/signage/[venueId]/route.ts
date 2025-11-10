import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type RouteParams = Promise<{ venueId: string }>;

export async function GET(request: NextRequest, context: { params: RouteParams }) {
  const { venueId } = await context.params;
  const format = new URL(request.url).searchParams.get("format") ?? "png";
  const ext = format === "pdf" ? "pdf" : "png";
  const filePath = path.join(process.cwd(), "public", "signage", `${venueId}.${ext}`);

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": ext === "pdf" ? "application/pdf" : "image/png",
        "Content-Disposition": `attachment; filename="${venueId}.${ext}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ message: "Signage nicht gefunden" }, { status: 404 });
  }
}
