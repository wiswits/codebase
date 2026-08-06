// src/modules/utilization/components/allocations/AllocationSummary.tsx
//
// Quick-glance totals above the allocation table/list.

import { Allocation } from "../../types/utilization.types";

interface AllocationSummaryProps {
  allocations: Allocation[];
}

export default function AllocationSummary({ allocations }: AllocationSummaryProps) {
  const active = allocations.filter((a) => a.status === "active");
  const totalHours = active.reduce((sum, a) => sum + a.workingHours, 0);
  const avgPercent = active.length
    ? Math.round(active.reduce((sum, a) => sum + a.allocationPercent, 0) / active.length)
    : 0;

  const cards = [
    { label: "Active Allocations", value: active.length },
    { label: "Total Allocated Hours", value: `${totalHours} hrs/week` },
    { label: "Average Allocation", value: `${avgPercent}%` },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {card.label}
          </p>
          <p className="mt-1 text-xl font-semibold text-[#0F2147]">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
