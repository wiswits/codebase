// src/modules/utilization/components/allocations/AllocationTable.tsx

import { Allocation } from "../../types/utilization.types";
import { ALLOCATION_STATUS_BADGE_CLASSES, ALLOCATION_STATUS_LABELS } from "../../constants/utilization.constants";
import StatusBadge from "../common/StatusBadge";

interface AllocationTableProps {
  items: Allocation[];
  onOpen: (allocationId: number) => void;
}

export default function AllocationTable({ items, onOpen }: AllocationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Allocation %</th>
            <th className="px-4 py-3 font-medium">Hours/Week</th>
            <th className="px-4 py-3 font-medium">Duration</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((allocation) => (
            <tr key={allocation.id} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">{allocation.employeeName}</p>
                <p className="text-xs text-gray-400">{allocation.employeeCode}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{allocation.projectName}</td>
              <td className="px-4 py-3 text-gray-600">{allocation.allocationPercent}%</td>
              <td className="px-4 py-3 text-gray-600">{allocation.workingHours} hrs</td>
              <td className="px-4 py-3 text-gray-600">
                {allocation.startDate} &rarr; {allocation.endDate}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={ALLOCATION_STATUS_LABELS[allocation.status]}
                  className={ALLOCATION_STATUS_BADGE_CLASSES[allocation.status]}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onOpen(allocation.id)}
                  className="rounded-lg border border-[#0F2147] px-3 py-1.5 text-xs font-medium text-[#0F2147] transition-colors hover:bg-[#0F2147] hover:text-white"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
