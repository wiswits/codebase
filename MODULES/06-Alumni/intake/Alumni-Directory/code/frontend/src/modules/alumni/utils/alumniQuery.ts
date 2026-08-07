import type {
  AlumniQuery
} from "../types/alumni.types";

export function buildAlumniQuery(
  query: AlumniQuery = {}
): string {
  const params = new URLSearchParams();

  const search = query.search?.trim();
  const batch = query.batch?.trim();
  const course = query.course?.trim();

  if (search) {
    params.set("search", search);
  }

  if (batch) {
    params.set("batch", batch);
  }

  if (query.graduationYear) {
    params.set(
      "graduationYear",
      String(query.graduationYear)
    );
  }

  if (course) {
    params.set("course", course);
  }

  if (query.page) {
    params.set(
      "page",
      String(query.page)
    );
  }

  if (query.limit) {
    params.set(
      "limit",
      String(query.limit)
    );
  }

  const queryString = params.toString();

  return queryString
    ? `?${queryString}`
    : "";
}