// src/modules/utilization/components/allocations/AllocationCard.tsx
//
// Compact card view of an allocation, used on responsive/mobile layouts.

import { Allocation } from "../../types/utilization.types";
import { ALLOCATION_STATUS_BADGE_CLASSES, ALLOCATION_STATUS_LABELS } from "../../constants/utilization.constants";
import StatusBadge from "../common/StatusBadge";

interface AllocationCardProps {
  allocation: Allocation;
  onOpen: (allocationId: number) => void;
}

export default function AllocationCard({ allocation, onOpen }: AllocationCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(allocation.id)}
      className="flex w-full flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-[#0F2147]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800">{allocation.projectName}</p>
          <p className="text-xs text-gray-400">{allocation.employeeName}</p>
        </div>
        <StatusBadge
          label={ALLOCATION_STATUS_LABELS[allocation.status]}
          className={ALLOCATION_STATUS_BADGE_CLASSES[allocation.status]}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{allocation.allocationPercent}% &middot; {allocation.workingHours} hrs/week</span>
        <span>{allocation.startDate} &rarr; {allocation.endDate}</span>
      </div>
    </button>
  );
}
