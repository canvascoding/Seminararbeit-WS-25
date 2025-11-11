import { NextResponse } from "next/server";
import QRCode from "qrcode";
import type { PDFFont } from "pdf-lib";
import { getVenueById } from "@/lib/repositories/loop-repository";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ venueId: string; meetPointId: string }>;
}

function slugify(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "loop";
}

export async function GET(request: Request, { params }: RouteContext) {
  const { venueId, meetPointId } = await params;
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const venue = await getVenueById(venueId);
  if (!venue) {
    return new NextResponse("Venue not found", { status: 404 });
  }
  const meetPoint = venue.meetPoints.find((point) => point.id === meetPointId);
  if (!meetPoint) {
    return new NextResponse("Meet point not found", { status: 404 });
  }

  const baseUrl =
    process.env.LOOP_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.headers.get("origin") ??
    new URL(request.url).origin ??
    "http://localhost:3000";
  const qrUrl = new URL("/checkin", baseUrl);
  qrUrl.searchParams.set("venue", venue.id);
  qrUrl.searchParams.set("meetPoint", meetPoint.id);

  const qrBuffer = await QRCode.toBuffer(qrUrl.toString(), {
    color: { dark: "#07131A", light: "#FFFFFF" },
    width: 600,
  });

  const pageWidth = 420; // A5 portrait in points
  const pageHeight = 595;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let cursorY = pageHeight - 60;
  page.drawText("Loop Check-in", {
    x: 36,
    y: cursorY,
    size: 24,
    font: fontBold,
    color: rgb(7 / 255, 19 / 255, 26 / 255),
  });

  cursorY -= 30;
  page.drawText(venue.name, {
    x: 36,
    y: cursorY,
    size: 16,
    font: fontBold,
    color: rgb(7 / 255, 19 / 255, 26 / 255),
  });

  cursorY -= 24;
  page.drawText(meetPoint.label, {
    x: 36,
    y: cursorY,
    size: 14,
    font: fontBold,
    color: rgb(120 / 255, 190 / 255, 32 / 255),
  });

  if (meetPoint.description) {
    cursorY -= 18;
    page.drawText(meetPoint.description, {
      x: 36,
      y: cursorY,
      size: 12,
      font: fontRegular,
      color: rgb(7 / 255, 19 / 255, 26 / 255),
    });
  }

  if (meetPoint.instructions) {
    cursorY -= 24;
    const textWidth = pageWidth - 72;
    const lines = splitText(meetPoint.instructions, fontRegular, 10, textWidth);
    lines.forEach((line) => {
      cursorY -= 14;
      page.drawText(line, {
        x: 36,
        y: cursorY,
        size: 10,
        font: fontRegular,
        color: rgb(65 / 255, 82 / 255, 86 / 255),
      });
    });
  }

  const qrImage = await pdfDoc.embedPng(qrBuffer);
  const qrSize = 260;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 140;
  const scale = qrSize / qrImage.width;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrImage.width * scale,
    height: qrImage.height * scale,
  });

  const normalizedBase = baseUrl.replace(/\/$/, "");
  const linkText = `${normalizedBase}/checkin`;
  page.drawText(`Scanne oder öffne ${linkText}`, {
    x: 36,
    y: 110,
    size: 10,
    font: fontRegular,
    color: rgb(7 / 255, 19 / 255, 26 / 255),
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);
  const fileName = `${slugify(venue.name)}-${slugify(meetPoint.label)}.pdf`;
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function splitText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}
