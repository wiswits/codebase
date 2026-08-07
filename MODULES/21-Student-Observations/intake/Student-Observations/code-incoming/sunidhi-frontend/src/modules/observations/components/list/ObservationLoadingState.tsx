// src/modules/observations/components/list/ObservationLoadingState.tsx

export default function ObservationLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="animate-pulse space-y-3"
      role="status"
      aria-label="Loading observations"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-[8px] border border-gray-100 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-100" />
          </div>
          <div className="mt-3 h-3 w-full rounded bg-gray-100" />
          <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
