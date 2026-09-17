# Api.md — API Contract

Base URL: `/api`

## 1. POST `/merge`
Merge multiple PDFs in a specified order.

**Request**: `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `files` | File[] | PDF files, sent in desired final order |
| `order` | string (JSON array, optional) | Explicit order override, e.g. `[2,0,1]` indices into `files` |

**Response**: `200 OK`, `application/pdf` (binary stream) + headers:
```
Content-Disposition: attachment; filename="merged.pdf"
X-Original-Total-Size: 4582012
X-Merged-Size: 4581900
```

**Errors**:
| Code | Reason |
|---|---|
| 400 | Fewer than 2 files, non-PDF file detected |
| 413 | Total upload size exceeds limit |
| 422 | Corrupt or password-protected PDF |

---

## 2. POST `/compress/pdf`
**Request**: `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `file` | File | Single PDF |
| `profile` | string | `low` \| `medium` \| `high` \| `custom` |
| `targetSizeMB` | number (optional) | Required if `profile=custom` and using size-based mode |
| `quality` | number 0–100 (optional) | Required if `profile=custom` and using quality-based mode |

**Response**: `200 OK`, `application/pdf` + headers:
```
X-Original-Size: 8123456
X-Compressed-Size: 2456789
X-Reduction-Percent: 69.8
```

**Errors**: `400` invalid profile/params, `422` compression failed / already minimal size.

---

## 3. POST `/compress/image`
**Request**: `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `file` | File | jpg/png/webp |
| `profile` | string | `low` \| `medium` \| `high` \| `custom` |
| `targetSizeKB` | number (optional) | For custom size-based mode |
| `quality` | number 0–100 (optional) | For custom quality-based mode |
| `maxWidth` | number (optional) | For custom resize mode |

**Response**: `200 OK`, `image/<format>` + headers:
```
X-Original-Size: 3456789
X-Compressed-Size: 512340
X-Reduction-Percent: 85.2
```

**Errors**: `400` invalid profile/params/unsupported format, `422` compression failed.

---

## 4. Common Conventions
- All errors return JSON: `{ "error": "message", "code": "SOME_CODE" }`
- Max upload size enforced at the reverse-proxy/Express level (`multer` limits) — return `413` before processing.
- All responses include `X-*` size headers so the frontend can show a before/after comparison without a separate call.
