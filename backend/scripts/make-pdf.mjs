import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFile } from "node:fs/promises";

export async function makePdf(file, lines) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const t of lines) {
    const page = doc.addPage([612, 792]);
    page.drawText(t, { x: 72, y: 720, font, size: 24, color: rgb(0, 0, 0) });
  }
  await writeFile(file, await doc.save());
}

if (new URL(import.meta.url).pathname.endsWith("/scripts/make-pdf.mjs")) {
  const out = process.argv[2] || "/tmp/sltest/out.pdf";
  const lines = process.argv.slice(3).length ? process.argv.slice(3) : ["page one", "page two"];
  await makePdf(out, lines);
}