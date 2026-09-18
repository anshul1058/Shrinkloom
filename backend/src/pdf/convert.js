import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, readFile, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PY_VENV = join(__dirname, "../../.venv/bin/python3");
const PY_SCRIPT = join(__dirname, "../../scripts/pdf2docx_convert.py");

async function findLibre() {
  const env = process.env.LIBRE_BIN;
  if (env) {
    try { await access(env); return env; } catch {}
  }
  const candidates = [
    "libreoffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/usr/bin/libreoffice",
    "/usr/local/bin/libreoffice",
  ];
  for (const p of candidates) {
    try { await execFileP(p, ["--version"], { timeout: 5000 }); return p; } catch {}
  }
  return null;
}

let librePath = null;

async function getLibre() {
  if (librePath) return librePath;
  librePath = await findLibre();
  return librePath;
}

export async function pdfToWord(buffer, originalName) {
  const dir = await mkdtemp(join(tmpdir(), "shrinkloom-"));
  const input = join(dir, originalName || "input.pdf");
  const outName = (originalName || "input.pdf").replace(/\.pdf$/i, "") + ".docx";
  const output = join(dir, outName);

  await writeFile(input, buffer);

  try {
    await execFileP(PY_VENV, [PY_SCRIPT, input, output], { timeout: 120000 });
    const data = await readFile(output);

    return {
      data,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${outName}"`,
        "X-Original-Size": String(buffer.length),
        "X-Converted-Size": String(data.length),
      },
    };
  } catch (e) {
    throw new Error(`PDF to Word conversion failed: ${e.message}`);
  } finally {
    rm(dir, { recursive: true, force: true });
  }
}

export async function wordToPdf(buffer, originalName) {
  const dir = await mkdtemp(join(tmpdir(), "shrinkloom-"));
  const input = join(dir, originalName || "input.docx");

  await writeFile(input, buffer);

  try {
    const libre = await getLibre();
    if (!libre) {
      throw new Error("LibreOffice is not installed on this server.");
    }

    await execFileP(libre, [
      "--headless",
      "--convert-to", "pdf",
      "--outdir", dir,
      input,
    ], { timeout: 120000 });

    const outName = (originalName || "input.docx").replace(/\.(docx|doc)$/i, "") + ".pdf";
    const outPath = join(dir, outName);
    const data = await readFile(outPath);

    return {
      data,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outName}"`,
        "X-Original-Size": String(buffer.length),
        "X-Converted-Size": String(data.length),
      },
    };
  } catch (e) {
    const err = new Error(
      e.code === "ENOENT"
        ? "LibreOffice is not installed on this server."
        : `Word to PDF conversion failed: ${e.message}`,
    );
    err.code = e.code === "ENOENT" ? 503 : 422;
    throw err;
  } finally {
    rm(dir, { recursive: true, force: true });
  }
}
