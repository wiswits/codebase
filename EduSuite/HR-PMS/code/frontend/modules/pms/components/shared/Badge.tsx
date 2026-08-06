import type { ReactNode } from "react";

export type BadgeTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  default: "bg-slate-100 text-slate-700 border border-slate-200",
  primary: "bg-[#EEF3F8] text-[#1F3A5F] border border-[#D6E4F2]",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-sky-50 text-sky-700 border border-sky-200",
};

export function Badge({
  children,
  tone = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* -----------------------------
   Compatibility helpers
--------------------------------*/

export function cycleStatusTone(status: string): BadgeTone {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "primary";
    case "draft":
      return "warning";
    case "cancelled":
      return "danger";
    case "in_review":
      return "info";
    default:
      return "default";
  }
}

export function goalStatusTone(status: string): BadgeTone {
  switch (status) {
    case "completed":
      return "success";
    case "active":
    case "in_progress":
      return "primary";
    case "pending":
      return "warning";
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}

export function reviewStatusTone(status: string): BadgeTone {
  switch (status) {
    case "approved":
      return "success";
    case "submitted":
      return "primary";
    case "draft":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}