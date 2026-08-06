// src/modules/utilization/components/allocations/AllocationFilters.tsx

import { ALLOCATION_STATUS_OPTIONS } from "../../constants/utilization.constants";
import { MOCK_PROJECTS } from "../../mocks/utilization.mock";
import { AllocationStatus } from "../../types/utilization.types";

interface FiltersValue {
  projectId: number | "";
  status: AllocationStatus | "";
}

interface AllocationFiltersProps {
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

export default function AllocationFilters({ filters, onChange }: AllocationFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Select
        label="Project"
        value={filters.projectId}
        onChange={(v) => onChange({ projectId: v ? Number(v) : "" })}
      >
        <option value="">All Projects</option>
        {MOCK_PROJECTS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>

      <Select
        label="Status"
        value={filters.status}
        onChange={(v) => onChange({ status: v as AllocationStatus | "" })}
      >
        {ALLOCATION_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
