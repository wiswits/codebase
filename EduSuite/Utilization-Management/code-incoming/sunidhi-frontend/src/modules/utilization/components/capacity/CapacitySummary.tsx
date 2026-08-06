// src/modules/utilization/components/capacity/CapacitySummary.tsx

import { CapacityPlan } from "../../types/utilization.types";

interface CapacitySummaryProps {
  plans: CapacityPlan[];
}

export default function CapacitySummary({ plans }: CapacitySummaryProps) {
  const totalCapacity = plans.reduce((sum, p) => sum + p.monthlyCapacityHours, 0);
  const totalAllocated = plans.reduce((sum, p) => sum + p.allocatedHours, 0);
  const overCapacityCount = plans.filter((p) => p.remainingHours < 0).length;

  const cards = [
    { label: "Total Monthly Capacity", value: `${totalCapacity} hrs` },
    { label: "Total Allocated Hours", value: `${totalAllocated} hrs` },
    { label: "Over Capacity", value: overCapacityCount },
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
