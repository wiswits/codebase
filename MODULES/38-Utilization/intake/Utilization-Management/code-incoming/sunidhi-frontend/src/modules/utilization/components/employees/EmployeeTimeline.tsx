// src/modules/utilization/components/employees/EmployeeTimeline.tsx
//
// Chronological view combining an employee's allocations and bench
// periods, used on EmployeeProfile / EmployeeDetails.

import { Allocation, BenchRecord } from "../../types/utilization.types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface TimelineEntry {
  id: string;
  kind: "allocation" | "bench";
  label: string;
  detail: string;
  date: string;
}

interface EmployeeTimelineProps {
  allocations: Allocation[];
  benchRecords: BenchRecord[];
}

export default function EmployeeTimeline({ allocations, benchRecords }: EmployeeTimelineProps) {
  const entries: TimelineEntry[] = [
    ...allocations.map((a) => ({
      id: `alloc-${a.id}`,
      kind: "allocation" as const,
      label: a.projectName,
      detail: `${a.allocationPercent}% · ${a.workingHours} hrs/week`,
      date: a.startDate,
    })),
    ...benchRecords.map((b) => ({
      id: `bench-${b.id}`,
      kind: "bench" as const,
      label: "On Bench",
      detail: b.benchReason || "No reason recorded.",
      date: b.benchStartDate,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No allocation or bench history yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                entry.kind === "allocation" ? "bg-[#0F2147]" : "bg-amber-500"
              }`}
            />
            <span className="w-px flex-1 bg-gray-100" />
          </div>
          <div className="pb-2">
            <p className="text-sm font-medium text-gray-800">{entry.label}</p>
            <p className="text-xs text-gray-500">{entry.detail}</p>
            <p className="text-xs text-gray-400">{formatDate(entry.date)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
