// src/modules/utilization/components/bench/BenchDetails.tsx
//
// Detail panel for a single bench record, used in a drawer/dialog
// opened from BenchTable/BenchCard.

import { BenchRecord } from "../../types/utilization.types";
import BenchStatus from "./BenchStatus";

interface BenchDetailsProps {
  record: BenchRecord;
}

export default function BenchDetails({ record }: BenchDetailsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{record.employeeName}</h2>
          <p className="text-sm text-gray-500">
            {record.employeeCode} &middot; {record.departmentName}
          </p>
        </div>
        <BenchStatus status={record.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            On Bench Since
          </p>
          <p className="text-gray-700">{record.benchStartDate}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Available Date
          </p>
          <p className="text-gray-700">{record.availableDate}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Bench Duration
          </p>
          <p className="text-gray-700">{record.benchDurationDays} days</p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Reason</p>
        <p className="mt-1 text-sm text-gray-700">{record.benchReason}</p>
      </div>

      {record.suggestedAllocation && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Suggested Allocation
          </p>
          <p className="mt-1 text-sm text-gray-700">{record.suggestedAllocation}</p>
        </div>
      )}
    </div>
  );
}
