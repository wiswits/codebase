import type { Visitor } from "@/services/visitor.service";

import StatusBadge from "./StatusBadge";

interface VisitSummaryProps {
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

function getDuration(
  startValue: string,
  endValue: string | null
) {
  const start = new Date(startValue);

  const end = endValue
    ? new Date(endValue)
    : new Date();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return "—";
  }

  const milliseconds =
    end.getTime() - start.getTime();

  if (milliseconds < 0) {
    return "—";
  }

  const minutes = Math.floor(
    milliseconds / 60000
  );

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

export default function VisitSummary({
  visitor,
}: VisitSummaryProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>
            Visit Summary
          </h2>

          <p style={descriptionStyle}>
            Overview of the visitor&apos;s visit.
          </p>
        </div>

        <StatusBadge status={visitor.status} />
      </div>

      <div style={gridStyle}>
        <Summary
          label="Visitor"
          value={visitor.visitor_name}
        />

        <Summary
          label="Host"
          value={visitor.host_name || "—"}
        />

        <Summary
          label="Purpose"
          value={visitor.purpose}
        />

        <Summary
          label="Check-In"
          value={formatDate(
            visitor.check_in_at
          )}
        />

        <Summary
          label="Check-Out"
          value={formatDate(
            visitor.check_out_at
          )}
        />

        <Summary
          label="Visit Duration"
          value={getDuration(
            visitor.check_in_at,
            visitor.check_out_at
          )}
        />

        <Summary
          label="Pass Code"
          value={
            visitor.pass?.pass_code || "Not issued"
          }
        />

        <Summary
          label="Pass Status"
          value={
            visitor.pass?.status || "Not issued"
          }
        />
      </div>
    </section>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={itemStyle}>
      <span style={labelStyle}>
        {label}
      </span>

      <strong style={valueStyle}>
        {value}
      </strong>
    </div>
  );
}

const cardStyle = {
  padding: 26,
  border: "1px solid #d8e0eb",
  borderRadius: 16,
  background: "#ffffff",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: 16,
  marginBottom: 24,
};

const titleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 20,
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#60708c",
  fontSize: 13,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 15,
};

const itemStyle = {
  minHeight: 70,
  padding: 15,
  border: "1px solid #d8e0eb",
  borderRadius: 10,
};

const labelStyle = {
  display: "block",
  marginBottom: 8,
  color: "#60708c",
  fontSize: 12,
};

const valueStyle = {
  color: "#071f4e",
  fontSize: 14,
  lineHeight: 1.5,
};