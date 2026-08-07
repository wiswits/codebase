import type { VisitorStatus } from "@/services/visitor.service";

type SupportedStatus =
  | VisitorStatus
  | "active"
  | "expired"
  | "revoked";

interface StatusBadgeProps {
  status: SupportedStatus;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getStatusStyle(status: SupportedStatus) {
  switch (status) {
    case "checked_in":
    case "active":
      return {
        background: "#ecfdf3",
        color: "#027a48",
        border: "1px solid #abefc6",
      };

    case "checked_out":
      return {
        background: "#eff8ff",
        color: "#175cd3",
        border: "1px solid #b2ddff",
      };

    case "cancelled":
    case "revoked":
      return {
        background: "#fff1f0",
        color: "#b42318",
        border: "1px solid #fecdca",
      };

    case "expired":
      return {
        background: "#f5f5f5",
        color: "#475467",
        border: "1px solid #d0d5dd",
      };

    default:
      return {
        background: "#f7f4ec",
        color: "#071f4e",
        border: "1px solid #e1e6ee",
      };
  }
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const statusStyle = getStatusStyle(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 11px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        ...statusStyle,
      }}
    >
      {formatStatus(status)}
    </span>
  );
}