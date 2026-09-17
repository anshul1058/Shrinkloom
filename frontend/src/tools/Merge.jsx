import { useRef, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import {
  DropZone,
  FileQueue,
  ResultCard,
  Section,
  formatBytes,
  parseFileName,
} from "../components/ui.jsx";

export default function Merge({ record }) {
  const dropZoneRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [out, setOut] = useState({
    status: "idle",
    stats: [],
  });
  const urlRef = useRef(null);

  const addFiles = (list) =>
    setFiles((prev) => [...prev, ...list].slice(0, 20));

  const remove = (i) => setFiles((prev) => prev.filter((_, j) => j !== i));

  const reset = () => {
    setFiles([]);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setOut({
      status: "idle",
      stats: [],
    });
  };

  const canRun = files.length >= 2 && out.status !== "busy";

  async function run() {
    if (!canRun) return;
    setOut({
      status: "busy",
      stats: [],
    });

    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    try {
      const res = await fetch("/api/merge", { method: "POST", body: form });
      const xs = res.headers;

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "HTTP " + res.status);
      }

      const blob = await res.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const orig = Number(xs.get("X-Original-Total-Size")) || files.reduce((acc, f) => acc + f.size, 0);
      const mergedSize = Number(xs.get("X-Merged-Size")) || blob.size;
      const pageCount = xs.get("X-Merged-Pages") || "-";

      setOut({
        status: "done",
        url,
        name: parseFileName(res) || "merged.pdf",
        stats: [
          { label: "TOTAL INPUT SIZE", value: formatBytes(orig) },
          { label: "MERGED PDF SIZE", value: formatBytes(mergedSize) },
          { label: "PAGE COUNT", value: String(pageCount) },
        ],
      });

      record?.({
        tool: "MERGE",
        file: files.length + " FILES",
        orig,
        newSize: mergedSize,
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

  return (
    <div className="tool-card-wrapper">
      <div className="card">
        <div className="card-head">
          <span className="head-title">
            <Icon name="pages" size={18} />
            MERGE PDF
          </span>
          {files.length > 0 && (
            <span className="file-ready-badge">{files.length} / 20 READY</span>
          )}
        </div>
        <div className="card-divider" />

        <div className="card-body">
          <DropZone
            ref={dropZoneRef}
            accept="application/pdf,.pdf"
            tag="PDF — UP TO 500 MB TOTAL"
            title="DROP PDFS HERE"
            subtitle="OR CLICK TO BROWSE"
            multiple={true}
            onFiles={addFiles}
          />

          <Section
            icon="doc"
            name="FILE QUEUE"
            right={<span className="queue-count-badge">{files.length} / 20</span>}
          >
            <FileQueue files={files} onReorder={setFiles} onRemove={remove} />
          </Section>

          {/* Row of two buttons matching screenshot: SELECT FILE and RESET */}
          <div className="card-actions-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dropZoneRef.current?.open()}
            >
              SELECT FILES
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
              MERGE PDFS
            </button>
          </div>

          {/* Inline Output / Result Section */}
          <ResultCard
            status={out.status}
            title="MERGED PDF READY"
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