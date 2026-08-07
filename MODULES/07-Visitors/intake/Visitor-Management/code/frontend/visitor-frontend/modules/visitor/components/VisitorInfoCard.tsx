import type { Visitor } from "@/services/visitor.service";
import StatusBadge from "./StatusBadge";

interface VisitorInfoCardProps {
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

export default function VisitorInfoCard({
  visitor,
}: VisitorInfoCardProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>
            VISITOR INFORMATION
          </p>

          <h2 style={titleStyle}>
            {visitor.visitor_name}
          </h2>

          <p style={subtitleStyle}>
            Visitor ID #{visitor.id}
          </p>
        </div>

        <StatusBadge status={visitor.status} />
      </div>

      <div style={gridStyle}>
        <Info
          label="Phone Number"
          value={visitor.visitor_phone}
        />

        <Info
          label="Email Address"
          value={visitor.visitor_email}
        />

        <Info
          label="Visitor Type"
          value={visitor.visitor_type}
        />

        <Info
          label="Host Name"
          value={visitor.host_name}
        />

        <Info
          label="Host ID"
          value={String(visitor.host_id)}
        />

        <Info
          label="Check-In"
          value={formatDate(visitor.check_in_at)}
        />

        <Info
          label="Check-Out"
          value={formatDate(visitor.check_out_at)}
        />

        <Info
          label="Purpose"
          value={visitor.purpose}
        />
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div style={infoStyle}>
      <span style={labelStyle}>{label}</span>

      <strong style={valueStyle}>
        {value || "—"}
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
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
  gap: 18,
  marginBottom: 26,
};

const eyebrowStyle = {
  margin: "0 0 7px",
  color: "#c9922e",
  fontSize: 12,
  fontWeight: 700,
};

const titleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 24,
};

const subtitleStyle = {
  margin: "7px 0 0",
  color: "#60708c",
  fontSize: 13,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 16,
};

const infoStyle = {
  minHeight: 74,
  padding: 16,
  border: "1px solid #d8e0eb",
  borderRadius: 11,
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
  wordBreak: "break-word" as const,
};