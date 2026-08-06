import type {
  Visitor,
  VisitorPass,
} from "@/services/visitor.service";

interface PassPreviewProps {
  visitor: Visitor;
  pass: VisitorPass;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PassPreview({
  visitor,
  pass,
}: PassPreviewProps) {
  return (
    <section style={wrapperStyle}>
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>VISITOR PASS</p>

          <h2 style={nameStyle}>
            {visitor.visitor_name}
          </h2>

          <p style={typeStyle}>
            {visitor.visitor_type || "Visitor"}
          </p>
        </div>

        <span style={statusStyle}>
          {pass.status.toUpperCase()}
        </span>
      </div>

      <div style={codeSectionStyle}>
        <span style={labelStyle}>PASS CODE</span>

        <strong style={codeStyle}>
          {pass.pass_code}
        </strong>
      </div>

      <div style={gridStyle}>
        <Detail
          label="Host"
          value={visitor.host_name || "—"}
        />

        <Detail
          label="Purpose"
          value={visitor.purpose}
        />

        <Detail
          label="Check-In"
          value={formatDate(visitor.check_in_at)}
        />

        <Detail
          label="Issued At"
          value={formatDate(pass.issued_at)}
        />

        <Detail
          label="Expires At"
          value={formatDate(pass.expires_at)}
        />
      </div>
    </section>
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
    <div style={detailStyle}>
      <span style={detailLabelStyle}>
        {label}
      </span>

      <strong style={detailValueStyle}>
        {value}
      </strong>
    </div>
  );
}

const wrapperStyle = {
  overflow: "hidden",
  width: "100%",
  border: "1px solid #d8e0eb",
  borderRadius: 18,
  background: "#ffffff",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  padding: 28,
  background: "#0b2859",
  color: "#ffffff",
};

const eyebrowStyle = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1,
};

const nameStyle = {
  margin: "8px 0 5px",
  fontSize: 26,
};

const typeStyle = {
  margin: 0,
  opacity: 0.8,
};

const statusStyle = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "#ffffff",
  color: "#0b2859",
  fontSize: 12,
  fontWeight: 700,
};

const codeSectionStyle = {
  padding: 28,
  textAlign: "center" as const,
  borderBottom: "1px solid #e1e6ee",
};

const labelStyle = {
  display: "block",
  marginBottom: 10,
  color: "#60708c",
  fontSize: 12,
  fontWeight: 700,
};

const codeStyle = {
  color: "#071f4e",
  fontSize: 25,
  letterSpacing: 2,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  padding: 28,
};

const detailStyle = {
  padding: 16,
  border: "1px solid #d8e0eb",
  borderRadius: 10,
};

const detailLabelStyle = {
  display: "block",
  marginBottom: 8,
  color: "#60708c",
  fontSize: 12,
};

const detailValueStyle = {
  color: "#071f4e",
  fontSize: 14,
  lineHeight: 1.5,
};

