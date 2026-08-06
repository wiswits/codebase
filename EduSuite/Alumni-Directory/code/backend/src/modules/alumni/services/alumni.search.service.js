import { searchAlumni } from "../repositories/alumni.search.repository.js";
import { mapAlumni } from "../utils/alumni.mapper.js";

export async function searchAlumniDirectory({
  orgId,
  search,
  batch,
  graduationYear,
  course,
  page,
  limit
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