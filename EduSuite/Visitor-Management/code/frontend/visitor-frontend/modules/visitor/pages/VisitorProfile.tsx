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

interface VisitorProfileProps {
  visitorId?: number;
}

export default function VisitorProfile({
  visitorId,
}: VisitorProfileProps) {
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
            : "Unable to load visitor profile."
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
        <h1>Visitor Profile</h1>
        <p>No visitor selected.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="visitor-page">
        Loading visitor profile...
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
            VISITOR PROFILE
          </p>

          <h1>{visitor.visitor_name}</h1>

          <p>
            {visitor.visitor_type ?? "Visitor"}
          </p>
        </div>
      </header>

      <section className="visitor-card">
        <ProfileItem
          label="Visitor ID"
          value={String(visitor.id)}
        />

        <ProfileItem
          label="Phone"
          value={visitor.visitor_phone}
        />

        <ProfileItem
          label="Email"
          value={visitor.visitor_email}
        />

        <ProfileItem
          label="Host"
          value={visitor.host_name}
        />

        <ProfileItem
          label="Purpose"
          value={visitor.purpose}
        />

        <ProfileItem
          label="Status"
          value={visitor.status.replaceAll(
            "_",
            " "
          )}
        />

        <ProfileItem
          label="Check-In"
          value={new Date(
            visitor.check_in_at
          ).toLocaleString("en-IN")}
        />

        <ProfileItem
          label="Check-Out"
          value={
            visitor.check_out_at
              ? new Date(
                  visitor.check_out_at
                ).toLocaleString("en-IN")
              : "—"
          }
        />
      </section>
    </main>
  );
}

function ProfileItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="visitor-profile-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}