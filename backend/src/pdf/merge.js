import { PDFDocument } from "pdf-lib";

const MAX_PDF_BYTES = 500 * 1024 * 1024; // 500MB per file; total capped by MAX_TOTAL in server.js
const PDF_MAGIC = "%PDF-";

// Accepts pre-ordered Buffer[] compiled from the uploaded files.
export async function mergePdfs(bufs, fileNames) {
  if (!bufs.length || bufs.length < 2) {
    const e = new Error(`Fewer than 2 files: expected at least 2, got ${bufs.length}.`);
    e.code = 400;
    throw e;
  }

  const merged = await PDFDocument.create();
  for (let i = 0; i < bufs.length; i++) {
    const buf = bufs[i];
    const name = fileNames?.[i]?.originalname || `file ${i + 1}`;
    if (buf.length > MAX_PDF_BYTES) {
      const e = new Error(`File "${name}" exceeds the 500MB per-file limit.`);
      e.code = 413;
      throw e;
    }
    if (buf.subarray(0, 5).toString("latin1") !== PDF_MAGIC) {
      const e = new Error(`Non-PDF file detected: "${name}".`);
      e.code = 400;
      throw e;
    }
    try {
      const src = await PDFDocument.load(buf, { ignoreEncryption: false });
      if (src.getPageCount() === 0) throw new Error("no pages");
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } catch {
      const e = new Error(`Corrupt or password-protected PDF: "${name}".`);
      e.code = 422;
      throw e;
    }
  }

  const data = await merged.save();
  return {
    data: Buffer.from(data),
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="merged.pdf"',
      "X-Original-Total-Size": String(bufs.reduce((n, b) => n + b.length, 0)),
      "X-Merged-Size": String(data.length),
      "X-Merged-Pages": String(merged.getPageCount()),
    },
  };
}