// src/modules/utilization/components/bench/BenchFilters.tsx

import { BENCH_STATUS_OPTIONS } from "../../constants/utilization.constants";
import { MOCK_DEPARTMENTS } from "../../mocks/utilization.mock";
import { BenchRecordStatus } from "../../types/utilization.types";

interface FiltersValue {
  status: BenchRecordStatus | "";
  departmentId: number | "";
}

interface BenchFiltersProps {
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

export default function BenchFilters({ filters, onChange }: BenchFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
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
        value={filters.status}
        onChange={(v) => onChange({ status: v as BenchRecordStatus | "" })}
      >
        {BENCH_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
