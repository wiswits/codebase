import { VisitorPass } from "@/services/visitor.service";

interface PassCardProps {
  pass: VisitorPass;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PassCard({
  pass,
}: PassCardProps) {
  return (
    <div
      style={{
        border: "1px solid #d8e0eb",
        borderRadius: 16,
        background: "#fff",
        padding: 24,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color: "#071f4e",
        }}
      >
        Visitor Pass
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <Row
            label="Pass Code"
            value={pass.pass_code}
          />

          <Row
            label="Status"
            value={pass.status}
          />

          <Row
            label="Issued At"
            value={formatDate(pass.issued_at)}
          />

          <Row
            label="Expires At"
            value={formatDate(pass.expires_at)}
          />

          <Row
            label="Revoked At"
            value={formatDate(pass.revoked_at)}
          />
        </tbody>
      </table>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <tr>
      <td
        style={{
          padding: "12px 0",
          color: "#60708c",
          width: 150,
        }}
      >
        {label}
      </td>

      <td
        style={{
          padding: "12px 0",
          fontWeight: 700,
          color: "#071f4e",
        }}
      >
        {value}
      </td>
    </tr>
  );
}