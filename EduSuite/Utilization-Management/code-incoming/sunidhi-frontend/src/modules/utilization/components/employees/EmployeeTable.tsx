// src/modules/utilization/components/employees/EmployeeTable.tsx

import { Employee } from "../../types/utilization.types";
import { utilizationBandClass, utilizationBandLabel } from "../../constants/utilization.constants";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import StatusBadge from "../common/StatusBadge";

interface EmployeeTableProps {
  items: Employee[];
  onOpen: (employeeId: number) => void;
}

export default function EmployeeTable({ items, onOpen }: EmployeeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Designation</th>
            <th className="px-4 py-3 font-medium">Weekly Capacity</th>
            <th className="px-4 py-3 font-medium">Utilization</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((employee) => (
            <tr key={employee.id} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">{employee.employeeName}</p>
                <p className="text-xs text-gray-400">{employee.employeeCode}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{employee.departmentName}</td>
              <td className="px-4 py-3 text-gray-600">{employee.designation}</td>
              <td className="px-4 py-3 text-gray-600">{employee.weeklyCapacityHours} hrs</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={`${employee.utilizationPercent}% · ${utilizationBandLabel(employee.utilizationPercent)}`}
                  className={utilizationBandClass(employee.utilizationPercent)}
                />
              </td>
              <td className="px-4 py-3">
                <EmployeeStatusBadge status={employee.employmentStatus} />
                {employee.onBench && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Bench
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onOpen(employee.id)}
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
