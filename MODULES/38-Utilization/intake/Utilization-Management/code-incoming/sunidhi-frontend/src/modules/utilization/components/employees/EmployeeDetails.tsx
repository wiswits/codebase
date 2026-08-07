// src/modules/utilization/components/employees/EmployeeDetails.tsx
//
// Compact read-only summary card — the top block of EmployeeProfile.
// Split out so it can also be reused inside dialogs/drawers.

import { Employee } from "../../types/utilization.types";
import { utilizationBandClass, utilizationBandLabel } from "../../constants/utilization.constants";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import StatusBadge from "../common/StatusBadge";

interface EmployeeDetailsProps {
  employee: Employee;
}

export default function EmployeeDetails({ employee }: EmployeeDetailsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{employee.employeeName}</h2>
          <p className="text-sm text-gray-500">
            {employee.employeeCode} &middot; {employee.designation} &middot; {employee.departmentName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EmployeeStatusBadge status={employee.employmentStatus} />
          {employee.onBench && (
            <StatusBadge label="On Bench" className="bg-amber-50 text-amber-700" />
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Weekly Capacity
          </p>
          <p className="text-gray-700">{employee.weeklyCapacityHours} hrs</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Allocations
          </p>
          <p className="text-gray-700">{employee.allocationCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Utilization
          </p>
          <StatusBadge
            label={`${employee.utilizationPercent}% · ${utilizationBandLabel(employee.utilizationPercent)}`}
            className={utilizationBandClass(employee.utilizationPercent)}
          />
        </div>
      </div>

      {employee.remarks && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Remarks</p>
          <p className="mt-1 text-sm text-gray-700">{employee.remarks}</p>
        </div>
      )}
    </div>
  );
}
