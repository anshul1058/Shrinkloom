import multer from "multer";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const MAX_FILE = 500 * 1024 * 1024; // 500MB per file
export const MAX_TOTAL = 500 * 1024 * 1024; // 500MB total across all files
export const MAX_FILES = 20;
// ponytail: in-memory pipeline (pdf-lib/sharp) — 500MB files spike RAM ~1-3GB;
// switch to streaming + temp-file processing if the host RAM becomes the ceiling.

const tempDir = await mkdtemp(join(tmpdir(), "shrinkloom-upload-"));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, _file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`),
});

// Files are unlinked once the response is sent; this sweeps anything leaked
// (timeouts, crashes) so temp storage never fills up.
setInterval(() => sweep(tempDir), 10 * 60 * 1000).unref();
async function sweep(dir) {
  const cutoff = Date.now() - 30 * 60 * 1000; // 30min TTL; requests finish in <1min
  for (const name of await readdir(dir).catch(() => [])) {
    const p = join(dir, name);
    const age = await stat(p).catch(() => null);
    if (age && age.mtimeMs < cutoff) await rm(p, { force: true });
  }
}

const upload = multer({ storage, limits: { fileSize: MAX_FILE, files: MAX_FILES } });

export const mergeUpload = upload.array("files", MAX_FILES);
export const singleUpload = upload.single("file");

export function uploadErrorHandler(err, _req, res, next) {
  if (err?.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ error: "File exceeds the 500MB limit.", code: "FILE_TOO_LARGE" });
  if (err?.code === "LIMIT_UNEXPECTED_FILE")
    return res.status(400).json({ error: "Unexpected upload field.", code: "UNEXPECTED_FIELD" });
  if (err?.code === "LIMIT_FILE_COUNT")
    return res.status(413).json({ error: "Too many files.", code: "TOO_MANY_FILES" });
  if (err) {
    return res.status(413).json({ error: "Total upload size exceeds limit.", code: "UPLOAD_TOO_LARGE" });
  }
  next();
}