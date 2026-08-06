"use client";

import { useEffect, useState } from "react";
import {
  Visitor,
  VisitorService,
} from "@/services/visitor.service";

interface PrintPassProps {
  visitorId?: number;
}

export default function PrintPass({
  visitorId,
}: PrintPassProps) {
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

    async function load() {
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
            : "Unable to load visitor pass."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [visitorId]);

  if (!visitorId) {
    return (
      <main className="visitor-page">
        <h1>Print Visitor Pass</h1>
        <p>Select a visitor pass to print.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="visitor-page">
        Loading visitor pass...
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

  if (!visitor?.pass) {
    return (
      <main className="visitor-page">
        <h1>Visitor Pass</h1>
        <p>
          No pass has been issued for this visitor.
        </p>
      </main>
    );
  }

  return (
    <main className="visitor-page">
      <section className="visitor-pass-print">
        <p>VISITOR MANAGEMENT</p>

        <h1>Visitor Pass</h1>

        <h2>{visitor.visitor_name}</h2>

        <p>
          <strong>Pass Code:</strong>{" "}
          {visitor.pass.pass_code}
        </p>

        <p>
          <strong>Host:</strong>{" "}
          {visitor.host_name ?? "—"}
        </p>

        <p>
          <strong>Purpose:</strong>{" "}
          {visitor.purpose}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {visitor.pass.status}
        </p>

        <button
          type="button"
          onClick={() => window.print()}
        >
          Print
        </button>
      </section>
    </main>
  );
}