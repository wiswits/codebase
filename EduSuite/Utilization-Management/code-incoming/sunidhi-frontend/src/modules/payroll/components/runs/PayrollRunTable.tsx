// src/modules/payroll/components/runs/PayrollRunTable.tsx

import { formatMoney } from "../../constants/payroll.constants";
import { PayrollRun } from "../../types/payroll.types";
import PayrollRunStatusBadge from "./PayrollRunStatusBadge";

interface PayrollRunTableProps {
  items: PayrollRun[];
  onOpen: (runId: number) => void;
}

export default function PayrollRunTable({ items, onOpen }: PayrollRunTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Run Reference</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Employees</th>
            <th className="px-4 py-3 font-medium">Final Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((run) => (
            <tr key={run.id} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">{run.runReference}</td>
              <td className="px-4 py-3 text-gray-600">{run.payrollPeriod}</td>
              <td className="px-4 py-3 text-gray-600">{run.employeeCount}</td>
              <td className="px-4 py-3 font-medium text-gray-800">
                ₹{formatMoney(run.finalTotal)}
              </td>
              <td className="px-4 py-3">
                <PayrollRunStatusBadge status={run.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onOpen(run.id)}
                  className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
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
