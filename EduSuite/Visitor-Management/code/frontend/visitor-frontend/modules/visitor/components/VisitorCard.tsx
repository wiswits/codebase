import Link from "next/link";

import type { Visitor } from "@/services/visitor.service";

import StatusBadge from "./StatusBadge";

interface VisitorCardProps {
  visitor: Visitor;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function VisitorCard({
  visitor,
}: VisitorCardProps) {
  return (
    <article style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={nameStyle}>
            {visitor.visitor_name}
          </h3>

          <p style={typeStyle}>
            {visitor.visitor_type || "Visitor"}
          </p>
        </div>

        <StatusBadge status={visitor.status} />
      </div>

      <div style={detailsStyle}>
        <Detail
          label="Phone"
          value={visitor.visitor_phone || "—"}
        />

        <Detail
          label="Email"
          value={visitor.visitor_email || "—"}
        />

        <Detail
          label="Host"
          value={visitor.host_name || "—"}
        />

        <Detail
          label="Check-In"
          value={formatDate(visitor.check_in_at)}
        />
      </div>

      <div style={purposeStyle}>
        <span style={labelStyle}>
          Purpose
        </span>

        <p style={purposeTextStyle}>
          {visitor.purpose}
        </p>
      </div>

      <div style={footerStyle}>
        <Link
          href={`/visitors/${visitor.id}`}
          style={viewButtonStyle}
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>

      <div style={valueStyle}>{value}</div>
    </div>
  );
}

const cardStyle = {
  width: "100%",
  padding: 22,
  border: "1px solid #d8e0eb",
  borderRadius: 16,
  background: "#ffffff",
  boxSizing: "border-box" as const,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const nameStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 18,
};

const typeStyle = {
  margin: "6px 0 0",
  color: "#60708c",
  fontSize: 13,
};

const detailsStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 18,
  marginTop: 22,
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  color: "#60708c",
  fontSize: 12,
};

const valueStyle = {
  color: "#071f4e",
  fontSize: 14,
  fontWeight: 600,
  wordBreak: "break-word" as const,
};

const purposeStyle = {
  marginTop: 20,
  padding: 15,
  borderRadius: 10,
  background: "#f8f5ed",
};

const purposeTextStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 14,
  lineHeight: 1.5,
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 20,
  paddingTop: 18,
  borderTop: "1px solid #e1e6ee",
};

const viewButtonStyle = {
  padding: "10px 16px",
  borderRadius: 9,
  background: "#0b2859",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
};