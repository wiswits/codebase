// src/modules/observations/constants/observation.constants.ts
//
// Design tokens follow the approved WisWits product language
// (Contract Section 14).

import { ObservationType } from "../types/observation.types";

export const OBSERVATIONS_API_BASE = "/api/v1/student-observations";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const OBSERVATION_BRAND = {
  navy: "#0F2147",
  gold: "#C8A04E",
  ivory: "#F7F4EC",
  headingFont: "'Playfair Display', serif",
  bodyFont: "'Source Sans 3', sans-serif",
  radius: "8px",
} as const;

export const OBSERVATION_TYPE_LABELS: Record<ObservationType, string> = {
  anecdotal: "Anecdotal Observation",
  class_school: "Class / School Observation",
};

export const OBSERVATION_TYPE_OPTIONS: {
  value: ObservationType | "";
  label: string;
}[] = [
  { value: "", label: "All Types" },
  { value: "anecdotal", label: "Anecdotal Observation" },
  { value: "class_school", label: "Class / School Observation" },
];

export const OBSERVATION_TYPE_BADGE_CLASSES: Record<ObservationType, string> = {
  anecdotal: "bg-[#F7F4EC] text-[#0F2147]",
  class_school: "bg-[#0F2147]/10 text-[#0F2147]",
};
