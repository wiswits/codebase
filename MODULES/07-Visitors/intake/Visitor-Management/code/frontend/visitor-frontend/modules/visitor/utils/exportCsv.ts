import type { Visitor } from "../types/visitor.types";

function escapeCsvValue(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function visitorsToCsv(
  visitors: Visitor[]
): string {
  const headers = [
    "Visitor ID",
    "Visitor Name",
    "Phone",
    "Email",
    "Visitor Type",
    "Purpose",
    "Host ID",
    "Host Name",
    "Check In",
    "Check Out",
    "Status",
  ];

  const rows = visitors.map((visitor) => [
    visitor.id,
    visitor.visitor_name,
    visitor.visitor_phone,
    visitor.visitor_email,
    visitor.visitor_type,
    visitor.purpose,
    visitor.host_id,
    visitor.host_name,
    visitor.check_in_at,
    visitor.check_out_at,
    visitor.status,
  ]);

  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(",")
    ),
  ].join("\n");
}

export function exportVisitorsCsv(
  visitors: Visitor[],
  filename = "visitor-report.csv"
): void {
  if (typeof window === "undefined") {
    return;
  }

  const csv = visitorsToCsv(visitors);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}