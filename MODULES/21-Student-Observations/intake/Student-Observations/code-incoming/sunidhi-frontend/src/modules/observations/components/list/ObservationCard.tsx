// src/modules/observations/components/list/ObservationCard.tsx

import { User2, CalendarDays } from "lucide-react";
import {
  OBSERVATION_TYPE_BADGE_CLASSES,
  OBSERVATION_TYPE_LABELS,
} from "../../constants/observation.constants";
import { Observation } from "../../types/observation.types";

interface ObservationCardProps {
  observation: Observation;
  onOpen: (id: number) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ObservationCard({
  observation,
  onOpen,
}: ObservationCardProps) {
  const badgeClass = OBSERVATION_TYPE_BADGE_CLASSES[observation.observationType];
  const typeLabel = OBSERVATION_TYPE_LABELS[observation.observationType];

  return (
    <button
      type="button"
      onClick={() => onOpen(observation.id)}
      className="w-full rounded-[8px] border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#C8A04E]/60 hover:bg-[#F7F4EC]/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <User2 className="h-4 w-4 text-gray-400" />
          {observation.studentName ?? `Student #${observation.studentId}`}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {typeLabel}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
        {observation.content}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          By {observation.authorName ?? `Author #${observation.authorId}`}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(observation.createdAt)}
        </span>
      </div>
    </button>
  );
}
