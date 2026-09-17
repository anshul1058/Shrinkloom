import sharp from "sharp";

const PROFILES = {
  low: { quality: 35, maxWidth: 1280 },
  medium: { quality: 65 },
  high: { quality: 88 },
  custom: {},
};

export async function compressImage(buffer, mimetype, profile, { targetSizeKB, quality, maxWidth } = {}) {
  if (!(profile in PROFILES)) {
    return { error: { status: 400, message: `Invalid profile: "${profile}".` } };
  }
  const fmt = mimetype.includes("png") ? "png" : mimetype.includes("webp") ? "webp" : mimetype.includes("jpeg") || mimetype.includes("jpg") ? "jpeg" : null;
  if (!fmt) return { error: { status: 400, message: `Unsupported image format: "${mimetype}". Use jpg, png, or webp.` } };

  // Validate the file is actually decodable before committing to a profile.
  try {
    await sharp(buffer, { failOn: "error" }); // sharp is lazy; force a decode
  } catch {
    return { error: { status: 422, message: "Compression failed: unrecognized image file." } };
  }

  let opts;
  if (profile === "custom") {
    const mode = targetSizeKB !== undefined ? "size" : quality !== undefined ? "quality" : maxWidth !== undefined ? "resize" : null;
    if (!mode) return { error: { status: 400, message: "custom requires targetSizeKB, quality, or maxWidth." } };
    opts = { quality: quality ?? 65, maxWidth: maxWidth ?? null, targetSizeKB: targetSizeKB ?? null };
  } else {
    opts = PROFILES[profile];
  }

  let img = sharp(buffer, { failOn: "error" });
  if (opts.maxWidth) img = img.resize({ width: opts.maxWidth });

  const compress = () =>
    fmt === "png" ? img.png({ quality: opts.quality ?? 65 }).toBuffer()
      : fmt === "webp" ? img.webp({ quality: opts.quality ?? 65 }).toBuffer()
      : img.jpeg({ quality: opts.quality ?? 65, mozjpeg: true }).toBuffer();

  let data;
  if (opts.targetSizeKB) {
    data = await binarySearch(buffer, opts, fmt, opts.targetSizeKB);
  } else {
    data = await compress();
  }

  if (data.length >= buffer.length) {
    return { error: { status: 422, message: "Compression failed: output is not smaller than the original." } };
  }
  const pct = Math.round(((buffer.length - data.length) / buffer.length) * 1000) / 10;
  return {
    data,
    headers: {
      "Content-Type": mimetype,
      "X-Original-Size": String(buffer.length),
      "X-Compressed-Size": String(data.length),
      "X-Reduction-Percent": String(pct),
    },
  };
}

// Binary-search JPEG quality to land near the target KB, never over.
async function binarySearch(buffer, opts, fmt, targetKB) {
  let lo = 10, hi = 95, best = null;
  while (lo <= hi) {
    const q = Math.floor((lo + hi) / 2);
    let pipe = sharp(buffer, { failOn: "error" });
    if (opts.maxWidth) pipe = pipe.resize({ width: opts.maxWidth });
    const b = fmt === "png" ? await pipe.png({ quality: q }).toBuffer()
      : fmt === "webp" ? await pipe.webp({ quality: q }).toBuffer()
      : await pipe.jpeg({ quality: q, mozjpeg: true }).toBuffer();
    if (!best || b.length < best.length) best = b;
    if (b.length <= targetKB * 1024) lo = q + 1;
    else hi = q - 1;
  }
  return best;
}