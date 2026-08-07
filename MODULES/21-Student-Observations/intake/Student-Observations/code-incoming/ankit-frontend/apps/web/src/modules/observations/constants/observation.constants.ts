import type { ObservationType } from "../types/observation.types";

export const OBSERVATION_TYPE_OPTIONS: Array<{
  value: ObservationType;
  label: string;
  description: string;
}> = [
  {
    value: "anecdotal",
    label: "Anecdotal",
    description:
      "Record a specific noteworthy observation about the student.",
  },
  {
    value: "class_school",
    label: "Class / School",
    description:
      "Record an observation related to the student's class or school context.",
  },
];

export const OBSERVATION_CONTENT_MIN_LENGTH = 10;
export const OBSERVATION_CONTENT_MAX_LENGTH = 3000;

export const CURRENT_DEMO_ORGANIZATION_ID = 900001;
export const CURRENT_DEMO_AUTHOR_ID = 500001;