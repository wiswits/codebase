import type {
  Alumni
} from "../types/alumni.types";

export function getAlumniFullName(
  alumni: Pick<
    Alumni,
    "firstName" | "lastName"
  >
): string {
  return `${alumni.firstName} ${alumni.lastName}`.trim();
}

export function getInitials(
  alumni: Pick<
    Alumni,
    "firstName" | "lastName"
  >
): string {
  const first =
    alumni.firstName?.charAt(0) ?? "";

  const last =
    alumni.lastName?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase();
}

export function displayValue(
  value?: string | number | null
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}

export function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}