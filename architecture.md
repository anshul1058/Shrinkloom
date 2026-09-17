# Architecture.md — PDF & Image Toolkit

## 1. High-Level Architecture

```
┌─────────────────────┐        ┌──────────────────────┐
│   Frontend (SPA)     │  HTTP  │   Backend (API)       │
│  React + Vite         │◄──────►│  Node.js + Express     │
│  - Upload UI          │        │  - /merge              │
│  - Reorder UI         │        │  - /compress/pdf       │
│  - Profile selector    │        │  - /compress/image     │
└─────────────────────┘        └──────────┬───────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │      Processing Layer       │
                              │  pdf-lib / Ghostscript /qpdf │
                              │  sharp (images)              │
                              └─────────────┬─────────────┘
                                            │
                                   ┌────────┴────────┐
                                   │  Temp Storage     │
                                   │  (in-memory / tmp)│
                                   │  auto-cleanup      │
                                   └────────────────┘
```

## 2. Component Breakdown

### 2.1 Frontend
- **Upload component**: drag-drop zone, accepts multiple files per tool.
- **Reorder component** (Merge only): sortable list (drag handles), shows filename + page count + position number.
- **Profile selector** (Compress only): 4 radio/cards — Low / Medium / High / Custom. Custom reveals a slider or numeric input (target size or quality %).
- **Progress + result**: upload progress bar → processing spinner → download link.
- **State management**: local component state (React `useState`) is enough for MVP; no global store needed.

### 2.2 Backend
| Endpoint | Responsibility |
|---|---|
| `POST /api/merge` | Accepts ordered array of PDFs, returns merged PDF |
| `POST /api/compress/pdf` | Accepts PDF + profile, returns compressed PDF |
| `POST /api/compress/image` | Accepts image + profile, returns compressed image |

Backend is stateless — each request is processed and the result streamed back; no persistence layer required for MVP.

### 2.3 Processing Layer
- **Merge**: done via `pdf-lib` (can run client-side or server-side — see tech.md for trade-off).
- **PDF compression**: Ghostscript (`gs`) invoked as a subprocess with DPI/quality flags mapped from the profile — this is the main reason a backend is needed (browsers can't run Ghostscript).
- **Image compression**: `sharp` (Node) server-side, or `browser-image-compression` client-side for a lighter MVP.

### 2.4 Temp Storage
- Files are held in memory buffers or a `/tmp` scratch directory during processing.
- Deleted immediately after the response is sent (or via a cleanup job/TTL).

## 3. Data Flow (Compress PDF example)
1. User uploads PDF + selects "Medium" profile.
2. Frontend sends `multipart/form-data` POST to `/api/compress/pdf`.
3. Backend maps "Medium" → Ghostscript flags (e.g. `-dPDFSETTINGS=/ebook`).
4. Ghostscript processes file in temp dir.
5. Backend streams compressed file back with new size in response headers.
6. Frontend shows before/after size comparison + download button.
7. Temp files deleted.

## 4. Scaling Considerations (post-MVP)
- Move processing to a **job queue** (e.g. BullMQ + Redis) if files are large or traffic grows, so uploads don't block the API thread.
- Use **object storage** (S3-compatible) with signed URLs instead of streaming through the API server, for large files.
- Consider a **serverless function per tool** (merge / compress-pdf / compress-image) if usage is spiky.

## 5. Security Notes
- Validate MIME type + magic bytes, not just file extension.
- Set strict file size limits at the upload layer (before hitting processing).
- Sandbox/limit Ghostscript subprocess (no shell injection — pass args as array, never string-concatenate).
- Rate-limit endpoints to prevent abuse.
