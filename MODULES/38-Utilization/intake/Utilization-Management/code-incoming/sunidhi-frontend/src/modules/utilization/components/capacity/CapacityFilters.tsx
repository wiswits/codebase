// src/modules/utilization/components/capacity/CapacityFilters.tsx

interface FiltersValue {
  period: string | "";
}

interface CapacityFiltersProps {
  filters: FiltersValue;
  onChange: (next: Partial<FiltersValue>) => void;
  periodOptions: string[];
}

export default function CapacityFilters({ filters, onChange, periodOptions }: CapacityFiltersProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
      Period
      <select
        value={filters.period}
        onChange={(e) => onChange({ period: e.target.value })}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
      >
        <option value="">All Periods</option>
        {periodOptions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </label>
  );
}
