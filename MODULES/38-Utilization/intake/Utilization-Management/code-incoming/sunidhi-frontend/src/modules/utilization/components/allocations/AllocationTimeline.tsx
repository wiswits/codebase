// src/modules/utilization/components/allocations/AllocationTimeline.tsx
//
// Visual start/end bar for a single allocation, shown on AllocationDetails.

import { Allocation } from "../../types/utilization.types";

interface AllocationTimelineProps {
  allocation: Allocation;
}

export default function AllocationTimeline({ allocation }: AllocationTimelineProps) {
  const start = new Date(allocation.startDate).getTime();
  const end = new Date(allocation.endDate).getTime();
  const now = Date.now();
  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), total);
  const progressPercent = Math.round((elapsed / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{allocation.startDate}</span>
        <span>{allocation.endDate}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#C8A04E]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {allocation.status === "active" ? `${progressPercent}% elapsed` : "Allocation closed"}
      </p>
    </div>
  );
}
