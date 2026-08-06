import type { Observation } from "../../types/observation.types";

import {
  formatObservationDate,
  formatObservationType,
} from "../../utils/observationFormatters";

interface ObservationMetaProps {
  observation: Observation;
}

export default function ObservationMeta({
  observation,
}: ObservationMetaProps) {
  const items = [
    {
      label: "Observation Type",
      value: formatObservationType(
        observation.observationType
      ),
    },
    {
      label: "Created",
      value: formatObservationDate(observation.createdAt),
    },
    {
      label: "Last Updated",
      value: formatObservationDate(observation.updatedAt),
    },
    {
      label: "Observation ID",
      value: `#${observation.id}`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {item.label}
          </p>

          <p className="mt-2 text-sm font-semibold text-[#0F2147]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}