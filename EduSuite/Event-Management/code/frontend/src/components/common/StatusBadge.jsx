import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  published: {
    label: "Published",
    className: "status-published",
    icon: CheckCircle2,
  },

  draft: {
    label: "Draft",
    className: "status-draft",
    icon: CircleDashed,
  },

  completed: {
    label: "Completed",
    className: "status-completed",
    icon: CheckCircle2,
  },

  cancelled: {
    label: "Cancelled",
    className: "status-cancelled",
    icon: XCircle,
  },

  pending: {
    label: "Pending",
    className: "status-pending",
    icon: Clock3,
  },

  going: {
    label: "Going",
    className: "status-going",
    icon: CheckCircle2,
  },

  declined: {
    label: "Declined",
    className: "status-declined",
    icon: XCircle,
  },

  maybe: {
    label: "Maybe",
    className: "status-maybe",
    icon: AlertCircle,
  },

  reserved: {
    label: "Reserved",
    className: "status-reserved",
    icon: CheckCircle2,
  },
};

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StatusBadge({
  status,
  showIcon = true,
  className = "",
}) {
  const normalizedStatus = String(
    status || "unknown"
  ).toLowerCase();

  const config = STATUS_CONFIG[normalizedStatus] || {
    label: formatStatus(status),
    className: "status-default",
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <span
      className={[
        "status-badge",
        config.className,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showIcon && (
        <Icon
          size={13}
          aria-hidden="true"
        />
      )}

      <span>{config.label}</span>
    </span>
  );
}