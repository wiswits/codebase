// src/modules/payroll/components/runs/EmployeePayrollTable.tsx

import { formatMoney } from "../../constants/payroll.constants";
import { RunEmployeeRow } from "../../types/payroll.types";

interface EmployeePayrollTableProps {
  rows: RunEmployeeRow[];
  onViewPayslip: (payslipId: number) => void;
}

export default function EmployeePayrollTable({ rows, onViewPayslip }: EmployeePayrollTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Gross Salary</th>
            <th className="px-4 py-3 font-medium">Arrears</th>
            <th className="px-4 py-3 font-medium">Deductions</th>
            <th className="px-4 py-3 font-medium">Final Amount</th>
            <th className="px-4 py-3 font-medium text-right">Payslip</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employeeId} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-3 font-medium text-gray-800">{row.employeeName}</td>
              <td className="px-4 py-3 text-gray-600">₹{formatMoney(row.grossSalary)}</td>
              <td className="px-4 py-3 text-gray-600">₹{formatMoney(row.arrearsTotal)}</td>
              <td className="px-4 py-3 text-gray-600">₹{formatMoney(row.deductionsTotal)}</td>
              <td className="px-4 py-3 font-medium text-gray-800">
                ₹{formatMoney(row.finalAmount)}
              </td>
              <td className="px-4 py-3 text-right">
                {row.payslipId ? (
                  <button
                    type="button"
                    onClick={() => onViewPayslip(row.payslipId!)}
                    className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                  >
                    View Payslip
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Not yet generated</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
