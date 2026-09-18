import { useRef, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import {
  DropZone,
  ResultCard,
  Section,
  formatBytes,
  parseFileName,
} from "../components/ui.jsx";

const DIRECTIONS = [
  { id: "pdf-to-word", label: "PDF → WORD", desc: "PDF TO DOCX" },
  { id: "word-to-pdf", label: "WORD → PDF", desc: "DOCX TO PDF" },
];

export default function Convert({ record, initialDirection = "pdf-to-word" }) {
  const dropZoneRef = useRef(null);
  const [direction, setDirection] = useState(initialDirection);
  const [file, setFile] = useState(null);
  const [out, setOut] = useState({ status: "idle", stats: [] });
  const urlRef = useRef(null);

  const isPdfToWord = direction === "pdf-to-word";
  const accept = isPdfToWord ? "application/pdf,.pdf" : ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword";
  const tag = isPdfToWord ? "PDF — UP TO 500 MB" : "DOCX / DOC — UP TO 500 MB";
  const title = isPdfToWord ? "DROP PDF HERE" : "DROP WORD FILE HERE";

  const canRun = file && out.status !== "busy";

  const onSelectFiles = (files) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setOut({ status: "idle", stats: [] });
  };

  const reset = () => {
    setFile(null);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setOut({ status: "idle", stats: [] });
  };

  const switchDirection = (d) => {
    setDirection(d);
    reset();
  };

  async function run() {
    if (!canRun) return;
    setOut({ status: "busy", stats: [] });

    const form = new FormData();
    form.append("file", file);

    try {
      const route = isPdfToWord ? "/api/convert/pdf-to-word" : "/api/convert/word-to-pdf";
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
      const converted = Number(xs.get("X-Converted-Size")) || blob.size;

      setOut({
        status: "done",
        url,
        name: parseFileName(res) || (isPdfToWord ? "converted.docx" : "converted.pdf"),
        stats: [
          { label: "INPUT SIZE", value: formatBytes(orig) },
          { label: "OUTPUT SIZE", value: formatBytes(converted) },
          { label: "FORMAT", value: isPdfToWord ? "DOCX (Word)" : "PDF" },
        ],
      });

      record?.({
        tool: isPdfToWord ? "PDF → WORD" : "WORD → PDF",
        file: file.name,
        orig,
        newSize: converted,
        ts: Date.now(),
      });
    } catch (e) {
      setOut({ status: "error", error: e.message, stats: [] });
    }
  }

  return (
    <div className="tool-card-wrapper">
      <div className="card">
        <div className="card-head">
          <span className="head-title">
            <Icon name="rotate" size={18} />
            {isPdfToWord ? "PDF TO WORD" : "WORD TO PDF"}
          </span>
          {file && <span className="file-ready-badge">READY</span>}
        </div>
        <div className="card-divider" />

        <div className="card-body">
          <Section icon="rotate" name="CONVERSION DIRECTION">
            <div className="profile-grid">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={"profile-card" + (direction === d.id ? " selected" : "")}
                  onClick={() => switchDirection(d.id)}
                >
                  <span className="p-label">{d.label}</span>
                  <span className="p-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </Section>

          <DropZone
            ref={dropZoneRef}
            accept={accept}
            tag={tag}
            title={title}
            subtitle="OR CLICK TO BROWSE"
            multiple={false}
            onFiles={onSelectFiles}
          />

          {file && (
            <div className="selected-file-banner">
              <div className="selected-file-meta">
                <Icon name="doc" size={16} />
                <span className="selected-file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="selected-file-size">({formatBytes(file.size)})</span>
              </div>
              <button
                type="button"
                className="btn-mini danger"
                onClick={() => setFile(null)}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}

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

          <div className="primary-action-wrap">
            <button
              type="button"
              className="btn btn-primary wide"
              disabled={!canRun}
              onClick={run}
            >
              {isPdfToWord ? "CONVERT TO WORD" : "CONVERT TO PDF"}
            </button>
          </div>

          <ResultCard
            status={out.status}
            title={isPdfToWord ? "WORD FILE READY" : "PDF FILE READY"}
            stats={out.stats}
            url={out.url}
            name={out.name}
            isImage={false}
            error={out.error}
          />
        </div>
      </div>
    </div>
  );
}
