# Shrinkloom Backend

Stateless Express API for the 3 PDF/image tools (see `api.md`). Files are
processed in temp dirs and deleted when the response is sent.

## Setup

```sh
cd backend
npm install
npm start            # -> http://localhost:3000
```

Ghostscript is required for `/api/compress/pdf`:

```sh
brew install ghostscript
```

The server checks for `gs` on PATH (override with `GS_BIN`).

## Endpoints

| Method | Path                | Purpose                          |
|--------|---------------------|----------------------------------|
| POST   | `/api/merge`        | Merge 2+ PDFs (field `files[]`)  |
| POST   | `/api/compress/pdf` | Compress a PDF via Ghostscript   |
| POST   | `/api/compress/image` | Compress jpg/png/webp via sharp |

Compress endpoints take `profile` = `low|medium|high|custom`. Custom modes:
`targetSizeMB` (PDF), `targetSizeKB` / `quality` / `maxWidth` (image). All
responses carry `X-Original-Size`, `X-Compressed-Size`, `X-Reduction-Percent`
(or `X-Original-Total-Size`/`X-Merged-Size` for merge).

## Test

```sh
node test/smoke.mjs
```

Limits: 50MB/file, 150MB total, 20 files (see `src/middleware/upload.js`).