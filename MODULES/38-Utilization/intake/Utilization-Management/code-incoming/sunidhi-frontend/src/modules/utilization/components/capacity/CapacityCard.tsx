// src/modules/utilization/components/capacity/CapacityCard.tsx
//
// Compact card view of a capacity plan, used on responsive/mobile layouts.

import { CapacityPlan } from "../../types/utilization.types";
import CapacityIndicator from "./CapacityIndicator";

interface CapacityCardProps {
  plan: CapacityPlan;
}

export default function CapacityCard({ plan }: CapacityCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800">{plan.employeeName}</p>
          <p className="text-xs text-gray-400">
            {plan.departmentName} &middot; {plan.period}
          </p>
        </div>
      </div>
      <CapacityIndicator allocatedHours={plan.allocatedHours} totalHours={plan.monthlyCapacityHours} />
      <p className={`text-xs ${plan.remainingHours < 0 ? "text-red-600" : "text-gray-500"}`}>
        {plan.remainingHours} hrs remaining
      </p>
    </div>
  );
}
