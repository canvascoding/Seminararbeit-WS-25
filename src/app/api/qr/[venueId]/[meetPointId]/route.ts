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

  const margin = 36;
  const headerHeight = 150;
  const brandPrimary = rgb(7 / 255, 19 / 255, 26 / 255);
  const accentColor = rgb(120 / 255, 190 / 255, 32 / 255);
  const textColor = rgb(15 / 255, 31 / 255, 38 / 255);
  const mutedColor = rgb(97 / 255, 115 / 255, 122 / 255);
  const softGray = rgb(233 / 255, 238 / 255, 240 / 255);

  // Header block with hero text about Loop
  page.drawRectangle({
    x: 0,
    y: pageHeight - headerHeight,
    width: pageWidth,
    height: headerHeight,
    color: brandPrimary,
  });

  const contentWidth = pageWidth - margin * 2;
  let headerCursorY = pageHeight - 40;
  page.drawText("Loop Check-in", {
    x: margin,
    y: headerCursorY,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  headerCursorY -= 28;
  page.drawText("Digitale Anmeldung", {
    x: margin,
    y: headerCursorY,
    size: 14,
    font: fontRegular,
    color: rgb(210 / 255, 225 / 255, 232 / 255),
  });

  headerCursorY -= 24;
  page.drawText("Was ist Loop?", {
    x: margin,
    y: headerCursorY,
    size: 12,
    font: fontBold,
    color: accentColor,
  });

  headerCursorY -= 18;
  const loopIntro =
    "Loop ist die soziale Check-in-App für spontane Meet-Up's und Bekanntschaften an der BUW!";
  const loopIntroLines = splitText(loopIntro, fontRegular, 11, contentWidth);
  loopIntroLines.forEach((line) => {
    headerCursorY -= 14;
    page.drawText(line, {
      x: margin,
      y: headerCursorY,
      size: 11,
      font: fontRegular,
      color: rgb(220 / 255, 235 / 255, 239 / 255),
    });
  });

  // Location block
  let cursorY = pageHeight - headerHeight - 34;
  page.drawText("Standort", {
    x: margin,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: mutedColor,
  });

  cursorY -= 18;
  const venueLines = splitText(venue.name, fontBold, 18, contentWidth);
  venueLines.forEach((line, index) => {
    page.drawText(line, {
      x: margin,
      y: cursorY,
      size: 18,
      font: fontBold,
      color: textColor,
    });
    cursorY -= index === venueLines.length - 1 ? 26 : 22;
  });

  const meetPointLines = splitText(meetPoint.label, fontBold, 15, contentWidth);
  meetPointLines.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y: cursorY,
      size: 15,
      font: fontBold,
      color: accentColor,
    });
    cursorY -= 20;
  });

  if (meetPoint.description) {
    const descriptionLines = splitText(meetPoint.description, fontRegular, 12, contentWidth);
    descriptionLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: cursorY,
        size: 12,
        font: fontRegular,
        color: textColor,
      });
      cursorY -= 16;
    });
  }

  cursorY -= 2;
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: pageWidth - margin, y: cursorY },
    thickness: 1,
    color: softGray,
  });

  const qrImage = await pdfDoc.embedPng(qrBuffer);
  const qrSize = 190;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = cursorY - qrSize - 12;
  const scale = qrSize / qrImage.width;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrImage.width * scale,
    height: qrImage.height * scale,
  });
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const linkText = `Scanne oder öffne ${normalizedBase}/checkin`;
  const linkWidth = fontRegular.widthOfTextAtSize(linkText, 10);
  const linkX = (pageWidth - linkWidth) / 2;
  const linkY = qrY - 12;
  page.drawText(linkText, {
    x: linkX,
    y: linkY,
    size: 10,
    font: fontRegular,
    color: textColor,
  });

  let footerCursorY = linkY - 22;
  if (meetPoint.instructions) {
    footerCursorY -= 14;
    page.drawText("Hinweise für diesen Treffpunkt", {
      x: margin,
      y: footerCursorY,
      size: 10,
      font: fontBold,
      color: accentColor,
    });

    footerCursorY -= 12;
    const instructionLines = splitText(meetPoint.instructions, fontRegular, 9, contentWidth);
    for (const line of instructionLines) {
      if (footerCursorY <= 36) break;
      page.drawText(line, {
        x: margin,
        y: footerCursorY,
        size: 9,
        font: fontRegular,
        color: textColor,
      });
      footerCursorY -= 11;
    }
  }

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
