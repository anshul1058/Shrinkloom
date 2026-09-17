import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileP = promisify(execFile);
const GS = process.env.GS_BIN || "gs";

// QFactor ~ 1/quality: 0.9 heavy, 0.4 light (matches gs distiller presets).
const PROFILES = {
  low:    { preset: "/screen",  qfactor: "0.9" },
  medium: { preset: "/ebook",   qfactor: "0.6" },
  high:   { preset: "/printer", qfactor: "0.4" },
  custom: { preset: "/ebook",   qfactor: null },
};

export async function compressPdf(buffer, profile, targetSizeMB, quality) {
  if (!(profile in PROFILES)) return { error: { status: 400, message: `Invalid profile: "${profile}".` } };
  if (profile === "custom") {
    if (!Number.isFinite(targetSizeMB) || targetSizeMB <= 0) {
      if (!Number.isFinite(quality) || quality < 0 || quality > 100) {
        return { error: { status: 400, message: "custom requires targetSizeMB (positive number) or quality (0-100)." } };
      }
    }
  }

  const dir = await mkdtemp(join(tmpdir(), "shrinkloom-"));
  const input = join(dir, "in.pdf");
  await writeFile(input, buffer);

  try {
    let preset = PROFILES[profile].preset;
    let qfactor = PROFILES[profile].qfactor || null;

    if (profile === "custom") {
      if (Number.isFinite(quality) && quality >= 0 && quality <= 100) {
        qfactor = String((100 - quality) / 100);
        preset = quality <= 33 ? "/screen" : quality <= 66 ? "/ebook" : "/printer";
      }
    }

    const first = await runGs(input, dir, "out.pdf", [], preset, qfactor);
    let bytes = await readFile(first);

    if (profile === "custom" && targetSizeMB && bytes.length > targetSizeMB * 1024 * 1024) {
      const target = targetSizeMB * 1024 * 1024;
      let lo = 20, hi = 300, best = bytes;
      while (lo <= hi) {
        const dpi = Math.floor((lo + hi) / 2);
        const candidate = await runGs(
          input, dir, `out${dpi}.pdf`,
          ["-dColorImageResolution=" + dpi],
          preset, qfactor,
        );
        const candBytes = await readFile(candidate);
        if (candBytes.length < best.length) best = candBytes;
        // DPI up = size up, so undersize raises DPI (better quality), oversize lowers it
        if (candBytes.length <= target) lo = dpi + 1;
        else hi = dpi - 1;
      }
      bytes = best;
    }

    if (bytes.length >= buffer.length) {
      return { error: { status: 422, message: "Compression failed: output is not smaller than the original." } };
    }
    const pct = Math.round(((buffer.length - bytes.length) / buffer.length) * 1000) / 10;
    return {
      data: bytes,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="compressed.pdf"',
        "X-Original-Size": String(buffer.length),
        "X-Compressed-Size": String(bytes.length),
        "X-Reduction-Percent": String(pct),
      },
    };
  } finally {
    rm(dir, { recursive: true, force: true });
  }
}

function gsArgs(input, output, extra, preset, qfactor) {
  const flags = [
    "-sDEVICE=pdfwrite",
    "-dNOPAUSE", "-dBATCH", "-dQUIET",
    "-dPDFSETTINGS=" + preset,
    // pdfwrite must decode+re-encode embedded JPEGs or image-heavy PDFs
    // never shrink. -dJPEGQ only affects the jpeg output device, not pdfwrite.
    "-dPassThroughJPEGImages=false",
    "-dAutoFilterColorImages=false",
    "-dColorImageFilter=/DCTEncode",
    ...extra,
    `-sOutputFile=${output}`,
  ];
  if (qfactor) {
    // QFactor lives in the ColorImageDict distiller dict; CLI has no direct flag.
    flags.push("-c", `<< /ColorImageDict << /QFactor ${qfactor} /Blend 1 >> >> setdistillerparams`);
  }
  flags.push("-f", input);
  return flags;
}

async function runGs(input, dir, outFile, extra, preset, qfactor) {
  const output = join(dir, outFile);
  try {
    await execFileP(GS, gsArgs(input, output, extra, preset, qfactor), { timeout: 120000 });
  } catch (e) {
    const err = new Error(
      e.code === "ENOENT" ? "Ghostscript (gs) is not installed on this server." : `Ghostscript failed: ${e.message}`,
    );
    err.code = e.code === "ENOENT" ? 503 : 422;
    throw err;
  }
  return output;
}