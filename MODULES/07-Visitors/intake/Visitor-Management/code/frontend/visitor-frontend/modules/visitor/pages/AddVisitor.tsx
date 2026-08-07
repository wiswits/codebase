"use client";

import VisitorRegistrationForm from "../components/VisitorRegistrationForm";

export default function AddVisitor() {
  return (
    <main className="visitor-page">
      <div className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Add Visitor</h1>

          <p>
            Register a new visitor and record their
            visit information.
          </p>
        </div>
      </div>

      <VisitorRegistrationForm />
    </main>
  );
}