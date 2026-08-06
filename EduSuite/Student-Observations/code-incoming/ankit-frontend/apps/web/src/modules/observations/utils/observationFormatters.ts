import type { ObservationType } from "../types/observation.types";

export function formatObservationType(type: ObservationType): string {
  return type === "anecdotal"
    ? "Anecdotal"
    : "Class / School";
}

export function formatObservationDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getStudentInitials(name?: string): string {
  if (!name) return "ST";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}