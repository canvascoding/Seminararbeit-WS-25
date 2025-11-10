import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: { venueId: string } },
) {
  const format = new URL(_request.url).searchParams.get("format") ?? "png";
  const ext = format === "pdf" ? "pdf" : "png";
  const filePath = path.join(process.cwd(), "public", "signage", `${params.venueId}.${ext}`);

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": ext === "pdf" ? "application/pdf" : "image/png",
        "Content-Disposition": `attachment; filename="${params.venueId}.${ext}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ message: "Signage nicht gefunden" }, { status: 404 });
  }
}
