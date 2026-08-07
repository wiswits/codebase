// src/modules/utilization/components/bench/BenchTable.tsx

import { BenchRecord } from "../../types/utilization.types";
import BenchStatus from "./BenchStatus";

interface BenchTableProps {
  items: BenchRecord[];
  onClose: (benchId: number) => void;
}

export default function BenchTable({ items, onClose }: BenchTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">On Bench Since</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Available Date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((record) => (
            <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">{record.employeeName}</p>
                <p className="text-xs text-gray-400">{record.employeeCode}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{record.departmentName}</td>
              <td className="px-4 py-3 text-gray-600">{record.benchStartDate}</td>
              <td className="px-4 py-3 text-gray-600">{record.benchReason}</td>
              <td className="px-4 py-3 text-gray-600">{record.availableDate}</td>
              <td className="px-4 py-3">
                <BenchStatus status={record.status} />
              </td>
              <td className="px-4 py-3 text-right">
                {record.status === "on_bench" && (
                  <button
                    type="button"
                    onClick={() => onClose(record.id)}
                    className="rounded-lg border border-[#0F2147] px-3 py-1.5 text-xs font-medium text-[#0F2147] transition-colors hover:bg-[#0F2147] hover:text-white"
                  >
                    Close
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
