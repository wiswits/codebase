import Link from "next/link";

import type { Visitor } from "@/services/visitor.service";

import StatusBadge from "./StatusBadge";

interface VisitorTableProps {
  visitors: Visitor[];
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

export default function VisitorTable({
  visitors,
}: VisitorTableProps) {
  if (visitors.length === 0) {
    return (
      <div style={emptyStyle}>
        No visitors found.
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr style={headerRowStyle}>
            <th style={headerCellStyle}>
              Visitor
            </th>

            <th style={headerCellStyle}>
              Phone
            </th>

            <th style={headerCellStyle}>
              Purpose
            </th>

            <th style={headerCellStyle}>
              Host
            </th>

            <th style={headerCellStyle}>
              Check-In
            </th>

            <th style={headerCellStyle}>
              Status
            </th>

            <th style={headerCellStyle}>
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {visitors.map((visitor) => (
            <tr
              key={visitor.id}
              style={rowStyle}
            >
              <td style={cellStyle}>
                <strong style={nameStyle}>
                  {visitor.visitor_name}
                </strong>

                <span style={secondaryStyle}>
                  {visitor.visitor_email || "—"}
                </span>
              </td>

              <td style={cellStyle}>
                {visitor.visitor_phone || "—"}
              </td>

              <td style={cellStyle}>
                {visitor.purpose}
              </td>

              <td style={cellStyle}>
                {visitor.host_name || "—"}
              </td>

              <td style={cellStyle}>
                {formatDate(
                  visitor.check_in_at
                )}
              </td>

              <td style={cellStyle}>
                <StatusBadge
                  status={visitor.status}
                />
              </td>

              <td style={cellStyle}>
                <Link
                  href={`/visitors/${visitor.id}`}
                  style={linkStyle}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const wrapperStyle = {
  width: "100%",
  overflowX: "auto" as const,
  border: "1px solid #d8e0eb",
  borderRadius: 14,
  background: "#ffffff",
};

const tableStyle = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse" as const,
};

const headerRowStyle = {
  background: "#0b2859",
};

const headerCellStyle = {
  padding: "16px 18px",
  color: "#ffffff",
  textAlign: "left" as const,
  fontSize: 13,
  fontWeight: 700,
};

const rowStyle = {
  borderBottom: "1px solid #e1e6ee",
};

const cellStyle = {
  padding: "17px 18px",
  color: "#071f4e",
  fontSize: 13,
  verticalAlign: "middle" as const,
};

const nameStyle = {
  display: "block",
  marginBottom: 5,
};

const secondaryStyle = {
  display: "block",
  color: "#60708c",
  fontSize: 12,
};

const linkStyle = {
  color: "#071f4e",
  textDecoration: "none",
  fontWeight: 700,
};

const emptyStyle = {
  padding: 36,
  border: "1px solid #d8e0eb",
  borderRadius: 14,
  background: "#ffffff",
  color: "#60708c",
  textAlign: "center" as const,
};