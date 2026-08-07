// src/modules/utilization/components/common/StatusBadge.tsx
//
// One shared badge primitive so Employees, Allocations, and Bench
// never grow independent, visually-conflicting badge styles.

interface StatusBadgeProps {
  label: string;
  className: string; // pass the specific bg/text color classes for this value
}

export default function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
