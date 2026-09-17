import assert from "node:assert/strict";
import { mergePdfs } from "../src/pdf/merge.js";
import { compressPdf } from "../src/pdf/compress.js";
import { compressImage } from "../src/image/compress.js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";

async function makePdf(lines) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const t of lines) {
    const p = doc.addPage([200, 200]);
    p.drawText(t, { x: 10, y: 100, font, size: 12 });
  }
  return Buffer.from(await doc.save());
}

// --- merge ---
{
  const a = await makePdf(["a1", "a2", "a3"]);
  const b = await makePdf(["b1"]);
  const r = await mergePdfs([a, b], [{ originalname: "a.pdf" }, { originalname: "b.pdf" }]);
  const merged = await PDFDocument.load(r.data);
  assert.equal(merged.getPageCount(), 4, "merge -> 4 pages (3+1)");
  assert.equal(r.headers["X-Original-Total-Size"], String(a.length + b.length));
  assert.equal(r.headers["X-Merged-Size"], String(r.data.length));
  console.log("merge: OK (", r.data.length, "bytes, 4 pages )");
}

// --- merge rejects single file ---
{
  const a = await makePdf(["solo"]);
  await assert.rejects(() => mergePdfs([a], []), (e) => e.code === 400, "single file -> 400");
  console.log("merge single-file reject: OK");
}

// --- image compress low ---
{
  const noise = Buffer.alloc(1000 * 1000 * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 7) & 255;
  const jpeg = await sharp(noise, { raw: { width: 1000, height: 1000, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
  const r = await compressImage(jpeg, "image/jpeg", "low", {});
  assert.ok(r.data.length < jpeg.length, "low is smaller");
  assert.ok(Number(r.headers["X-Reduction-Percent"]) > 0);
  console.log("image low: OK (", jpeg.length, "->", r.data.length, ")");
}

// --- image custom target size lands <= target ---
{
  const noise = Buffer.alloc(1000 * 1000 * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 13 + 5) & 255;
  const jpeg = await sharp(noise, { raw: { width: 1000, height: 1000, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
  const r = await compressImage(jpeg, "image/jpeg", "custom", { targetSizeKB: 80 });
  assert.ok(r.data.length <= 80 * 1024, `hits target (got ${r.data.length} bytes)`);
  console.log("image custom target: OK (", Math.round(r.data.length / 1024), "KB <= 80KB )");
}

// --- pdf compress: profiles get progressively smaller (low <= medium <= high) ---
{
  const noise = Buffer.alloc(800 * 800 * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 7) & 255;
  const jpeg = await sharp(noise, { raw: { width: 800, height: 800, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  page.drawImage(await doc.embedJpg(jpeg), { x: 0, y: 0, width: 612, height: 792 });
  const pdf = Buffer.from(await doc.save());

  const low = (await compressPdf(pdf, "low")).data;
  const medium = (await compressPdf(pdf, "medium")).data;
  const high = (await compressPdf(pdf, "high")).data;
  assert.ok(low.length <= medium.length, "low <= medium");
  assert.ok(medium.length < high.length, "medium < high");
  const custom = await compressPdf(pdf, "custom", 0.2);
  assert.ok(custom.data.length <= 0.2 * 1024 * 1024, "custom hits target MB");
  console.log(`pdf profiles: OK (low ${Math.round(low.length / 1024)}KB, med ${Math.round(medium.length / 1024)}KB, hi ${Math.round(high.length / 1024)}KB, custom ${Math.round(custom.data.length / 1024)}KB)`);
}

console.log("\nAll smoke tests passed.");