"use client";

import Link from "next/link";
import { useVisitorList } from "../hooks/useVisitorList";

export default function VisitorHistory() {
  const {
    visitors,
    loading,
    error,
    refresh,
  } = useVisitorList({
    page: 1,
    limit: 50,
  });

  return (
    <main className="visitor-page">
      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Visitor History</h1>

          <p>
            Review previous visitor activity.
          </p>
        </div>
      </header>

      {loading && <p>Loading history...</p>}

      {error && (
        <div role="alert">
          <p>{error}</p>

          <button onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <section className="visitor-card">
          {visitors.length === 0 ? (
            <p>No visitor history found.</p>
          ) : (
            visitors.map((visitor) => (
              <article
                key={visitor.id}
                className="visitor-history-item"
              >
                <div>
                  <strong>
                    {visitor.visitor_name}
                  </strong>

                  <p>{visitor.purpose}</p>

                  <small>
                    {new Date(
                      visitor.check_in_at
                    ).toLocaleString("en-IN")}
                  </small>
                </div>

                <div>
                  <span>
                    {visitor.status.replaceAll(
                      "_",
                      " "
                    )}
                  </span>

                  <Link
                    href={`/visitors/${visitor.id}`}
                  >
                    View
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
}