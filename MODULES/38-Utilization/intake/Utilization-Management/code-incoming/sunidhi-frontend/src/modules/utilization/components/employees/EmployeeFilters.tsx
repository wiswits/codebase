// src/modules/utilization/components/employees/EmployeeFilters.tsx

import { EMPLOYMENT_STATUS_OPTIONS } from "../../constants/utilization.constants";
import { MOCK_DEPARTMENTS } from "../../mocks/utilization.mock";
import { EmploymentStatus } from "../../types/utilization.types";

interface FiltersValue {
  departmentId: number | "";
  employmentStatus: EmploymentStatus | "";
  onBench: boolean | "";
}

interface EmployeeFiltersProps {
  filters: FiltersValue;
  onChange: (next: Partial<FiltersValue>) => void;
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
      >
        {children}
      </select>
    </label>
  );
}

export default function EmployeeFilters({ filters, onChange }: EmployeeFiltersProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Select
        label="Department"
        value={filters.departmentId}
        onChange={(v) => onChange({ departmentId: v ? Number(v) : "" })}
      >
        <option value="">All Departments</option>
        {MOCK_DEPARTMENTS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>

      <Select
        label="Status"
        value={filters.employmentStatus}
        onChange={(v) => onChange({ employmentStatus: v as EmploymentStatus | "" })}
      >
        {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      <Select
        label="Bench"
        value={filters.onBench === "" ? "" : String(filters.onBench)}
        onChange={(v) => onChange({ onBench: v === "" ? "" : v === "true" })}
      >
        <option value="">All Employees</option>
        <option value="true">On Bench</option>
        <option value="false">Allocated</option>
      </Select>
    </div>
  );
}
