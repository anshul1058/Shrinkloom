# Tech.md — Technology Stack

## 1. Frontend

| Layer | Choice | Why |
|---|---|---|
| Framework | React + Vite | Fast dev server, simple SPA, huge ecosystem |
| Styling | Tailwind CSS | Quick to build clean UI without custom CSS overhead |
| Drag-drop upload | `react-dropzone` | Handles multi-file drag-drop cleanly |
| Reorder list | `dnd-kit` (or `react-beautiful-dnd`) | Accessible drag-to-reorder for merge ordering |
| HTTP client | `fetch` / `axios` | Simple multipart uploads |

## 2. Backend

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js + Express | Matches frontend language (JS/TS everywhere), fast to build |
| File upload handling | `multer` | Standard multipart/form-data middleware for Express |
| PDF merge | `pdf-lib` | Pure JS, works both client-side and server-side, no native deps |
| PDF compression | Ghostscript (`gs` CLI via `child_process`) | Industry-standard, handles DPI downsampling + image recompression well; no good pure-JS equivalent |
| Image compression | `sharp` | Fast (libvips-based), supports quality %, resize, format conversion |
| Alt: client-side image compression | `browser-image-compression` | Avoids server round-trip for simple cases — good for MVP if you want zero backend for images |

## 3. Why a backend is required (not fully client-side)
- **Merge**: could be 100% client-side with `pdf-lib` — no server needed if privacy/simplicity is the priority.
- **PDF compression**: genuinely needs Ghostscript (or similar), which cannot run in-browser → **requires a backend**.
- **Image compression**: can be client-side for MVP, but server-side (`sharp`) gives more consistent, higher-quality results and central control over the 4 profiles.

**Recommendation**: build one lightweight Node/Express backend that handles all 3, even though merge *could* be client-only — keeps the architecture consistent and makes future features (batch processing, size limits, logging) easier to add.

## 4. Compression Profile Mapping

### PDF (Ghostscript `-dPDFSETTINGS`)
| Profile | Ghostscript preset | Approx. DPI |
|---|---|---|
| Low quality / smallest size | `/screen` | 72 |
| Medium quality / medium size | `/ebook` | 150 |
| High quality / larger size | `/printer` | 300 |
| Custom | `/printer` or `/ebook` base + custom `-dColorImageResolution=<N>` and iterative retry to hit target size |

### Image (`sharp`)
| Profile | JPEG quality | Resize |
|---|---|---|
| Low | 35 | Optional downscale to max 1280px width |
| Medium | 65 | No resize |
| High | 88 | No resize |
| Custom | User-set % (or binary-search quality to hit target KB/MB) |

## 5. Deployment

| Component | Suggestion |
|---|---|
| Frontend | Netlify / Vercel (static SPA build) |
| Backend | Render / Railway / a small VPS (needs Ghostscript installed — not all serverless platforms support native binaries easily) |
| Ghostscript availability | Confirm host supports installing system packages, or use a Docker image with `ghostscript` pre-installed |

## 6. Suggested Dependencies (package.json excerpt)
```json
{
  "dependencies": {
    "express": "^4.19.0",
    "multer": "^1.4.5",
    "pdf-lib": "^1.17.1",
    "sharp": "^0.33.0",
    "cors": "^2.8.5"
  }
}
```
