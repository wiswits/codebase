// src/modules/utilization/components/capacity/CapacityIndicator.tsx
//
// Small inline capacity-usage bar, reused inside CapacityTable and
// CapacityCard.

interface CapacityIndicatorProps {
  allocatedHours: number;
  totalHours: number;
}

export default function CapacityIndicator({ allocatedHours, totalHours }: CapacityIndicatorProps) {
  const percent = totalHours ? Math.round((allocatedHours / totalHours) * 100) : 0;
  const overCapacity = allocatedHours > totalHours;

  return (
    <div className="w-32 space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{allocatedHours}h</span>
        <span>{totalHours}h</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${overCapacity ? "bg-red-500" : "bg-[#0F2147]"}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
