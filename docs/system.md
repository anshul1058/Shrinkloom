# System.md — PDF & Image Toolkit

## 1. Purpose
A web application offering 3 self-contained tools:

1. **Merge PDF** — combine multiple PDFs into one, in a user-defined order.
2. **Compress PDF** — reduce PDF file size via a quality/size profile.
3. **Compress Image** — reduce image file size via a quality/size profile.

## 2. Functional Requirements

### 2.1 Merge PDF
| Requirement | Detail |
|---|---|
| Upload | Multiple `.pdf` files (drag-drop + file picker) |
| Ordering | User can reorder files (drag-and-drop list, "1st, 2nd, 3rd…") before merging |
| Output | Single merged `.pdf`, downloadable |
| Validation | Reject non-PDF files; warn on password-protected/corrupt PDFs |
| Limits | Max file size per PDF, max total files (configurable, e.g. 20 files / 50MB each) |

### 2.2 Compress PDF
| Profile | Behavior |
|---|---|
| **Low quality / smallest size** | Aggressive downsampling (~72–96 DPI), high JPEG compression on images |
| **Medium quality / medium size** | Balanced (~150 DPI), moderate compression |
| **High quality / larger size** | Light compression (~200–300 DPI), preserves visual fidelity |
| **Custom** | User sets target size (MB) or a quality slider (0–100); system approximates via iterative compression |

### 2.3 Compress Image
Same 4-profile model as PDF, applied to `.jpg/.jpeg/.png/.webp`:
| Profile | Behavior |
|---|---|
| Low quality / smallest size | Aggressive JPEG quality (~30–40), optional downscale |
| Medium | JPEG quality ~60–70 |
| High | JPEG quality ~85–90, minimal downscale |
| Custom | User-set quality % or target file size (KB/MB) or target dimensions |

## 3. Non-Functional Requirements
- **Speed**: single-file operations should complete in <5s for files under 20MB.
- **Privacy**: files should not be retained after processing (auto-delete post-download or process in-memory).
- **No login required** for MVP (stateless, anonymous usage).
- **Responsive UI**: works on desktop and mobile browsers.

## 4. Out of Scope (MVP)
- OCR / scanned-PDF searchability
- PDF editing (text/annotations)
- Batch compression of multiple PDFs at once
- User accounts / saved history

## 5. Related Docs
- `architecture.md` — system components & data flow
- `tech.md` — technology choices & justification
- `api.md` — API contract between frontend and backend
