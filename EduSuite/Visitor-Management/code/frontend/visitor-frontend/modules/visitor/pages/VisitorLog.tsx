"use client";

import Link from "next/link";
import { useVisitorList } from "../hooks/useVisitorList";

export default function VisitorLog() {
  const {
    visitors,
    pagination,
    loading,
    error,
    setPage,
    refresh,
  } = useVisitorList({
    page: 1,
    limit: 20,
  });

  return (
    <main className="visitor-page">
      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Visitor Log</h1>

          <p>
            View and manage visitor activity.
          </p>
        </div>

        <Link href="/visitors/check-in">
          + Check In Visitor
        </Link>
      </header>

      {loading && <p>Loading visitor data...</p>}

      {error && (
        <div role="alert">
          <strong>
            Unable to load visitor data
          </strong>

          <p>{error}</p>

          <button onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <section className="visitor-card">
          <table>
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Phone</th>
                <th>Purpose</th>
                <th>Host</th>
                <th>Check-In</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {visitors.map((visitor) => (
                <tr key={visitor.id}>
                  <td>
                    <strong>
                      {visitor.visitor_name}
                    </strong>

                    <div>
                      {visitor.visitor_email ?? "—"}
                    </div>
                  </td>

                  <td>
                    {visitor.visitor_phone ?? "—"}
                  </td>

                  <td>{visitor.purpose}</td>

                  <td>
                    {visitor.host_name ?? "—"}
                  </td>

                  <td>
                    {new Date(
                      visitor.check_in_at
                    ).toLocaleString("en-IN")}
                  </td>

                  <td>
                    {visitor.status.replaceAll(
                      "_",
                      " "
                    )}
                  </td>

                  <td>
                    <Link
                      href={`/visitors/${visitor.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visitors.length === 0 && (
            <p>No visitors found.</p>
          )}

          {pagination.totalPages > 1 && (
            <nav>
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPage(pagination.page - 1)
                }
              >
                Previous
              </button>

              <span>
                {pagination.page} /{" "}
                {pagination.totalPages}
              </span>

              <button
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
                onClick={() =>
                  setPage(pagination.page + 1)
                }
              >
                Next
              </button>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}