import { query } from "../../../config/database.js";

function buildFilters({
  orgId,
  search,
  batch,
  graduationYear,
  course
}) {
  const conditions = ["org_id = ?"];
  const params = [orgId];

  if (search) {
    conditions.push(`
      (
        first_name LIKE ?
        OR last_name LIKE ?
        OR email LIKE ?
        OR CONCAT(first_name, ' ', last_name) LIKE ?
      )
    `);

    const searchPattern = `%${search}%`;

    params.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }

  if (batch) {
    conditions.push("batch = ?");
    params.push(batch);
  }

  if (graduationYear !== undefined) {
    conditions.push("graduation_year = ?");
    params.push(graduationYear);
  }

  if (course) {
    conditions.push("course = ?");
    params.push(course);
  }

  return {
    whereClause: conditions.join(" AND "),
    params
  };
}

export async function searchAlumni({
  orgId,
  search,
  batch,
  graduationYear,
  course,
  page,
  limit
}) {
  const { whereClause, params } = buildFilters({
    orgId,
    search,
    batch,
    graduationYear,
    course
  });

  const offset = (page - 1) * limit;

  const rows = await query(
    `
      SELECT
        id,
        org_id,
        first_name,
        last_name,
        email,
        phone,
        batch,
        graduation_year,
        course,
        status,
        created_at,
        updated_at
      FROM client_alumni_profiles
      WHERE ${whereClause}
      ORDER BY
        graduation_year DESC,
        last_name ASC,
        first_name ASC
      LIMIT ?
      OFFSET ?
    `,
    [...params, limit, offset]
  );

  const countRows = await query(
    `
      SELECT COUNT(*) AS total
      FROM client_alumni_profiles
      WHERE ${whereClause}
    `,
    params
  );

  return {
    rows,
    total: Number(countRows[0]?.total || 0)
  };
}

export async function getAlumniStatistics(orgId) {
  const totalRows = await query(
    `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive
      FROM client_alumni_profiles
      WHERE org_id = ?
    `,
    [orgId]
  );

  const courseRows = await query(
    `
      SELECT
        course,
        COUNT(*) AS total
      FROM client_alumni_profiles
      WHERE org_id = ?
      GROUP BY course
      ORDER BY total DESC, course ASC
    `,
    [orgId]
  );

  const yearRows = await query(
    `
      SELECT
        graduation_year,
        COUNT(*) AS total
      FROM client_alumni_profiles
      WHERE org_id = ?
      GROUP BY graduation_year
      ORDER BY graduation_year DESC
    `,
    [orgId]
  );

  const batchRows = await query(
    `
      SELECT
        batch,
        COUNT(*) AS total
      FROM client_alumni_profiles
      WHERE org_id = ?
      GROUP BY batch
      ORDER BY batch DESC
    `,
    [orgId]
  );

  const summary = totalRows[0] || {};

  return {
    total: Number(summary.total || 0),
    active: Number(summary.active || 0),
    inactive: Number(summary.inactive || 0),

    byCourse: courseRows.map((row) => ({
      course: row.course,
      total: Number(row.total)
    })),

    byGraduationYear: yearRows.map((row) => ({
      graduationYear: Number(row.graduation_year),
      total: Number(row.total)
    })),

    byBatch: batchRows.map((row) => ({
      batch: row.batch,
      total: Number(row.total)
    }))
  };
}

export async function getAlumniBatches(orgId) {
  const rows = await query(
    `
      SELECT
        batch,
        graduation_year,
        COUNT(*) AS total
      FROM client_alumni_profiles
      WHERE org_id = ?
      GROUP BY batch, graduation_year
      ORDER BY graduation_year DESC, batch DESC
    `,
    [orgId]
  );

  return rows.map((row) => ({
    batch: row.batch,
    graduationYear: Number(row.graduation_year),
    total: Number(row.total)
  }));
}