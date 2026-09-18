import { useState } from "react";
import { Icon } from "./components/Icon.jsx";
import { formatBytes, ordinal } from "./components/ui.jsx";
import InfoModal from "./components/InfoModal.jsx";
import Merge from "./tools/Merge.jsx";
import Compress from "./tools/Compress.jsx";
import Convert from "./tools/Convert.jsx";

const TABS = [
  { id: "image", label: "COMPRESS IMAGE" },
  { id: "pdf", label: "COMPRESS PDF" },
  { id: "merge", label: "MERGE" },
  { id: "pdf-to-word", label: "PDF → WORD" },
  { id: "word-to-pdf", label: "WORD → PDF" },
  { id: "history", label: "HISTORY" },
];

const HISTORY_KEY = "shrinkloom.history";
const APP_VERSION = "1.0.0";

function HistoryTab({ history, onClear }) {
  const totalJobs = history.length;
  const totalOrig = history.reduce((acc, h) => acc + (h.orig || 0), 0);
  const totalNew = history.reduce((acc, h) => acc + (h.newSize || 0), 0);
  const savedBytes = Math.max(0, totalOrig - totalNew);
  const savedPercent = totalOrig > 0 ? (savedBytes / totalOrig) * 100 : 0;

  return (
    <div className="tool-card-wrapper history-wrapper">
      <div className="card">
        <div className="card-head">
          <span className="head-title">
            <Icon name="clock" size={18} />
            ACTIVITY HISTORY
          </span>
          {totalJobs > 0 && (
            <span className="file-ready-badge">{totalJobs} RECORDS</span>
          )}
        </div>
        <div className="card-divider" />

        <div className="card-body">
          {totalJobs > 0 && (
            <div className="stats-breakdown" style={{ marginBottom: "16px" }}>
              <div className="stat-item">
                <span className="stat-name">TOTAL JOBS RUN</span>
                <span className="stat-val">{totalJobs}</span>
              </div>
              <div className="stat-item">
                <span className="stat-name">TOTAL PROCESSED</span>
                <span className="stat-val">{formatBytes(totalOrig)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-name">TOTAL OUTPUT SIZE</span>
                <span className="stat-val">{formatBytes(totalNew)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-name">OVERALL SAVED</span>
                <span className="stat-val">
                  {formatBytes(savedBytes)} ({savedPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <div className="empty-history-box">
              <Icon name="hourglass" size={36} className="icon-muted" />
              <span className="indicator-title">NO RECORDS FOUND</span>
              <span className="empty-sub">Compress or merge files to see activity records here.</span>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>TOOL</th>
                    <th>FILE</th>
                    <th>ORIGINAL</th>
                    <th>OUTPUT</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="ts">{ordinal(i)}</td>
                      <td className="tool">{h.tool}</td>
                      <td className="fname" title={h.file}>
                        {h.file}
                      </td>
                      <td className="num">{formatBytes(h.orig)}</td>
                      <td className="num">{formatBytes(h.newSize)}</td>
                      <td className="ts">
                        {new Date(h.ts).toISOString().slice(11, 19)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card-actions-row" style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="btn btn-reset wide"
              onClick={onClear}
              disabled={!history.length}
            >
              CLEAR HISTORY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("image");
  const [modalTab, setModalTab] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
      return [];
    }
  });

  const record = (entry) =>
    setHistory((h) => {
      const next = [entry, ...h].slice(0, 50);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const openModal = (tabId) => {
    setModalTab(tabId);
  };

  return (
    <div className="app">
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand">SHRINKLOOM</div>
          <nav className="nav-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={"nav-tab" + (tab === t.id ? " active" : "")}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="status-badge">
            <span className="status-square" />
            <span className="status-text">SYS_ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Graph Grid Canvas */}
      <main className="main">
        <div className="main-inner">
          {tab === "image" && <Compress type="image" record={record} />}
          {tab === "pdf" && <Compress type="pdf" record={record} />}
          {tab === "merge" && <Merge record={record} />}
          {tab === "pdf-to-word" && <Convert record={record} initialDirection="pdf-to-word" />}
          {tab === "word-to-pdf" && <Convert record={record} initialDirection="word-to-pdf" />}
          {tab === "history" && (
            <HistoryTab history={history} onClear={clearHistory} />
          )}
        </div>
      </main>

      {/* Footer matching reference screenshot */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-brand">SHRINKLOOM</span>
            <span className="footer-desc">
              SHRINKLOOM V1.0 — PDF &amp; IMAGE TOOLKIT
            </span>
          </div>
          <div className="footer-right">
            <nav className="footer-links">
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => openModal("docs")}
              >
                DOCUMENTATION
              </button>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => openModal("privacy")}
              >
                PRIVACY
              </button>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => openModal("terms")}
              >
                TERMS
              </button>
              <a
                href="https://github.com/anshul1058/Shrinkloom"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-btn"
              >
                GITHUB
              </a>
            </nav>
            <span className="footer-status">
              SYSTEM_STABLE // SHRINKLOOM V{APP_VERSION}
            </span>
          </div>
        </div>
      </footer>

      {/* Interactive Documentation, Privacy & Terms Modal */}
      <InfoModal
        isOpen={Boolean(modalTab)}
        initialTab={modalTab || "docs"}
        onClose={() => setModalTab(null)}
      />
    </div>
  );
}