// src/modules/payroll/components/common/LoadingState.tsx

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
