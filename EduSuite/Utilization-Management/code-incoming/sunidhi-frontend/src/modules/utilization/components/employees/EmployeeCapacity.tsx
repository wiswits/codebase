// src/modules/utilization/components/employees/EmployeeCapacity.tsx
//
// Read-only capacity snapshot for a single employee, embedded in
// EmployeeProfile/EmployeeDetails.

import { CapacityPlan } from "../../types/utilization.types";

interface EmployeeCapacityProps {
  plan: CapacityPlan | null;
}

export default function EmployeeCapacity({ plan }: EmployeeCapacityProps) {
  if (!plan) {
    return <p className="text-sm text-gray-500">No capacity plan recorded for this period.</p>;
  }

  const percentUsed = plan.monthlyCapacityHours
    ? Math.round((plan.allocatedHours / plan.monthlyCapacityHours) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Period</p>
          <p className="text-gray-700">{plan.period}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Monthly Capacity
          </p>
          <p className="text-gray-700">{plan.monthlyCapacityHours} hrs</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Allocated</p>
          <p className="text-gray-700">{plan.allocatedHours} hrs</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Remaining</p>
          <p className={plan.remainingHours < 0 ? "text-red-600" : "text-gray-700"}>
            {plan.remainingHours} hrs
          </p>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${percentUsed > 100 ? "bg-red-500" : "bg-[#0F2147]"}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
    </div>
  );
}
