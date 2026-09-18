import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pLimit from "p-limit";
import { readFile, rm } from "node:fs/promises";
import { mergePdfs } from "./pdf/merge.js";
import { compressPdf } from "./pdf/compress.js";
import { compressImage } from "./image/compress.js";
import { pdfToWord, wordToPdf } from "./pdf/convert.js";
import { mergeUpload, singleUpload, uploadErrorHandler, MAX_TOTAL } from "./middleware/upload.js";

const app = express();
const PORT = process.env.PORT || 3000;

const jobLimit = pLimit(3);

/* ── security headers ───────────────────────────────────────── */
app.use(helmet({ contentSecurityPolicy: false }));

/* ── rate limiting ───────────────────────────────────────────── */
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, slow down.", code: "RATE_LIMITED" },
}));

/* ── CORS (tight) ───────────────────────────────────────────── */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.ALLOWED_ORIGIN,        // set in prod
].filter(Boolean);

app.use(cors({
  origin: ALLOWED_ORIGINS.length <= 1 ? ALLOWED_ORIGINS[0] || true : ALLOWED_ORIGINS,
  methods: ["GET", "POST"],
}));

app.use(express.json({ limit: "1mb" }));

/* ── health check ────────────────────────────────────────────── */
app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

/* ── helpers ─────────────────────────────────────────────────── */
const ok = (res, { data, headers }) => {
  res.set(headers);
  res.send(data);
};

const CODES = { 400: "INVALID_REQUEST", 413: "UPLOAD_TOO_LARGE", 422: "PROCESSING_FAILED", 503: "SERVICE_UNAVAILABLE" };

const err = (res, { error }) => {
  const status = Number(error?.status) || 400;
  res.status(status).json({
    error: error?.message || "Something went wrong.",
    code: CODES[status] || error?.code || "SERVER_ERROR",
  });
};

async function readBuffers(files) {
  const bufs = [];
  for (const f of files) bufs.push(Buffer.from(await readFile(f.path)));
  return bufs;
}

async function cleanup(files) {
  if (!files) return;
  await Promise.allSettled(files.map((f) => rm(f.path, { force: true })));
}

/* ── routes ──────────────────────────────────────────────────── */
app.post("/api/merge", mergeUpload, async (req, res) => {
  try {
    const files = req.files || [];
    const total = files.reduce((n, f) => n + f.size, 0);
    if (total > MAX_TOTAL) {
      return res.status(413).json({ error: "Total upload size exceeds limit.", code: "UPLOAD_TOO_LARGE" });
    }

    let orderedFiles = [...files];
    const orderStr = req.body.order;
    if (orderStr) {
      let order;
      try { order = JSON.parse(orderStr); }
      catch { return res.status(400).json({ error: "order must be a JSON array, e.g. [2,0,1]", code: "INVALID_REQUEST" }); }
      if (!Array.isArray(order) || order.length !== files.length ||
          order.some((v) => !Number.isInteger(v) || v < 0 || v >= files.length)) {
        return res.status(400).json({
          error: `order must be a permutation of 0..${files.length - 1}`,
          code: "INVALID_REQUEST",
        });
      }
      orderedFiles = order.map((i) => files[i]);
    }

    const out = await jobLimit(async () => mergePdfs(await readBuffers(orderedFiles), orderedFiles));
    ok(res, out);
  } catch (e) {
    err(res, { error: { message: e.message, status: e.code || 500, code: e.code || "SERVER_ERROR" } });
  } finally {
    await cleanup(req.files);
  }
});

app.post("/api/compress/pdf", singleUpload, async (req, res) => {
  try {
    const f = req.file;
    if (!f) return res.status(400).json({ error: "No file uploaded.", code: "INVALID_REQUEST" });
    const out = await jobLimit(async () => compressPdf(await readFile(f.path), req.body.profile, Number(req.body.targetSizeMB), Number(req.body.quality)));
    if (out.error) return err(res, out);
    ok(res, out);
  } catch (e) {
    err(res, { error: { message: e.message, status: e.code || 500 } });
  } finally {
    await cleanup(req.files);
  }
});

app.post("/api/compress/image", singleUpload, async (req, res) => {
  try {
    const f = req.file;
    if (!f) return res.status(400).json({ error: "No file uploaded.", code: "INVALID_REQUEST" });
    const out = await jobLimit(async () => compressImage(await readFile(f.path), f.mimetype, req.body.profile, {
      targetSizeKB: Number(req.body.targetSizeKB),
      quality: Number(req.body.quality),
      maxWidth: Number(req.body.maxWidth),
    }));
    if (out.error) return err(res, out);
    ok(res, out);
  } catch (e) {
    err(res, { error: { message: "Compression failed: " + e.message, status: 500 } });
  } finally {
    await cleanup(req.files);
  }
});

/* ── convert: PDF ↔ Word ────────────────────────────────────── */
app.post("/api/convert/pdf-to-word", singleUpload, async (req, res) => {
  try {
    const f = req.file;
    if (!f) return res.status(400).json({ error: "No file uploaded.", code: "INVALID_REQUEST" });
    const out = await jobLimit(async () => pdfToWord(await readFile(f.path), f.originalname));
    ok(res, out);
  } catch (e) {
    err(res, { error: { message: e.message, status: e.code || 500 } });
  } finally {
    await cleanup(req.files);
  }
});

app.post("/api/convert/word-to-pdf", singleUpload, async (req, res) => {
  try {
    const f = req.file;
    if (!f) return res.status(400).json({ error: "No file uploaded.", code: "INVALID_REQUEST" });
    const out = await jobLimit(async () => wordToPdf(await readFile(f.path), f.originalname));
    ok(res, out);
  } catch (e) {
    err(res, { error: { message: e.message, status: e.code || 500 } });
  } finally {
    await cleanup(req.files);
  }
});

/* ── upload error handler ────────────────────────────────────── */
app.use(uploadErrorHandler);

/* ── start ───────────────────────────────────────────────────── */
app.listen(PORT, () => console.log(`Shrinkloom API on http://localhost:${PORT}`));
