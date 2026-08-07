// src/modules/utilization/components/employees/EmployeeAllocation.tsx
//
// Read-only summary of an employee's current project allocations,
// embedded in EmployeeProfile/EmployeeDetails.

import { Allocation } from "../../types/utilization.types";
import { ALLOCATION_STATUS_BADGE_CLASSES, ALLOCATION_STATUS_LABELS } from "../../constants/utilization.constants";
import StatusBadge from "../common/StatusBadge";

interface EmployeeAllocationProps {
  allocations: Allocation[];
}

export default function EmployeeAllocation({ allocations }: EmployeeAllocationProps) {
  if (allocations.length === 0) {
    return <p className="text-sm text-gray-500">No project allocations yet.</p>;
  }

  return (
    <div className="space-y-2">
      {allocations.map((a) => (
        <div
          key={a.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{a.projectName}</p>
            <p className="text-xs text-gray-500">
              {a.startDate} &rarr; {a.endDate}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{a.allocationPercent}%</span>
            <span>{a.workingHours} hrs/week</span>
            <StatusBadge
              label={ALLOCATION_STATUS_LABELS[a.status]}
              className={ALLOCATION_STATUS_BADGE_CLASSES[a.status]}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
