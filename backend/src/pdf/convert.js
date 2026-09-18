import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileP = promisify(execFile);
const LIBRE = process.env.LIBRE_BIN || "libreoffice";

export async function pdfToWord(buffer, originalName) {
  const dir = await mkdtemp(join(tmpdir(), "shrinkloom-"));
  const input = join(dir, originalName || "input.pdf");

  await writeFile(input, buffer);

  try {
    await execFileP(LIBRE, [
      "--headless",
      "--convert-to", "docx",
      "--outdir", dir,
      input,
    ], { timeout: 120000 });

    const outName = (originalName || "input.pdf").replace(/\.pdf$/i, "") + ".docx";
    const outPath = join(dir, outName);
    const data = await readFile(outPath);

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
    const err = new Error(
      e.code === "ENOENT"
        ? "LibreOffice is not installed on this server."
        : `Conversion failed: ${e.message}`,
    );
    err.code = e.code === "ENOENT" ? 503 : 422;
    throw err;
  } finally {
    rm(dir, { recursive: true, force: true });
  }
}

export async function wordToPdf(buffer, originalName) {
  const dir = await mkdtemp(join(tmpdir(), "shrinkloom-"));
  const input = join(dir, originalName || "input.docx");

  await writeFile(input, buffer);

  try {
    await execFileP(LIBRE, [
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
        : `Conversion failed: ${e.message}`,
    );
    err.code = e.code === "ENOENT" ? 503 : 422;
    throw err;
  } finally {
    rm(dir, { recursive: true, force: true });
  }
}
