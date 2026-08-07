// src/modules/utilization/components/reports/ReportTable.tsx

import { UtilizationReportRow } from "../../types/utilization.types";
import { utilizationBandClass, utilizationBandLabel } from "../../constants/utilization.constants";
import StatusBadge from "../common/StatusBadge";

interface ReportTableProps {
  items: UtilizationReportRow[];
  groupLabelHeader: string;
}

export default function ReportTable({ items, groupLabelHeader }: ReportTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3 font-medium">{groupLabelHeader}</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Capacity Hours</th>
            <th className="px-4 py-3 font-medium">Allocated Hours</th>
            <th className="px-4 py-3 font-medium">Utilization</th>
            <th className="px-4 py-3 font-medium">Bench</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-3 font-medium text-gray-800">{row.groupLabel}</td>
              <td className="px-4 py-3 text-gray-600">{row.departmentName}</td>
              <td className="px-4 py-3 text-gray-600">{row.period}</td>
              <td className="px-4 py-3 text-gray-600">{row.totalCapacityHours} hrs</td>
              <td className="px-4 py-3 text-gray-600">{row.allocatedHours} hrs</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={`${row.utilizationPercent}% · ${utilizationBandLabel(row.utilizationPercent)}`}
                  className={utilizationBandClass(row.utilizationPercent)}
                />
              </td>
              <td className="px-4 py-3 text-gray-600">{row.benchCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
