# Security.md — Hardening Against Crashes & Attacks

This covers the realistic ways a "vibe coded" file-processing site gets crashed or abused, and the concrete fix for each.

## 1. The #1 risk: resource exhaustion (this is what actually "crashes" sites like yours)

Your app runs Ghostscript/Sharp as subprocesses — these are CPU/RAM hungry. A malicious (or just heavy) user can take your server down without any "hacking" at all, just by overwhelming it.

| Attack | What happens | Fix |
|---|---|---|
| **Giant file upload** | User uploads a 2GB "PDF" → server RAM/disk fills up, process crashes | Hard file size limit at the upload layer (before processing starts), e.g. `multer({ limits: { fileSize: 25 * 1024 * 1024 } })` (25MB) |
| **Zip bomb / PDF bomb** | A tiny file that decompresses into a massive one (e.g. a PDF with a billion-page object stream) | Set Ghostscript timeouts + max output size checks; reject if processing exceeds a time/size threshold |
| **Concurrent flood** | 100 people hit `/compress` at once → 100 Ghostscript processes spawn → RAM maxed → crash | Queue processing (max N concurrent jobs), reject/queue extras with `429 Too Many Requests` |
| **Slowloris-style requests** | Many slow/incomplete requests held open to exhaust connections | Set request timeouts at the reverse proxy (Nginx) level |
| **No rate limiting** | Script hits your API thousands of times/minute | `express-rate-limit` per-IP |

### Fix: rate limiting (Express)
```js
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,                  // 30 requests per IP per window
  message: { error: "Too many requests, slow down." }
});

app.use("/api/", limiter);
```

### Fix: concurrency cap for heavy jobs
```js
import pLimit from "p-limit";
const limit = pLimit(3); // only 3 Ghostscript/sharp jobs run at once

app.post("/api/compress/pdf", async (req, res) => {
  await limit(() => runGhostscript(req.file));
});
```

### Fix: process timeout (kill runaway Ghostscript)
```js
import { execFile } from "child_process";

const child = execFile("gs", args, { timeout: 30000 }); // kill after 30s
child.on("error", (err) => {
  // handle timeout/crash gracefully, don't let it take the server down
});
```

## 2. File upload validation (don't trust the extension)

| Check | Why |
|---|---|
| **MIME type + magic bytes**, not just `.pdf`/`.jpg` extension | A renamed `.exe` can pass an extension check |
| **File size limit before reading into memory** | Prevents RAM exhaustion from a single huge file |
| **Reject files with 0 bytes / corrupt headers early** | Fail fast instead of letting Ghostscript choke on garbage |
| **Never pass user filenames directly into shell commands** | Prevents command injection (see §3) |

```js
import fileType from "file-type";

const buffer = await fs.readFile(uploadedPath);
const type = await fileType.fromBuffer(buffer);
if (!type || !["application/pdf"].includes(type.mime)) {
  return res.status(400).json({ error: "Invalid file type" });
}
```

## 3. Command injection (critical for your Ghostscript calls)

Never build shell commands with string concatenation — this is the single most dangerous mistake in a project like yours.

```js
// ❌ NEVER DO THIS — user-controlled filename goes straight into a shell string
exec(`gs -sOutputFile=${outputPath} ${inputPath}`);

// ✅ DO THIS — args passed as an array, no shell interpretation
execFile("gs", ["-sOutputFile=" + outputPath, inputPath]);
```
`execFile` (not `exec`) with an argument array never invokes a shell, so even a filename like `; rm -rf /` is treated as a literal string, not a command.

## 4. Path traversal

If filenames are ever used to build file paths, sanitize them:
```js
import path from "path";

const safeName = path.basename(userProvidedName); // strips ../ tricks
const fullPath = path.join(UPLOAD_DIR, safeName);
if (!fullPath.startsWith(UPLOAD_DIR)) {
  throw new Error("Invalid path");
}
```
Better yet: **always generate your own filenames** (UUID) server-side and never trust the client's filename for anything beyond display.

## 5. Temp file cleanup (disk exhaustion)

Leftover temp files from crashed/interrupted jobs will slowly fill your disk and crash the server days later.

```js
try {
  await processFile(tempPath);
} finally {
  await fs.unlink(tempPath).catch(() => {}); // always cleanup, even on error
}
```
Add a scheduled cleanup job too (cron or `setInterval`) that deletes any temp file older than ~1 hour, as a safety net for anything that slips through.

## 6. CORS — don't leave it wide open
```js
import cors from "cors";

app.use(cors({
  origin: ["https://yourdomain.com"], // not "*"
  methods: ["GET", "POST"]
}));
```

## 7. HTTPS only
- Enforce HTTPS at the reverse proxy (Nginx/Certbot or your host's managed TLS).
- Redirect all HTTP → HTTPS.

## 8. Dependency security
```bash
npm audit
npm audit fix
```
Run this regularly — a vulnerable `pdf-lib`/`sharp`/`multer` version is a real attack surface, not a theoretical one.

## 9. Error handling — don't leak internals
```js
// ❌ Leaks stack traces / server paths to attackers
app.use((err, req, res, next) => res.status(500).send(err.stack));

// ✅ Generic message to client, full detail only in server logs
app.use((err, req, res, next) => {
  console.error(err); // server-side log
  res.status(500).json({ error: "Something went wrong" });
});
```

## 10. Basic security headers
```js
import helmet from "helmet";
app.use(helmet());
```
`helmet` sets sane defaults (no `X-Powered-By`, clickjacking protection, etc.) with one line.

## 11. Monitoring (so you know before it crashes, not after)
- Log every job: file size, processing time, success/failure.
- Set up a simple uptime check (e.g. UptimeRobot free tier) that pings your `/health` endpoint and alerts you if it goes down.
```js
app.get("/health", (req, res) => res.json({ status: "ok" }));
```

## 12. Quick checklist before going live
- [ ] File size limit set (multer)
- [ ] Rate limiting on all `/api/*` routes
- [ ] Concurrency cap on Ghostscript/sharp jobs
- [ ] Process timeout on subprocess calls
- [ ] `execFile` (array args) used everywhere — no `exec()` with string concat
- [ ] MIME/magic-byte validation on uploads
- [ ] Temp files always cleaned up (try/finally + cron sweep)
- [ ] CORS restricted to your domain
- [ ] HTTPS enforced
- [ ] `helmet` added
- [ ] Generic error responses (no stack traces to client)
- [ ] `/health` endpoint + uptime monitoring
- [ ] `npm audit` run and clean
