export default function TermsPage() {
  return (
    <div className="page-card">
      <div className="card-head">
        <span className="head-title">TERMS OF USE</span>
      </div>
      <div className="card-body page-content">
        <p className="doc-p muted">Last updated: September 2026</p>

        <section className="doc-section">
          <h2 className="doc-h2">ACCEPTANCE</h2>
          <p className="doc-p">
            By using Shrinkloom you agree to these terms. If you do not agree,
            do not use the service.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">USAGE</h2>
          <p className="doc-p">
            Shrinkloom is provided as-is for lawful file processing. You are
            solely responsible for the files you upload and the legality of your
            use.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">AVAILABILITY</h2>
          <p className="doc-p">
            Shrinkloom is an MVP offered without uptime guarantees. We may
            modify, suspend, or discontinue the service at any time without
            notice.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">LIMITATION OF LIABILITY</h2>
          <p className="doc-p">
            Shrinkloom and its maintainers shall not be liable for any loss of
            data, revenue, or functionality arising from use of the service.
            Always keep local copies of important files.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-h2">CHANGES</h2>
          <p className="doc-p">
            We may update these terms at any time. Continued use after changes
            constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}