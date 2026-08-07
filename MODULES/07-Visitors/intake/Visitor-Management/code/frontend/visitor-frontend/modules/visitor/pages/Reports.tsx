"use client";

import { useDashboard } from "../hooks/useDashboard";

export default function Reports() {
  const {
    visitors,
    stats,
    loading,
    error,
    refresh,
  } = useDashboard();

  return (
    <main className="visitor-page">
      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Visitor Reports</h1>

          <p>
            Review visitor activity and visit
            statistics.
          </p>
        </div>
      </header>

      {error && (
        <div role="alert">
          <p>{error}</p>

          <button onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading report...</p>
      ) : (
        <>
          <section className="visitor-stats-grid">
            <ReportStat
              label="Total"
              value={stats.total}
            />

            <ReportStat
              label="Checked In"
              value={stats.checkedIn}
            />

            <ReportStat
              label="Checked Out"
              value={stats.checkedOut}
            />

            <ReportStat
              label="Cancelled"
              value={stats.cancelled}
            />
          </section>

          <section className="visitor-card">
            <h2>Visitor Activity</h2>

            {visitors.map((visitor) => (
              <div
                key={visitor.id}
                className="visitor-report-row"
              >
                <strong>
                  {visitor.visitor_name}
                </strong>

                <span>{visitor.purpose}</span>

                <span>
                  {visitor.status.replaceAll(
                    "_",
                    " "
                  )}
                </span>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function ReportStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="visitor-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}