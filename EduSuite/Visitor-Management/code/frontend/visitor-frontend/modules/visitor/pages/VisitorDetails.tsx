"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  Visitor,
  VisitorService,
} from "@/services/visitor.service";

interface VisitorDetailsProps {
  visitorId?: number;
}

export default function VisitorDetails({
  visitorId,
}: VisitorDetailsProps) {
  const [visitor, setVisitor] =
    useState<Visitor | null>(null);

  const [loading, setLoading] =
    useState(Boolean(visitorId));

  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!visitorId) {
      return;
    }

    async function loadVisitor() {
      setLoading(true);
      setError(null);

      try {
        const response =
          await VisitorService.get(visitorId!);

        setVisitor(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load visitor."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadVisitor();
  }, [visitorId]);

  if (!visitorId) {
    return (
      <main className="visitor-page">
        <Link href="/visitors">
          ← Visitor Log
        </Link>

        <h1>Visitor Details</h1>

        <p>No visitor selected.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="visitor-page">
        Loading visitor details...
      </main>
    );
  }

  if (error) {
    return (
      <main className="visitor-page">
        <div role="alert">{error}</div>
      </main>
    );
  }

  if (!visitor) {
    return null;
  }

  return (
    <main className="visitor-page">
      <Link href="/visitors">
        ← Visitor Log
      </Link>

      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>{visitor.visitor_name}</h1>

          <p>Visitor #{visitor.id}</p>
        </div>
      </header>

      <section className="visitor-card">
        <h2>Visitor Information</h2>

        <Details
          label="Phone"
          value={visitor.visitor_phone}
        />

        <Details
          label="Email"
          value={visitor.visitor_email}
        />

        <Details
          label="Visitor Type"
          value={visitor.visitor_type}
        />

        <h2>Visit Information</h2>

        <Details
          label="Purpose"
          value={visitor.purpose}
        />

        <Details
          label="Host"
          value={visitor.host_name}
        />

        <Details
          label="Status"
          value={visitor.status.replaceAll(
            "_",
            " "
          )}
        />

        <Details
          label="Check-In"
          value={new Date(
            visitor.check_in_at
          ).toLocaleString("en-IN")}
        />

        <Details
          label="Check-Out"
          value={
            visitor.check_out_at
              ? new Date(
                  visitor.check_out_at
                ).toLocaleString("en-IN")
              : "—"
          }
        />

        <h2>Visitor Pass</h2>

        {visitor.pass ? (
          <>
            <Details
              label="Pass Code"
              value={visitor.pass.pass_code}
            />

            <Details
              label="Pass Status"
              value={visitor.pass.status}
            />
          </>
        ) : (
          <p>No visitor pass issued.</p>
        )}
      </section>
    </main>
  );
}

function Details({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="visitor-detail-row">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}