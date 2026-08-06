// src/modules/utilization/components/capacity/CapacityTable.tsx

import { CapacityPlan } from "../../types/utilization.types";
import CapacityIndicator from "./CapacityIndicator";

interface CapacityTableProps {
  items: CapacityPlan[];
}

export default function CapacityTable({ items }: CapacityTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Weekly Capacity</th>
            <th className="px-4 py-3 font-medium">Allocated / Monthly</th>
            <th className="px-4 py-3 font-medium">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {items.map((plan) => (
            <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-3 font-medium text-gray-800">{plan.employeeName}</td>
              <td className="px-4 py-3 text-gray-600">{plan.departmentName}</td>
              <td className="px-4 py-3 text-gray-600">{plan.period}</td>
              <td className="px-4 py-3 text-gray-600">{plan.weeklyCapacityHours} hrs</td>
              <td className="px-4 py-3">
                <CapacityIndicator
                  allocatedHours={plan.allocatedHours}
                  totalHours={plan.monthlyCapacityHours}
                />
              </td>
              <td className={`px-4 py-3 ${plan.remainingHours < 0 ? "text-red-600" : "text-gray-600"}`}>
                {plan.remainingHours} hrs
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
