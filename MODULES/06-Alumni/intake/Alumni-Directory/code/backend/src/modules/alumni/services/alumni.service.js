import { findAlumniById } from "../repositories/alumni.repository.js";
import { searchAlumni } from "../repositories/alumni.search.repository.js";
import { mapAlumni } from "../utils/alumni.mapper.js";

export async function getAlumniList({
  orgId,
  search,
  batch,
  graduationYear,
  course,
  page = 1,
  limit = 20
}) {
  const result = await searchAlumni({
    orgId,
    search,
    batch,
    graduationYear,
    course,
    page,
    limit
  });

  return {
    items: result.rows.map(mapAlumni),

    pagination: {
      page,
      limit,
      total: result.total,
      totalPages:
        result.total === 0
          ? 0
          : Math.ceil(result.total / limit)
    }
  };
}

export async function getAlumniProfile({
  orgId,
  alumniId
}) {
  const alumni = await findAlumniById(
    orgId,
    alumniId
  );

  if (!alumni) {
    return null;
  }

  return mapAlumni(alumni);
}