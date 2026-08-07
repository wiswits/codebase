export function mapAlumni(row) {
  return {
    id: row.id,
    organizationId: row.org_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    batch: row.batch,
    graduationYear: Number(row.graduation_year),
    course: row.course,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}