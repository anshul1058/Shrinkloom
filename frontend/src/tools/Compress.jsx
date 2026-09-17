import { useRef, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import {
  DropZone,
  ProfileGrid,
  ResultCard,
  Section,
  formatBytes,
  parseFileName,
} from "../components/ui.jsx";

const PDF_PROFILES = [
  { id: "low", label: "LOW", desc: "AGGRESSIVE // TINY" },
  { id: "medium", label: "MEDIUM", desc: "BALANCED // DEFAULT" },
  { id: "high", label: "HIGH", desc: "LIGHT // KEEPS QUALITY" },
  { id: "custom", label: "CUSTOM", desc: "TARGET SIZE" },
];

const IMG_PROFILES = [
  { id: "low", label: "LOW", desc: "SMALLEST FILE" },
  { id: "medium", label: "MEDIUM", desc: "BALANCED" },
  { id: "high", label: "HIGH", desc: "BEST QUALITY" },
  { id: "custom", label: "CUSTOM", desc: "TARGET SIZE" },
];

export default function Compress({ type = "image", record }) {
  const isPdf = type === "pdf";
  const profiles = isPdf ? PDF_PROFILES : IMG_PROFILES;

  const dropZoneRef = useRef(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [profile, setProfile] = useState("medium");
  const [target, setTarget] = useState("");
  const [out, setOut] = useState({
    status: "idle",
    stats: [],
  });
  const urlRef = useRef(null);

  const customValid = Number(target) > 0;

  const canRun =
    file && profile && (profile !== "custom" || customValid) && out.status !== "busy";

  const onSelectFiles = (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    if (!isPdf && f.type.startsWith("image/")) {
      const p = URL.createObjectURL(f);
      setFilePreview(p);
    } else {
      setFilePreview(null);
    }
    setOut({
      status: "idle",
      stats: [],
    });
  };

  const reset = () => {
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setProfile("medium");
    setTarget("");
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setOut({
      status: "idle",
      stats: [],
    });
  };

  async function run() {
    if (!canRun) return;
    setOut({
      status: "busy",
      stats: [],
    });

    const form = new FormData();
    form.append("file", file);
    form.append("profile", profile);
    if (profile === "custom") {
      if (isPdf) form.append("targetSizeMB", target);
      else form.append("targetSizeKB", target);
    }

    try {
      const route = isPdf ? "/api/compress/pdf" : "/api/compress/image";
      const res = await fetch(route, { method: "POST", body: form });
      const xs = res.headers;

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "HTTP " + res.status);
      }

      const blob = await res.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const orig = Number(xs.get("X-Original-Size")) || file.size;
      const comp = Number(xs.get("X-Compressed-Size")) || blob.size;
      const rawReduction = Number(xs.get("X-Reduction-Percent")) || Math.max(0, ((orig - comp) / orig) * 100);
      const reduction = Math.max(0, Math.min(100, rawReduction));

      setOut({
        status: "done",
        url,
        name: parseFileName(res) || (isPdf ? "compressed.pdf" : "compressed.jpg"),
        previewUrl: !isPdf ? url : null,
        stats: [
          { label: "ORIGINAL SIZE", value: formatBytes(orig) },
          { label: "COMPRESSED SIZE", value: formatBytes(comp) },
          { label: "SPACE REDUCTION", value: `${reduction.toFixed(1)} % SAVED` },
        ],
      });

      record?.({
        tool: isPdf ? "PDF COMPRESS" : "IMAGE COMPRESS",
        file: file.name,
        orig,
        newSize: comp,
        ts: Date.now(),
      });
    } catch (e) {
      setOut({
        status: "error",
        error: e.message,
        stats: [],
      });
    }
  }

  const cardTitle = isPdf ? "COMPRESS PDF" : "COMPRESS IMAGE";
  const actionButtonText = isPdf ? "COMPRESS PDF" : "COMPRESS IMAGE";

  return (
    <div className="tool-card-wrapper">
      <div className="card">
        <div className="card-head">
          <span className="head-title">
            <Icon name={isPdf ? "doc" : "image"} size={18} />
            {cardTitle}
          </span>
          {file && (
            <span className="file-ready-badge">READY</span>
          )}
        </div>
        <div className="card-divider" />

        <div className="card-body">
          <DropZone
            ref={dropZoneRef}
            accept={isPdf ? "application/pdf,.pdf" : "image/jpeg,image/png,image/webp"}
            tag={isPdf ? "PDF — UP TO 500 MB" : "JPG • PNG • WEBP — UP TO 500 MB"}
            title={isPdf ? "DROP PDF HERE" : "DROP IMAGE HERE"}
            subtitle="OR CLICK TO BROWSE"
            multiple={false}
            onFiles={onSelectFiles}
          />

          {file && (
            <div className="selected-file-banner">
              <div className="selected-file-meta">
                <Icon name={isPdf ? "doc" : "image"} size={16} />
                <span className="selected-file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="selected-file-size">({formatBytes(file.size)})</span>
              </div>
              <button
                type="button"
                className="btn-mini danger"
                onClick={() => {
                  setFile(null);
                  if (filePreview) URL.revokeObjectURL(filePreview);
                  setFilePreview(null);
                }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}

          <Section icon="chartBox" name="COMPRESSION PROFILE">
            <ProfileGrid profiles={profiles} value={profile} onChange={setProfile} />
            {profile === "custom" && (
              <div className="custom-fields">
                {isPdf ? (
                  <label className="field">
                    <span>TARGET SIZE (MB)</span>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={target}
                      placeholder="0.5"
                      onChange={(e) => setTarget(e.target.value)}
                    />
                  </label>
                ) : (
                  <label className="field">
                    <span>TARGET SIZE (KB)</span>
                    <input
                      type="number"
                      min="1"
                      value={target}
                      placeholder="80"
                      onChange={(e) => setTarget(e.target.value)}
                    />
                  </label>
                )}
              </div>
            )}
          </Section>

          {/* Row of two buttons matching screenshot: SELECT FILE and RESET */}
          <div className="card-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dropZoneRef.current?.open()}
            >
              SELECT FILE
            </button>
            <button type="button" className="btn btn-reset" onClick={reset}>
              RESET
            </button>
          </div>

          {/* Full-width primary button matching screenshot */}
          <div className="primary-action-wrap">
            <button
              type="button"
              className="btn btn-primary wide"
              disabled={!canRun}
              onClick={run}
            >
              {actionButtonText}
            </button>
          </div>

          {/* Inline Output / Result Section */}
          <ResultCard
            status={out.status}
            title={isPdf ? "COMPRESSED PDF READY" : "OPTIMIZED IMAGE READY"}
            stats={out.stats}
            url={out.url}
            name={out.name}
            previewUrl={out.previewUrl}
            isImage={!isPdf}
            error={out.error}
          />
        </div>
      </div>
    </div>
  );
}