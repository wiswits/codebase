// src/modules/utilization/components/reports/ReportFilters.tsx

import { MOCK_DEPARTMENTS } from "../../mocks/utilization.mock";

interface FiltersValue {
  search: string;
  departmentId: number | "";
}

interface ReportFiltersProps {
  filters: FiltersValue;
  onChange: (next: Partial<FiltersValue>) => void;
  showDepartmentFilter?: boolean;
}

export default function ReportFilters({
  filters,
  onChange,
  showDepartmentFilter = true,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex w-full flex-col gap-1 text-xs font-medium text-gray-500 sm:max-w-xs">
        Search
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search by name"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
        />
      </label>

      {showDepartmentFilter && (
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
          Department
          <select
            value={filters.departmentId}
            onChange={(e) => onChange({ departmentId: e.target.value ? Number(e.target.value) : "" })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
          >
            <option value="">All Departments</option>
            {MOCK_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
