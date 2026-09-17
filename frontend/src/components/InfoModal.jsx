import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";

export default function InfoModal({ isOpen, initialTab = "docs", onClose }) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle backdrop light-dismiss fallback
  const handleDialogClick = (e) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (e.target === dialog) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="neo-modal"
      closedby="any"
      aria-labelledby="modal-title"
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="neo-modal-content">
        {/* Modal Header */}
        <div className="neo-modal-head">
          <div className="modal-head-left">
            <Icon
              name={activeTab === "docs" ? "doc" : activeTab === "privacy" ? "check" : "pages"}
              size={18}
            />
            <span id="modal-title" className="modal-title">
              {activeTab === "docs" && "SYSTEM DOCUMENTATION"}
              {activeTab === "privacy" && "PRIVACY & SECURITY POLICY"}
              {activeTab === "terms" && "TERMS OF SERVICE"}
            </span>
          </div>

          <div className="modal-tab-nav">
            <button
              type="button"
              className={"modal-nav-btn" + (activeTab === "docs" ? " active" : "")}
              onClick={() => setActiveTab("docs")}
            >
              DOCS
            </button>
            <button
              type="button"
              className={"modal-nav-btn" + (activeTab === "privacy" ? " active" : "")}
              onClick={() => setActiveTab("privacy")}
            >
              PRIVACY
            </button>
            <button
              type="button"
              className={"modal-nav-btn" + (activeTab === "terms" ? " active" : "")}
              onClick={() => setActiveTab("terms")}
            >
              TERMS
            </button>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="card-divider" style={{ margin: "0" }} />

        {/* Modal Content Switcher */}
        <div className="neo-modal-body">
          {/* =========================================================
              DOCUMENTATION TAB
             ========================================================= */}
          {activeTab === "docs" && (
            <section className="modal-section">
              <div className="modal-sec-header">
                <span className="sec-tag">DOCS // V1.0.0</span>
                <h3>SYSTEM ARCHITECTURE &amp; USAGE</h3>
              </div>
              <p className="modal-lead">
                Shrinkloom is an engineer-first, stateless toolkit engineered for high-fidelity
                image compression, PDF size reduction, and multi-document PDF merging.
              </p>

              <div className="modal-grid">
                <div className="modal-card-sub">
                  <div className="subcard-title">
                    <Icon name="image" size={14} />
                    <span>IMAGE COMPRESSION ENGINE</span>
                  </div>
                  <p>
                    Powered by <strong>Sharp</strong> (libvips C-bindings). Re-encodes JPG, PNG, and WebP
                    with color-space preservation and quantization optimization.
                  </p>
                  <ul className="modal-list">
                    <li><strong>LOW:</strong> Aggressive downsampling (Quality 35) + max 1280px width constraint.</li>
                    <li><strong>MEDIUM:</strong> Balanced profile (Quality 65) without downscaling.</li>
                    <li><strong>HIGH:</strong> Archival fidelity (Quality 88) with minimal compression artifacts.</li>
                    <li><strong>CUSTOM:</strong> Target Size (KB), manual Quality (0–100), or Max Width (px).</li>
                  </ul>
                </div>

                <div className="modal-card-sub">
                  <div className="subcard-title">
                    <Icon name="doc" size={14} />
                    <span>PDF COMPRESSION ENGINE</span>
                  </div>
                  <p>
                    Powered by <strong>Ghostscript</strong> subprocess isolation with specialized PostScript
                    distiller parameter presets:
                  </p>
                  <ul className="modal-list">
                    <li><strong>LOW:</strong> <code>/screen</code> preset (~72 DPI) for low-bandwidth email attachments.</li>
                    <li><strong>MEDIUM:</strong> <code>/ebook</code> preset (~150 DPI) for screen reading.</li>
                    <li><strong>HIGH:</strong> <code>/printer</code> preset (~300 DPI) for print preparation.</li>
                    <li><strong>CUSTOM:</strong> Target Size in MB via adaptive color resolution downsampling.</li>
                  </ul>
                </div>

                <div className="modal-card-sub">
                  <div className="subcard-title">
                    <Icon name="pages" size={14} />
                    <span>PDF MERGE PIPELINE</span>
                  </div>
                  <p>
                    Powered by <strong>pdf-lib</strong>. Combines multiple PDF streams in arbitrary user-defined
                    order with metadata normalization and page-index validation.
                  </p>
                  <ul className="modal-list">
                    <li>Accepts up to 20 documents per merge job.</li>
                    <li>Interactive drag-to-reorder and manual index sorting.</li>
                    <li>Preserves internal links and embedded vector elements.</li>
                  </ul>
                </div>

                <div className="modal-card-sub">
                  <div className="subcard-title">
                    <Icon name="chartBox" size={14} />
                    <span>HTTP API CONTRACT</span>
                  </div>
                  <div className="code-block">
                    <code>
                      # Compress Image<br />
                      curl -F "file=@photo.png" -F "profile=medium" /api/compress/image<br /><br />
                      # Compress PDF<br />
                      curl -F "file=@doc.pdf" -F "profile=low" /api/compress/pdf<br /><br />
                      # Merge PDFs<br />
                      curl -F "files=@a.pdf" -F "files=@b.pdf" /api/merge
                    </code>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PRIVACY POLICY TAB
             ========================================================= */}
          {activeTab === "privacy" && (
            <section className="modal-section">
              <div className="modal-sec-header">
                <span className="sec-tag green">PRIVACY // ZERO_RETENTION</span>
                <h3>DATA HANDLING &amp; PRIVACY POLICY</h3>
              </div>
              <p className="modal-lead">
                We treat your files as strictly ephemeral assets. Your privacy is enforced by system
                architecture, not just promises.
              </p>

              <div className="policy-block-grid">
                <div className="policy-item">
                  <div className="policy-badge">01</div>
                  <div>
                    <h4>Zero File Retention</h4>
                    <p>
                      Uploaded files are processed in-memory or in isolated temporary scratch directories.
                      Immediately after the compressed or merged output is streamed back to your browser,
                      all server-side temporary buffers are wiped (<code>rm -f</code>).
                    </p>
                  </div>
                </div>

                <div className="policy-item">
                  <div className="policy-badge">02</div>
                  <div>
                    <h4>No Content Inspection or Logging</h4>
                    <p>
                      Document and image contents are never scanned, analyzed, or indexed. We do not maintain
                      file hashes, previews, or historical file copies on any server.
                    </p>
                  </div>
                </div>

                <div className="policy-item">
                  <div className="policy-badge">03</div>
                  <div>
                    <h4>Client-Side Local Storage Only</h4>
                    <p>
                      The <strong>History</strong> tab stores basic metadata (timestamp, filename, file sizes)
                      exclusively within your browser's private <code>localStorage</code>. This data never leaves
                      your device and can be cleared at any time with a single click.
                    </p>
                  </div>
                </div>

                <div className="policy-item">
                  <div className="policy-badge">04</div>
                  <div>
                    <h4>No Trackers or Advertising Cookies</h4>
                    <p>
                      Shrinkloom does not load third-party analytics (no Google Analytics, no Facebook pixels),
                      nor do we deploy tracking pixels, fingerprinting scripts, or advertising cookies.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              TERMS OF SERVICE TAB
             ========================================================= */}
          {activeTab === "terms" && (
            <section className="modal-section">
              <div className="modal-sec-header">
                <span className="sec-tag">LEGAL // MIT_LICENSE</span>
                <h3>TERMS OF SERVICE</h3>
              </div>
              <p className="modal-lead">
                By using Shrinkloom, you agree to these transparent, standard open-source service terms.
              </p>

              <div className="terms-container">
                <div className="terms-clause">
                  <h4>1. Permitted Use</h4>
                  <p>
                    You are granted full permission to use Shrinkloom for personal, academic, and commercial
                    purposes free of charge. You retain 100% of all intellectual property rights to your files.
                  </p>
                </div>

                <div className="terms-clause">
                  <h4>2. Acceptable Conduct</h4>
                  <p>
                    You agree not to upload malicious software, corrupted binaries intended to disrupt server
                    availability, or materials prohibited by applicable local and international law.
                  </p>
                </div>

                <div className="terms-clause">
                  <h4>3. Disclaimer of Warranties</h4>
                  <p>
                    The service is provided "as-is" and "as-available" without warranties of any kind, either
                    express or implied. While Shrinkloom strives for maximum stability and compression efficiency,
                    we recommend keeping backups of all original source files.
                  </p>
                </div>

                <div className="terms-clause">
                  <h4>4. Limitation of Liability</h4>
                  <p>
                    In no event shall the authors or project maintainers be liable for any indirect, incidental,
                    or consequential damages arising out of the use or inability to use this software.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="card-divider" style={{ margin: "0" }} />

        {/* Modal Footer */}
        <div className="neo-modal-foot">
          <span className="foot-spec">
            STATUS: ACTIVE // ZERO_RETENTION_VERIFIED // MIT_LICENSE
          </span>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            CLOSE DIALOG
          </button>
        </div>
      </div>
    </dialog>
  );
}
