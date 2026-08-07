// src/modules/observations/components/list/ObservationFilters.tsx

import { OBSERVATION_TYPE_OPTIONS } from "../../constants/observation.constants";
import { ObservationType } from "../../types/observation.types";

interface ObservationFiltersProps {
  observationType: ObservationType | "";
  onChange: (observationType: ObservationType | "") => void;
}

export default function ObservationFilters({
  observationType,
  onChange,
}: ObservationFiltersProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
      Observation Type
      <select
        value={observationType}
        onChange={(e) => onChange(e.target.value as ObservationType | "")}
        className="rounded-[8px] border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#0F2147] focus:ring-1 focus:ring-[#0F2147]"
      >
        {OBSERVATION_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
