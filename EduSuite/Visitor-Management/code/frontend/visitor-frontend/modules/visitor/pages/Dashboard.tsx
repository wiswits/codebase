"use client";

import Link from "next/link";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
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

          <h1>Visitor Dashboard</h1>

          <p>
            Monitor visitor activity and current
            visit status.
          </p>
        </div>

        <Link href="/visitors/check-in">
          + Check In Visitor
        </Link>
      </header>

      {error && (
        <div role="alert">
          <strong>
            Unable to load dashboard
          </strong>

          <p>{error}</p>

          <button onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading visitor dashboard...</p>
      ) : (
        <>
          <section className="visitor-stats-grid">
            <Stat
              label="Total Visitors"
              value={stats.total}
            />

            <Stat
              label="Checked In"
              value={stats.checkedIn}
            />

            <Stat
              label="Checked Out"
              value={stats.checkedOut}
            />

            <Stat
              label="Cancelled"
              value={stats.cancelled}
            />

            <Stat
              label="Active Passes"
              value={stats.activePasses}
            />
          </section>

          <section className="visitor-card">
            <h2>Recent Visitors</h2>

            {visitors.length === 0 ? (
              <p>No visitor activity available.</p>
            ) : (
              visitors.slice(0, 5).map((visitor) => (
                <div
                  key={visitor.id}
                  className="visitor-dashboard-row"
                >
                  <div>
                    <strong>
                      {visitor.visitor_name}
                    </strong>

                    <p>{visitor.purpose}</p>
                  </div>

                  <div>
                    <span>
                      {visitor.status
                        .replaceAll("_", " ")}
                    </span>

                    <Link
                      href={`/visitors/${visitor.id}`}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Stat({
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