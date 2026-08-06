import { query } from "../../../config/database.js";

export async function findAlumniById(orgId, alumniId) {
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
      WHERE org_id = ?
        AND id = ?
      LIMIT 1
    `,
    [orgId, alumniId]
  );

  return rows[0] || null;
}