import { useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Icon } from "./Icon.jsx";

export function formatBytes(n) {
  if (!Number.isFinite(n) || n <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return n.toFixed(i ? 1 : 0) + " " + units[i];
}

export function ordinal(i) {
  const s = ["TH", "ST", "ND", "RD"];
  const v = i + 1;
  return v + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function parseFileName(res) {
  const cd = res.headers.get("Content-Disposition") || "";
  const m = cd.match(/filename="?([^"]+)"?/);
  return m ? m[1] : null;
}

export function move(arr, from, to) {
  const c = [...arr];
  const [x] = c.splice(from, 1);
  c.splice(to, 0, x);
  return c;
}

export function Section({ icon, name, children, right }) {
  return (
    <div className="section">
      <div className="sec-head">
        {icon && <Icon name={icon} size={14} />}
        <span>{name}</span>
        {right}
      </div>
      <div className="sec-body">{children}</div>
    </div>
  );
}

export const DropZone = forwardRef(function DropZone(
  {
    accept,
    tag,
    title = "DROP IMAGE HERE",
    subtitle = "OR CLICK TO BROWSE",
    multiple = true,
    onFiles,
  },
  ref
) {
  const internalInputRef = useRef(null);
  const [over, setOver] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => internalInputRef.current?.click(),
  }));

  const handle = (list) => {
    if (!list || !list.length) return;
    onFiles([...list]);
    if (internalInputRef.current) internalInputRef.current.value = "";
  };

  return (
    <div
      className={"dropzone" + (over ? " over" : "")}
      onClick={() => internalInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
    >
      <div className="dz-icon">
        <Icon name="cloud" size={32} />
      </div>
      <div className="dz-title">{title}</div>
      <div className="dz-sub">{subtitle}</div>
      {tag && <div className="dz-pill">{tag}</div>}
      <input
        ref={internalInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
});

export function FileQueue({ files, reorderable = true, onReorder, onRemove }) {
  const [dragFrom, setDragFrom] = useState(null);

  const drop = (to) => {
    if (dragFrom === null || dragFrom === to) {
      setDragFrom(null);
      return;
    }
    onReorder(move(files, dragFrom, to));
    setDragFrom(null);
  };

  if (!files.length) {
    return <div className="empty-queue">NO FILES LOADED</div>;
  }

  return (
    <div className="queue">
      {files.map((f, i) => (
        <div
          key={f.name + "-" + f.size + "-" + i}
          className={"file-row" + (dragFrom === i ? " drag" : "")}
          draggable={reorderable}
          onDragStart={() => reorderable && setDragFrom(i)}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => dragFrom !== null && dragFrom !== i && drop(i)}
          onDrop={(e) => {
            e.preventDefault();
            drop(i);
          }}
          onDragEnd={() => setDragFrom(null)}
        >
          {reorderable && <span className="drag-handle" title="Drag to reorder">≡</span>}
          <span className="pos">{ordinal(i)}</span>
          <span className="fname" title={f.name}>
            {f.name}
          </span>
          <span className="fsize">{formatBytes(f.size)}</span>
          <div className="row-actions">
            {reorderable && (
              <>
                <button
                  type="button"
                  className="btn-mini"
                  disabled={i === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorder(move(files, i, i - 1));
                  }}
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="btn-mini"
                  disabled={i === files.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorder(move(files, i, i + 1));
                  }}
                  aria-label="Move down"
                >
                  ▼
                </button>
              </>
            )}
            <button
              type="button"
              className="btn-mini danger"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(i);
              }}
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileGrid({ profiles, value, onChange }) {
  return (
    <div className="profile-grid">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          className={"profile-card" + (value === p.id ? " selected" : "")}
          onClick={() => onChange(p.id)}
        >
          <span className="p-label">{p.label}</span>
          <span className="p-desc">{p.desc}</span>
        </button>
      ))}
    </div>
  );
}

export function ResultCard({
  status = "done",
  title = "OPTIMIZED FILE READY",
  stats = [],
  url,
  name,
  previewUrl,
  isImage,
  error,
}) {
  if (status === "idle") return null;

  if (status === "busy") {
    return (
      <div className="result-container busy-box">
        <div className="result-status-header">
          <Icon name="spinner" size={20} className="spin icon-muted" />
          <span className="result-status-title">PROCESSING FILE...</span>
        </div>
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="result-container error-box">
        <div className="result-status-header">
          <Icon name="x" size={20} className="icon-error" />
          <span className="result-status-title error-text">PROCESSING FAILED</span>
        </div>
        <div className="error-detail">{error}</div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="result-container success-box">
        <div className="result-status-header">
          <Icon name="check" size={20} className="icon-success" />
          <span className="result-status-title">{title}</span>
        </div>

        {isImage && previewUrl && (
          <div className="image-preview-wrapper">
            <img src={previewUrl} alt="Compressed preview" className="preview-img" />
          </div>
        )}

        {stats.length > 0 && (
          <div className="stats-breakdown">
            {stats.map((s) => (
              <div className="stat-item" key={s.label}>
                <span className="stat-name">{s.label}</span>
                <span className="stat-val">{s.value}</span>
              </div>
            ))}
          </div>
        )}

        {url && (
          <a className="btn btn-primary wide download-btn" href={url} download={name}>
            <Icon name="download" size={16} />
            DOWNLOAD {name ? name.toUpperCase() : "RESULT"}
          </a>
        )}
      </div>
    );
  }

  return null;
}