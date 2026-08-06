// src/modules/utilization/components/common/LoadingState.tsx
//
// Shared across Employees, Allocations, Capacity, Bench, and Reports
// so all five areas present one consistent loading pattern
// (Master Architecture Section 5: "Shared components should be
// reused instead of recreated independently inside every module").

interface LoadingStateProps {
  rows?: number;
  label?: string;
}

export default function LoadingState({ rows = 4, label = "Loading…" }: LoadingStateProps) {
  return (
    <div className="animate-pulse space-y-3 p-4" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-gray-100" />
      ))}
    </div>
  );
}
