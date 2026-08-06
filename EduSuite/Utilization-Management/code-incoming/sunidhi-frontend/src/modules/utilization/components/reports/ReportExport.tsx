// src/modules/utilization/components/reports/ReportExport.tsx
//
// Client-side CSV export of the currently loaded report rows. Backend
// export endpoints are out of scope for this module contract's
// "REPORT ENDPOINTS" list (read-only GETs only), so export happens
// against whatever page of data is currently on screen.

import { Download } from "lucide-react";
import { UtilizationReportRow } from "../../types/utilization.types";

interface ReportExportProps {
  items: UtilizationReportRow[];
  fileName: string;
}

function toCsv(items: UtilizationReportRow[]): string {
  const headers = [
    "Group",
    "Department",
    "Period",
    "Capacity Hours",
    "Allocated Hours",
    "Utilization %",
    "Bench Count",
  ];
  const rows = items.map((r) => [
    r.groupLabel,
    r.departmentName,
    r.period,
    r.totalCapacityHours,
    r.allocatedHours,
    r.utilizationPercent,
    r.benchCount,
  ]);
  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

export default function ReportExport({ items, fileName }: ReportExportProps) {
  const handleExport = () => {
    const csv = toCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={items.length === 0}
      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-[#0F2147] hover:enabled:text-[#0F2147]"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </button>
  );
}
