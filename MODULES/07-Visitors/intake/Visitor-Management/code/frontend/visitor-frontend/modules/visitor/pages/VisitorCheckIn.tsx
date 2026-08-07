"use client";

import VisitorRegistrationForm from "../components/VisitorRegistrationForm";

export default function VisitorCheckIn() {
  return (
    <main className="visitor-page">
      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Check In Visitor</h1>

          <p>
            Enter visitor and visit information to
            begin a new visit.
          </p>
        </div>
      </header>

      <VisitorRegistrationForm />
    </main>
  );
}