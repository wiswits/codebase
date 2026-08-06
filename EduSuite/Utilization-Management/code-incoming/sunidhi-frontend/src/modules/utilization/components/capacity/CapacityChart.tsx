// src/modules/utilization/components/capacity/CapacityChart.tsx
//
// Lightweight bar comparison of allocated vs. available hours per
// employee. Kept dependency-free (no chart library import) to match
// module boundaries — Recharts-based visuals live in Ankit's
// dashboard/analytics components.

import { CapacityPlan } from "../../types/utilization.types";

interface CapacityChartProps {
  plans: CapacityPlan[];
}

export default function CapacityChart({ plans }: CapacityChartProps) {
  if (plans.length === 0) {
    return <p className="text-sm text-gray-500">No capacity data for this period.</p>;
  }

  const maxHours = Math.max(...plans.map((p) => Math.max(p.monthlyCapacityHours, p.allocatedHours)), 1);

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const allocatedWidth = Math.min((plan.allocatedHours / maxHours) * 100, 100);
        const capacityWidth = Math.min((plan.monthlyCapacityHours / maxHours) * 100, 100);
        return (
          <div key={plan.id} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{plan.employeeName}</span>
              <span>
                {plan.allocatedHours} / {plan.monthlyCapacityHours} hrs
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gray-200"
                style={{ width: `${capacityWidth}%` }}
              />
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  plan.allocatedHours > plan.monthlyCapacityHours ? "bg-red-500" : "bg-[#0F2147]"
                }`}
                style={{ width: `${allocatedWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
