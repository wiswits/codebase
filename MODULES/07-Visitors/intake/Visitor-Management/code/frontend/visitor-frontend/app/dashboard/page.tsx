"use client";

import Link from "next/link";

import { useDashboard } from "@/modules/visitor/hooks/useDashboard";

function formatStatus(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DashboardPage() {
  const {
    visitors,
    stats,
    loading,
    error,
    refresh,
  } = useDashboard();

  const recentVisitors = visitors.slice(0, 6);

  const completedPercentage =
    stats.total > 0
      ? Math.min(
          100,
          Math.round(
            (stats.checkedOut / stats.total) * 100
          )
        )
      : 0;

  const activePercentage =
    stats.total > 0
      ? Math.min(
          100,
          Math.round(
            (stats.checkedIn / stats.total) * 100
          )
        )
      : 0;

  const cancelledPercentage =
    stats.total > 0
      ? Math.min(
          100,
          Math.round(
            (stats.cancelled / stats.total) * 100
          )
        )
      : 0;

  return (
    <main className="dashboard-page">
      {/* TOP BAR */}

      <header className="dashboard-topbar">
        <Link
          href="/"
          className="dashboard-brand"
        >
          <span className="dashboard-brand-mark">
            E
          </span>

          <div>
            <strong>WisWits</strong>
            <span>Visitor Management</span>
          </div>
        </Link>

        <div className="dashboard-system-status">
          <span className="dashboard-status-dot" />
          System Operational
        </div>
      </header>

      <div className="dashboard-shell">
        {/* PAGE HEADER */}

        <section className="dashboard-header dashboard-reveal">
          <div>
            <div className="dashboard-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <strong>Dashboard</strong>
            </div>

            <p className="dashboard-eyebrow">
              VISITOR OPERATIONS
            </p>

            <h1>Visitor Dashboard</h1>

            <p className="dashboard-subtitle">
              Monitor visitor activity, access status,
              passes and daily operations from one
              workspace.
            </p>
          </div>

          <Link
            href="/visitors/check-in"
            className="dashboard-checkin-btn"
          >
            <span>+</span>
            Check In Visitor
          </Link>
        </section>

        {/* ERROR */}

        {error && (
          <div className="dashboard-error">
            <div>
              <strong>
                Dashboard data could not be loaded.
              </strong>

              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI CARDS */}

        <section className="dashboard-stat-grid">
          <StatCard
            label="Total Visitors"
            value={stats.total}
            detail="Visitor records"
            number="01"
            loading={loading}
          />

          <StatCard
            label="Currently Checked In"
            value={stats.checkedIn}
            detail="Visitors on campus"
            number="02"
            loading={loading}
            active
          />

          <StatCard
            label="Checked Out"
            value={stats.checkedOut}
            detail="Completed visits"
            number="03"
            loading={loading}
          />

          <StatCard
            label="Active Passes"
            value={stats.activePasses}
            detail="Valid visitor passes"
            number="04"
            loading={loading}
          />
        </section>

        {/* MAIN CONTENT */}

        <section className="dashboard-main-grid">
          {/* RECENT ACTIVITY */}

          <article className="dashboard-panel dashboard-reveal dashboard-delay-2">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-panel-kicker">
                  LIVE ACTIVITY
                </span>

                <h2>Recent Visitors</h2>

                <p>
                  Latest visitor activity across the
                  system.
                </p>
              </div>

              <Link href="/visitors">
                View Visitor Log →
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-loading">
                Loading visitor activity...
              </div>
            ) : recentVisitors.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon">
                  V
                </div>

                <strong>No visitor activity yet</strong>

                <span>
                  New visitor records will appear here.
                </span>
              </div>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Host</th>
                      <th>Check-In</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {recentVisitors.map((visitor) => (
                      <tr key={visitor.id}>
                        <td>
                          <div className="dashboard-visitor">
                            <div className="dashboard-avatar">
                              {visitor.visitor_name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {visitor.visitor_name}
                              </strong>

                              <span>
                                {visitor.purpose}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {visitor.host_name || "—"}
                        </td>

                        <td>
                          {formatDate(
                            visitor.check_in_at
                          )}
                        </td>

                        <td>
                          <span
                            className={`dashboard-status dashboard-status-${visitor.status}`}
                          >
                            <span />
                            {formatStatus(
                              visitor.status
                            )}
                          </span>
                        </td>

                        <td>
                          <Link
                            href={`/visitors/${visitor.id}`}
                            className="dashboard-row-link"
                          >
                            →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          {/* QUICK ACTIONS */}

          <aside className="dashboard-panel dashboard-actions-panel dashboard-reveal dashboard-delay-3">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-panel-kicker">
                  SHORTCUTS
                </span>

                <h2>Quick Actions</h2>

                <p>
                  Common visitor management tasks.
                </p>
              </div>
            </div>

            <div className="dashboard-action-list">
              <Link
                href="/visitors/check-in"
                className="dashboard-action-item"
              >
                <span className="dashboard-action-icon">
                  +
                </span>

                <div>
                  <strong>
                    Check In Visitor
                  </strong>

                  <span>
                    Register a new visitor
                  </span>
                </div>

                <b>→</b>
              </Link>

              <Link
                href="/visitors"
                className="dashboard-action-item"
              >
                <span className="dashboard-action-icon">
                  ≡
                </span>

                <div>
                  <strong>Visitor Log</strong>

                  <span>
                    Browse visitor records
                  </span>
                </div>

                <b>→</b>
              </Link>

              <button
                type="button"
                className="dashboard-action-item"
                onClick={() => void refresh()}
                disabled={loading}
              >
                <span className="dashboard-action-icon">
                  ↻
                </span>

                <div>
                  <strong>
                    Refresh Dashboard
                  </strong>

                  <span>
                    Update operational data
                  </span>
                </div>

                <b>→</b>
              </button>
            </div>

            <div className="dashboard-api-status">
              <div>
                <span className="dashboard-status-dot" />

                <div>
                  <strong>
                    Visitor Management API
                  </strong>

                  <span>
                    {error
                      ? "Connection issue"
                      : "Connected"}
                  </span>
                </div>
              </div>

              <span>
                {error ? "Issue" : "Online"}
              </span>
            </div>
          </aside>
        </section>

        {/* LOWER SECTION */}

        <section className="dashboard-bottom-grid">
          {/* VISIT STATUS */}

          <article className="dashboard-panel dashboard-reveal dashboard-delay-4">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-panel-kicker">
                  VISITOR LIFECYCLE
                </span>

                <h2>Visit Status</h2>

                <p>
                  Current distribution of visitor
                  activity.
                </p>
              </div>
            </div>

            <div className="dashboard-progress-list">
              <ProgressItem
                label="Checked In"
                value={stats.checkedIn}
                percentage={activePercentage}
              />

              <ProgressItem
                label="Checked Out"
                value={stats.checkedOut}
                percentage={completedPercentage}
              />

              <ProgressItem
                label="Cancelled"
                value={stats.cancelled}
                percentage={cancelledPercentage}
              />
            </div>
          </article>

          {/* OVERVIEW */}

          <article className="dashboard-panel dashboard-overview dashboard-reveal dashboard-delay-5">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-panel-kicker">
                  SYSTEM OVERVIEW
                </span>

                <h2>Operations Overview</h2>
              </div>
            </div>

            <div className="dashboard-overview-list">
              <OverviewRow
                label="Active Visitor Passes"
                value={stats.activePasses}
              />

              <OverviewRow
                label="Visitors On Campus"
                value={stats.checkedIn}
              />

              <OverviewRow
                label="Cancelled Visits"
                value={stats.cancelled}
              />

              <OverviewRow
                label="Total Visitor Records"
                value={stats.total}
                strong
              />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  number,
  loading,
  active = false,
}: {
  label: string;
  value: number;
  detail: string;
  number: string;
  loading: boolean;
  active?: boolean;
}) {
  return (
    <article
      className={`dashboard-stat-card ${
        active ? "dashboard-stat-active" : ""
      }`}
    >
      <div className="dashboard-stat-top">
        <span>{label}</span>
        <small>{number}</small>
      </div>

      <strong className="dashboard-stat-value">
        {loading ? "—" : value}
      </strong>

      <div className="dashboard-stat-bottom">
        <span>{detail}</span>

        {active && (
          <span className="dashboard-live">
            <i />
            LIVE
          </span>
        )}
      </div>
    </article>
  );
}

function ProgressItem({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div className="dashboard-progress-item">
      <div className="dashboard-progress-meta">
        <span>{label}</span>

        <strong>{value}</strong>
      </div>

      <div className="dashboard-progress-track">
        <div
          className="dashboard-progress-fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <small>{percentage}% of visitor records</small>
    </div>
  );
}

function OverviewRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`dashboard-overview-row ${
        strong
          ? "dashboard-overview-row-strong"
          : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}