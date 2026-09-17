export default function DocsPage() {
  return (
    <div className="page-card">
      <div className="card-head">
        <span className="head-title">DOCUMENTATION</span>
      </div>
      <div className="card-body page-content">
        <section className="doc-section">
          <h2 className="doc-h2">GETTING STARTED</h2>
          <p className="doc-p">
            Shrinkloom is a browser-based PDF &amp; Image toolkit with three tools:
            <strong> Merge PDF</strong>, <strong>Compress PDF</strong>, and{" "}
            <strong>Compress Image</strong>.
          </p>
          <p className="doc-p">
            No login required. All processing happens server-side. Files are
            automatically deleted after processing.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">TOOLS</h2>

          <h3 className="doc-h3">MERGE PDF</h3>
          <ul className="doc-list">
            <li>Upload 2–20 PDF files via drag-and-drop or file picker</li>
            <li>Reorder files by dragging or using the arrow buttons</li>
            <li>Hit <strong>MERGE PDF</strong> to combine them in order</li>
            <li>Download the merged result</li>
          </ul>

          <h3 className="doc-h3">COMPRESS PDF</h3>
          <ul className="doc-list">
            <li><strong>LOW</strong> — aggressive compression, smallest file</li>
            <li><strong>MEDIUM</strong> — balanced compression (default)</li>
            <li><strong>HIGH</strong> — light compression, best quality</li>
            <li><strong>CUSTOM</strong> — set a target size (MB) or quality (0–100)</li>
          </ul>

          <h3 className="doc-h3">COMPRESS IMAGE</h3>
          <ul className="doc-list">
            <li>Supports JPG, PNG, and WebP</li>
            <li><strong>LOW</strong> / <strong>MEDIUM</strong> / <strong>HIGH</strong> presets</li>
            <li><strong>CUSTOM</strong> — set a target file size in KB</li>
          </ul>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">API ENDPOINTS</h2>
          <div className="doc-table-wrap">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>ENDPOINT</th>
                  <th>METHOD</th>
                  <th>PAYLOAD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>/api/merge</code></td>
                  <td>POST</td>
                  <td>multipart — files[], order (optional JSON)</td>
                </tr>
                <tr>
                  <td><code>/api/compress/pdf</code></td>
                  <td>POST</td>
                  <td>multipart — file, profile, targetSizeMB, quality</td>
                </tr>
                <tr>
                  <td><code>/api/compress/image</code></td>
                  <td>POST</td>
                  <td>multipart — file, profile, targetSizeKB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">LIMITS</h2>
          <ul className="doc-list">
            <li>Max 500 MB per file</li>
            <li>Max 500 MB total across all files (merge)</li>
            <li>Max 20 files per merge</li>
          </ul>
        </section>
      </div>
    </div>
  );
}