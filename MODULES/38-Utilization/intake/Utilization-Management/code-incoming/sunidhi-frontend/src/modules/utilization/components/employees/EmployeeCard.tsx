// src/modules/utilization/components/employees/EmployeeCard.tsx
//
// Compact card view of an employee, used on responsive/mobile layouts
// where the full table is impractical.

import { Employee } from "../../types/utilization.types";
import { utilizationBandClass, utilizationBandLabel } from "../../constants/utilization.constants";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import StatusBadge from "../common/StatusBadge";

interface EmployeeCardProps {
  employee: Employee;
  onOpen: (employeeId: number) => void;
}

export default function EmployeeCard({ employee, onOpen }: EmployeeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(employee.id)}
      className="flex w-full flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-[#0F2147]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800">{employee.employeeName}</p>
          <p className="text-xs text-gray-400">
            {employee.employeeCode} &middot; {employee.designation}
          </p>
        </div>
        <EmployeeStatusBadge status={employee.employmentStatus} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{employee.departmentName}</span>
        <StatusBadge
          label={`${employee.utilizationPercent}% ${utilizationBandLabel(employee.utilizationPercent)}`}
          className={utilizationBandClass(employee.utilizationPercent)}
        />
      </div>
    </button>
  );
}
