import Link from "next/link";

import {
  VisitorService,
  type Visitor,
} from "@/services/visitor.service";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "V";
}

function getStatusClass(status: string) {
  switch (status) {
    case "checked_in":
      return "visitor-status visitor-status--active";

    case "checked_out":
      return "visitor-status visitor-status--complete";

    case "cancelled":
      return "visitor-status visitor-status--cancelled";

    default:
      return "visitor-status";
  }
}

export default async function VisitorsPage() {
  let visitors: Visitor[] = [];
  let errorMessage: string | null = null;

  try {
    const response = await VisitorService.list({
      page: 1,
      limit: 20,
    });

    visitors = response.data;
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load visitor data.";
  }

  const checkedIn = visitors.filter(
    (visitor) => visitor.status === "checked_in"
  ).length;

  const checkedOut = visitors.filter(
    (visitor) => visitor.status === "checked_out"
  ).length;

  const cancelled = visitors.filter(
    (visitor) => visitor.status === "cancelled"
  ).length;

  return (
    <main className="visitor-log-page">
      <div className="visitor-log-shell">

        {/* Breadcrumb */}

        <nav
          className="visitor-log-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <strong>Visitor Log</strong>
        </nav>

        {/* Header */}

        <header className="visitor-log-header">
          <div>
            <p className="visitor-log-eyebrow">
              VISITOR RECORDS
            </p>

            <h1>Visitor Log</h1>

            <p className="visitor-log-subtitle">
              Search, review and manage visitor activity
              across the campus.
            </p>
          </div>

          <Link
            href="/visitors/check-in"
            className="visitor-log-primary-action"
          >
            <span>+</span>
            Check In Visitor
          </Link>
        </header>

        {/* Summary */}

        {!errorMessage && (
          <section className="visitor-log-summary">
            <div className="visitor-log-summary-item">
              <span className="visitor-log-summary-label">
                TOTAL RECORDS
              </span>

              <strong>{visitors.length}</strong>

              <span>Visitor records</span>
            </div>

            <div className="visitor-log-summary-item">
              <span className="visitor-log-summary-label">
                ON CAMPUS
              </span>

              <strong>{checkedIn}</strong>

              <span>Currently checked in</span>
            </div>

            <div className="visitor-log-summary-item">
              <span className="visitor-log-summary-label">
                COMPLETED
              </span>

              <strong>{checkedOut}</strong>

              <span>Checked-out visits</span>
            </div>

            <div className="visitor-log-summary-item">
              <span className="visitor-log-summary-label">
                CANCELLED
              </span>

              <strong>{cancelled}</strong>

              <span>Cancelled visits</span>
            </div>
          </section>
        )}

        {/* Workspace */}

        <section className="visitor-log-workspace">

          <div className="visitor-log-toolbar">
            <div>
              <p className="visitor-log-section-label">
                VISITOR DIRECTORY
              </p>

              <h2>All Visitors</h2>

              <p>
                Review registered visitors and their
                latest visit status.
              </p>
            </div>

            <div className="visitor-log-record-count">
              {visitors.length} records
            </div>
          </div>

          {errorMessage ? (
            <div className="visitor-log-error">
              <strong>
                Unable to load visitor data
              </strong>

              <span>{errorMessage}</span>
            </div>
          ) : visitors.length === 0 ? (
            <div className="visitor-log-empty">
              <div className="visitor-log-empty-icon">
                V
              </div>

              <h3>No visitors found</h3>

              <p>
                Visitor records will appear here once
                visitors begin checking in.
              </p>

              <Link href="/visitors/check-in">
                Check In First Visitor
              </Link>
            </div>
          ) : (
            <div className="visitor-log-table-wrapper">
              <table className="visitor-log-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Contact</th>
                    <th>Purpose</th>
                    <th>Host</th>
                    <th>Check-In</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {visitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td>
                        <div className="visitor-log-person">
                          <div className="visitor-log-avatar">
                            {getInitial(
                              visitor.visitor_name
                            )}
                          </div>

                          <div>
                            <strong>
                              {visitor.visitor_name}
                            </strong>

                            <span>
                              {visitor.visitor_email ||
                                "No email provided"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="visitor-log-main-value">
                          {visitor.visitor_phone || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="visitor-log-purpose">
                          {visitor.purpose}
                        </span>
                      </td>

                      <td>
                        <span className="visitor-log-main-value">
                          {visitor.host_name || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="visitor-log-date">
                          {formatDate(
                            visitor.check_in_at
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            visitor.status
                          )}
                        >
                          <span className="visitor-status-dot" />

                          {formatStatus(
                            visitor.status
                          )}
                        </span>
                      </td>

                      <td>
                        <Link
                          href={`/visitors/${visitor.id}`}
                          className="visitor-log-view"
                          aria-label={`View ${visitor.visitor_name}`}
                        >
                          <span>View</span>
                          <span>→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!errorMessage && visitors.length > 0 && (
            <footer className="visitor-log-footer">
              <span>
                Showing {visitors.length} visitor
                {visitors.length === 1 ? "" : "s"}
              </span>

              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}