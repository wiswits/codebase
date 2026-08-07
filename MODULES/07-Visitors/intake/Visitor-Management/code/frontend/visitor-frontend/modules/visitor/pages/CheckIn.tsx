"use client";

import Link from "next/link";

import VisitorRegistrationForm from "../components/VisitorRegistrationForm";

export default function CheckIn() {
  return (
    <main className="checkin-page">
      <div className="checkin-shell">
        {/* Breadcrumb */}
        <nav
          className="checkin-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link href="/">Home</Link>
          <span>/</span>

          <Link href="/dashboard">
            Dashboard
          </Link>
          <span>/</span>

          <strong>Visitor Check-In</strong>
        </nav>

        {/* Page Header */}
        <header className="checkin-header">
          <div>
            <p className="checkin-eyebrow">
              VISITOR REGISTRATION
            </p>

            <h1>Visitor Check-In</h1>

            <p className="checkin-subtitle">
              Register a visitor, assign their host and
              begin the campus visit lifecycle.
            </p>
          </div>

          <Link
            href="/visitors"
            className="checkin-back-action"
          >
            <span>←</span>
            Visitor Log
          </Link>
        </header>

        {/* Process indicator */}
        <section
          className="checkin-process"
          aria-label="Visitor check-in process"
        >
          <div className="checkin-process-heading">
            <div>
              <span className="checkin-section-label">
                CHECK-IN WORKFLOW
              </span>

              <h2>Register a new visitor</h2>
            </div>

            <span className="checkin-process-status">
              <i />
              Ready for registration
            </span>
          </div>

          <div className="checkin-process-steps">
            <ProcessStep
              number="01"
              title="Visitor Details"
              description="Personal and contact information"
              active
            />

            <ProcessStep
              number="02"
              title="Visit Information"
              description="Purpose and host assignment"
            />

            <ProcessStep
              number="03"
              title="Check-In"
              description="Create the visitor record"
            />
          </div>
        </section>

        {/* Registration Workspace */}
        <section className="checkin-workspace">
          <div className="checkin-workspace-header">
            <div>
              <span className="checkin-section-label">
                VISITOR DETAILS
              </span>

              <h2>Registration Information</h2>

              <p>
                Complete the information below to
                register and check in the visitor.
              </p>
            </div>

            <div className="checkin-secure-label">
              <span>✓</span>
              Secure registration
            </div>
          </div>

          <div className="checkin-form-area">
            <VisitorRegistrationForm />
          </div>
        </section>

        {/* Footer note */}
        <div className="checkin-footer-note">
          <div className="checkin-footer-icon">
            i
          </div>

          <div>
            <strong>
              Visitor Management
            </strong>

            <p>
              Visitor information is recorded through
              the integrated Visitor Management API
              and becomes available immediately in
              the Visitor Log.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProcessStep({
  number,
  title,
  description,
  active = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`checkin-process-step ${
        active
          ? "checkin-process-step-active"
          : ""
      }`}
    >
      <span className="checkin-step-number">
        {number}
      </span>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  );
}