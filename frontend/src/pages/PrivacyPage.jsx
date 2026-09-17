export default function PrivacyPage() {
  return (
    <div className="page-card">
      <div className="card-head">
        <span className="head-title">PRIVACY POLICY</span>
      </div>
      <div className="card-body page-content">
        <p className="doc-p muted">Last updated: September 2026</p>

        <section className="doc-section">
          <h2 className="doc-h2">FILE PROCESSING</h2>
          <p className="doc-p">
            All file processing happens on our servers. Uploaded files are held
            temporarily in memory or a scratch directory and are{" "}
            <strong>automatically deleted immediately after processing</strong>.
            No files are stored, cached, or retained beyond the duration of your
            request.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">DATA COLLECTION</h2>
          <p className="doc-p">
            Shrinkloom does not collect any personal data, analytics, or usage
            telemetry. There are no user accounts, cookies, or tracking
            mechanisms.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">THIRD-PARTY SERVICES</h2>
          <p className="doc-p">
            Shrinkloom does not share, sell, or transmit your files to any
            third-party service. All processing is performed on our own
            infrastructure.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">HISTORY</h2>
          <p className="doc-p">
            The HISTORY tab stores a record of your compress/merge operations
            locally in your browser using session storage. This data never leaves
            your device and is automatically cleared when you close your browser
            tab.
          </p>
        </section>
      </div>
    </div>
  );
}