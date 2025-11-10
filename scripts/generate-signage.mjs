import fs from "fs-extra";
import path from "path";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";

async function generateForVenue(venue) {
  const signageDir = path.join(process.cwd(), "public", "signage");
  await fs.ensureDir(signageDir);

  const pngPath = path.join(signageDir, `${venue.venueId}.png`);
  const pdfPath = path.join(signageDir, `${venue.venueId}.pdf`);

  const qrBuffer = await QRCode.toBuffer(venue.url, {
    color: { dark: "#07131A", light: "#FFFFFF" },
    width: 600,
  });

  await fs.writeFile(pngPath, qrBuffer);

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);
  doc
    .fontSize(26)
    .fillColor("#07131A")
    .text("Loop Check-in", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(18).text(venue.name, { align: "left" });
  doc.moveDown(1);
  doc.image(qrBuffer, { fit: [320, 320], align: "center" });
  doc.moveDown(1);
  doc
    .fontSize(12)
    .fillColor("#78BE20")
    .text("Loop starten · QR scannen", { align: "center" });
  doc.end();

  await new Promise((resolve) => writeStream.on("finish", resolve));
}

async function main() {
  const venuesPath = path.join(process.cwd(), "data", "venues.json");
  const entries = await fs.readJson(venuesPath);
  await Promise.all(entries.map(generateForVenue));
  console.log(`QR-Signage für ${entries.length} Orte aktualisiert.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
