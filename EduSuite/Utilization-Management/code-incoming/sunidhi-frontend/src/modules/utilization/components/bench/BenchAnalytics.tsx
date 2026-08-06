// src/modules/utilization/components/bench/BenchAnalytics.tsx
//
// Summary stats for the Bench Management screen — count, average
// bench duration, and a department breakdown. Kept dependency-free
// (no chart library import); richer analytics live in Ankit's
// Analytics Dashboard.

import { BenchRecord } from "../../types/utilization.types";

interface BenchAnalyticsProps {
  records: BenchRecord[];
}

export default function BenchAnalytics({ records }: BenchAnalyticsProps) {
  const onBench = records.filter((r) => r.status === "on_bench");
  const avgDuration = onBench.length
    ? Math.round(onBench.reduce((sum, r) => sum + r.benchDurationDays, 0) / onBench.length)
    : 0;

  const byDepartment = onBench.reduce<Record<string, number>>((acc, r) => {
    acc[r.departmentName] = (acc[r.departmentName] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Employees On Bench
          </p>
          <p className="mt-1 text-xl font-semibold text-[#0F2147]">{onBench.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Average Bench Duration
          </p>
          <p className="mt-1 text-xl font-semibold text-[#0F2147]">{avgDuration} days</p>
        </div>
      </div>

      {Object.keys(byDepartment).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            By Department
          </p>
          <div className="space-y-2">
            {Object.entries(byDepartment).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{dept}</span>
                <span className="font-medium text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
