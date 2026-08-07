// src/modules/utilization/components/bench/BenchCard.tsx
//
// Compact card view of a bench record, used on responsive/mobile layouts.

import { BenchRecord } from "../../types/utilization.types";
import BenchStatus from "./BenchStatus";

interface BenchCardProps {
  record: BenchRecord;
  onClose: (benchId: number) => void;
}

export default function BenchCard({ record, onClose }: BenchCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800">{record.employeeName}</p>
          <p className="text-xs text-gray-400">{record.departmentName}</p>
        </div>
        <BenchStatus status={record.status} />
      </div>
      <p className="text-xs text-gray-500">{record.benchReason}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Since {record.benchStartDate}</span>
        <span>Available {record.availableDate}</span>
      </div>
      {record.status === "on_bench" && (
        <button
          type="button"
          onClick={() => onClose(record.id)}
          className="self-start rounded-lg border border-[#0F2147] px-3 py-1.5 text-xs font-medium text-[#0F2147] transition-colors hover:bg-[#0F2147] hover:text-white"
        >
          Close
        </button>
      )}
    </div>
  );
}
