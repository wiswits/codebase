"use client";

import Link from "next/link";
import { useVisitorList } from "../hooks/useVisitorList";

export default function VisitorList() {
  const {
    visitors,
    pagination,
    loading,
    error,
    filters,
    setSearch,
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

          <h1>Visitors</h1>

          <p>
            Search and manage visitor activity.
          </p>
        </div>

        <Link href="/visitors/check-in">
          + Check In Visitor
        </Link>
      </header>

      <input
        type="search"
        value={filters.search ?? ""}
        placeholder="Search visitors..."
        onChange={(event) =>
          setSearch(event.target.value)
        }
      />

      {loading && <p>Loading visitors...</p>}

      {error && (
        <div role="alert">
          <p>{error}</p>

          <button onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="visitor-card">
            {visitors.length === 0 ? (
              <p>No visitors found.</p>
            ) : (
              visitors.map((visitor) => (
                <article
                  key={visitor.id}
                  className="visitor-list-row"
                >
                  <div>
                    <strong>
                      {visitor.visitor_name}
                    </strong>

                    <p>
                      {visitor.visitor_email ?? "—"}
                    </p>
                  </div>

                  <span>{visitor.purpose}</span>

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
                </article>
              ))
            )}
          </section>

          {pagination.totalPages > 1 && (
            <nav aria-label="Visitor pagination">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPage(pagination.page - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of{" "}
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
        </>
      )}
    </main>
  );
}