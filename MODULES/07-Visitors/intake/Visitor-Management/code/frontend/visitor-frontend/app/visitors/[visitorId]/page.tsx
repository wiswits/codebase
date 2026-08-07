import Link from "next/link";

import {
  VisitorService,
  type Visitor,
} from "@/services/visitor.service";

import VisitorActions from "@/components/VisitorActions";
import VisitorPassActions from "@/components/visitor/VisitorPassActions";

function formatDate(value: string | null | undefined) {
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
  if (status === "checked_in") {
    return "visitor-detail-status visitor-detail-status-active";
  }

  if (status === "cancelled") {
    return "visitor-detail-status visitor-detail-status-cancelled";
  }

  return "visitor-detail-status visitor-detail-status-completed";
}

function LifecycleItem({
  number,
  title,
  description,
  active,
}: {
  number: string;
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <div
      className={`visitor-detail-lifecycle-item ${
        active ? "is-active" : ""
      }`}
    >
      <span className="visitor-detail-lifecycle-number">
        {number}
      </span>

      <strong>{title}</strong>

      <p>{description}</p>
    </div>
  );
}

export default async function VisitorDetailsPage({
  params,
}: {
  params: Promise<{ visitorId: string }>;
}) {
  const { visitorId } = await params;

  const id = Number(visitorId);

  /* ---------------------------------------------------------
     INVALID VISITOR ID
     --------------------------------------------------------- */

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <main className="visitor-detail-page">
        <div className="visitor-detail-shell">
          <div className="visitor-detail-error">
            <strong>Invalid visitor ID</strong>

            <p>
              The visitor ID in the URL is not valid.
            </p>
          </div>

          <Link
            href="/visitors"
            className="visitor-detail-back"
          >
            ← Back to Visitor Log
          </Link>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------
     LOAD VISITOR
     Important: JSX is NOT returned from inside try/catch.
     --------------------------------------------------------- */

  let visitor: Visitor | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await VisitorService.get(id);

    visitor = response.data;
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load visitor.";
  }

  /* ---------------------------------------------------------
     API ERROR / VISITOR NOT FOUND
     --------------------------------------------------------- */

  if (errorMessage || !visitor) {
    return (
      <main className="visitor-detail-page">
        <div className="visitor-detail-shell">
          <div className="visitor-detail-breadcrumb">
            <Link href="/">Home</Link>

            <span>/</span>

            <Link href="/visitors">
              Visitor Log
            </Link>

            <span>/</span>

            <strong>Visitor Details</strong>
          </div>

          <div className="visitor-detail-error">
            <strong>
              Unable to load visitor
            </strong>

            <p>
              {errorMessage ??
                "Visitor record could not be found."}
            </p>
          </div>

          <Link
            href="/visitors"
            className="visitor-detail-back"
          >
            ← Back to Visitor Log
          </Link>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------
     DERIVED VISITOR INFORMATION
     --------------------------------------------------------- */

  const pass = visitor.pass;

  const isCheckedIn =
    visitor.status === "checked_in";

  const isCheckedOut =
    visitor.status === "checked_out";

  const isCancelled =
    visitor.status === "cancelled";

  const hasPass = Boolean(pass);

  const isPassActive =
    pass?.status === "active";

  /* ---------------------------------------------------------
     MAIN VISITOR DETAILS WORKSPACE
     --------------------------------------------------------- */

  return (
    <main className="visitor-detail-page">
      <div className="visitor-detail-shell">

        {/* Breadcrumb */}

        <nav
          className="visitor-detail-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link href="/">Home</Link>

          <span>/</span>

          <Link href="/visitors">
            Visitor Log
          </Link>

          <span>/</span>

          <strong>
            {visitor.visitor_name}
          </strong>
        </nav>

        {/* Page Header */}

        <header className="visitor-detail-header">
          <div>
            <p className="visitor-detail-eyebrow">
              VISITOR MANAGEMENT
            </p>

            <h1>Visitor Details</h1>

            <p>
              Review visitor information, visit
              activity, pass status and lifecycle
              actions.
            </p>
          </div>

          <Link
            href="/visitors"
            className="visitor-detail-header-back"
          >
            ← Visitor Log
          </Link>
        </header>

        {/* Visitor Identity */}

        <section className="visitor-detail-identity">
          <div className="visitor-detail-person">
            <div className="visitor-detail-avatar">
              {getInitial(visitor.visitor_name)}
            </div>

            <div>
              <div className="visitor-detail-person-meta">
                <h2>
                  {visitor.visitor_name}
                </h2>

                <span
                  className={getStatusClass(
                    visitor.status
                  )}
                >
                  <span />

                  {formatStatus(
                    visitor.status
                  )}
                </span>
              </div>

              <span className="visitor-detail-id">
                VISITOR #{visitor.id}
              </span>

              <p>
                {visitor.visitor_email ||
                  "No email provided"}
              </p>
            </div>
          </div>

          <div className="visitor-detail-identity-summary">
            <div>
              <span>Host</span>

              <strong>
                {visitor.host_name || "—"}
              </strong>
            </div>

            <div>
              <span>Check-In</span>

              <strong>
                {formatDate(
                  visitor.check_in_at
                )}
              </strong>
            </div>

            <div>
              <span>Pass</span>

              <strong>
                {pass
                  ? formatStatus(pass.status)
                  : "Not Issued"}
              </strong>
            </div>
          </div>
        </section>

        {/* Main Workspace */}

        <div className="visitor-detail-grid">

          {/* LEFT COLUMN */}

          <div className="visitor-detail-main">

            {/* Visitor Information */}

            <section className="visitor-detail-card">
              <div className="visitor-detail-card-heading">
                <div>
                  <p>PROFILE</p>

                  <h2>
                    Visitor Information
                  </h2>
                </div>

                <span>
                  ID #{visitor.id}
                </span>
              </div>

              <div className="visitor-detail-info-grid">

                <div className="visitor-detail-info-item">
                  <span>Visitor Name</span>

                  <strong>
                    {visitor.visitor_name}
                  </strong>
                </div>

                <div className="visitor-detail-info-item">
                  <span>Phone Number</span>

                  <strong>
                    {visitor.visitor_phone ||
                      "—"}
                  </strong>
                </div>

                <div className="visitor-detail-info-item">
                  <span>Email Address</span>

                  <strong>
                    {visitor.visitor_email ||
                      "—"}
                  </strong>
                </div>

                <div className="visitor-detail-info-item">
                  <span>Visitor Type</span>

                  <strong>
                    {visitor.visitor_type
                      ? formatStatus(
                          visitor.visitor_type
                        )
                      : "—"}
                  </strong>
                </div>

                <div className="visitor-detail-info-item">
                  <span>Host</span>

                  <strong>
                    {visitor.host_name ||
                      "—"}
                  </strong>
                </div>

                <div className="visitor-detail-info-item">
                  <span>Current Status</span>

                  <strong>
                    {formatStatus(
                      visitor.status
                    )}
                  </strong>
                </div>

                <div className="visitor-detail-info-item">
                  <span>Check-In Time</span>

                  <strong>
                    {formatDate(
                      visitor.check_in_at
                    )}
                  </strong>
                </div>

                <div className="visitor-detail-info-item">
                  <span>Check-Out Time</span>

                  <strong>
                    {formatDate(
                      visitor.check_out_at
                    )}
                  </strong>
                </div>
              </div>

              <div className="visitor-detail-purpose">
                <span>Purpose of Visit</span>

                <p>
                  {visitor.purpose ||
                    "No visit purpose provided."}
                </p>
              </div>
            </section>

            {/* Visitor Lifecycle */}

            <section className="visitor-detail-card">
              <div className="visitor-detail-card-heading">
                <div>
                  <p>ACTIVITY</p>

                  <h2>
                    Visitor Lifecycle
                  </h2>
                </div>

                <span>
                  {formatStatus(
                    visitor.status
                  )}
                </span>
              </div>

              <div className="visitor-detail-timeline">
                <LifecycleItem
                  number="01"
                  title="Registered"
                  description="Visitor record created."
                  active
                />

                <LifecycleItem
                  number="02"
                  title="Checked In"
                  description={
                    visitor.check_in_at
                      ? formatDate(
                          visitor.check_in_at
                        )
                      : "Awaiting check-in."
                  }
                  active={
                    isCheckedIn ||
                    isCheckedOut
                  }
                />

                <LifecycleItem
                  number="03"
                  title="Pass"
                  description={
                    hasPass
                      ? "Visitor pass issued."
                      : "Pass not issued."
                  }
                  active={hasPass}
                />

                <LifecycleItem
                  number="04"
                  title={
                    isCancelled
                      ? "Cancelled"
                      : "Checked Out"
                  }
                  description={
                    isCancelled
                      ? "Visit cancelled."
                      : visitor.check_out_at
                        ? formatDate(
                            visitor.check_out_at
                          )
                        : "Visit currently active."
                  }
                  active={
                    isCheckedOut ||
                    isCancelled
                  }
                />
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}

          <aside className="visitor-detail-sidebar">

            {/* Pass Management */}

            <section className="visitor-detail-card">
              <div className="visitor-detail-card-heading">
                <div>
                  <p>ACCESS</p>

                  <h2>
                    Visitor Pass
                  </h2>
                </div>

                <span>
                  {hasPass
                    ? formatStatus(
                        pass!.status
                      )
                    : "NO PASS"}
                </span>
              </div>

              {pass ? (
                <>
                  <div className="visitor-detail-pass-preview">
                    <span>
                      WISWITS VISITOR PASS
                    </span>

                    <strong>
                      {pass.pass_code}
                    </strong>

                    <p>
                      {visitor.visitor_name}
                    </p>

                    <div>
                      {isPassActive
                        ? "Active Pass"
                        : formatStatus(
                            pass.status
                          )}
                    </div>
                  </div>

                  <Link
                    href={`/visitors/${visitor.id}/pass`}
                    className="visitor-detail-view-pass"
                  >
                    View Visitor Pass
                  </Link>
                </>
              ) : (
                <div className="visitor-detail-no-pass">
                  <div>+</div>

                  <strong>
                    No pass issued
                  </strong>

                  <p>
                    Generate a visitor pass for
                    controlled access during the
                    visit.
                  </p>
                </div>
              )}

              <div className="visitor-detail-action-space">
                <VisitorPassActions
  visitorId={visitor.id}
  visitorStatus={visitor.status}
/>
              </div>
            </section>

            {/* Visitor Actions */}

            <section className="visitor-detail-card">
              <div className="visitor-detail-card-heading">
                <div>
                  <p>OPERATIONS</p>

                  <h2>
                    Visitor Actions
                  </h2>
                </div>
              </div>

              <p className="visitor-detail-action-copy">
                Manage the current visitor lifecycle
                using the available actions below.
              </p>

              <VisitorActions
  visitorId={visitor.id}
  status={visitor.status}
/>
            </section>

            {/* API Status */}

            <div className="visitor-detail-system">
              <div>
                <span className="visitor-detail-system-dot" />

                <div>
                  <strong>
                    Visitor Management API
                  </strong>

                  <p>
                    Visitor record loaded
                    successfully
                  </p>
                </div>
              </div>

              <span>CONNECTED</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}