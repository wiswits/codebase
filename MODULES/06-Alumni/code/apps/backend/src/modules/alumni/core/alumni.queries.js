'use strict';
const { pool } = require('../../../config/db');
const { pushBranchFilter } = require('../../../utils/activeSchool');

/**
 * An alumnus is a real student who left. The profile row carries what happened
 * AFTER school (employer, course, links, mentorship); the person themselves —
 * name, email, phone — stays where this platform already keeps people, on
 * client_users via client_students. That is why this module creates no table of
 * its own: duplicating names into an alumni table would give a school two
 * spellings of the same person and no way to say which is right.
 */
const FROM_ALUMNI = `
  FROM client_alumni_profiles a
  JOIN client_students s ON s.id = a.student_id AND s.org_id = a.org_id
  JOIN client_users   u ON u.id = s.user_id     AND u.org_id = a.org_id
`;

const SELECT_FIELDS = `
  a.id,
  a.org_id            AS orgId,
  a.student_id        AS studentId,
  a.graduation_year   AS graduationYear,
  a.final_grade       AS finalGrade,
  a.current_institution AS currentInstitution,
  a.current_program   AS currentProgram,
  a.current_company   AS currentCompany,
  a.current_designation AS currentDesignation,
  a.linkedin_url      AS linkedinUrl,
  a.achievements,
  a.willing_to_mentor AS willingToMentor,
  a.willing_to_refer  AS willingToRefer,
  -- testimonial is deliberately NOT selected here. The directory never renders
  -- it, so shipping an unapproved testimonial to every browser that opens the
  -- list is a disclosure with no feature behind it. Add it back only where it
  -- is actually shown.
  a.testimonial_approved AS testimonialApproved,
  a.last_engagement_at AS lastEngagementAt,
  a.created_at        AS createdAt,
  a.updated_at        AS updatedAt,
  u.first_name        AS firstName,
  u.last_name         AS lastName,
  u.email,
  u.phone,
  u.is_active         AS isActive,
  s.admission_number  AS admissionNumber,
  s.stream,
  s.board,
  s.graduation_date   AS graduationDate
`;

function buildFilters(orgId, { search, graduationYear, stream, schoolId }) {
  const conditions = ['a.org_id = ?'];
  const params = [orgId];

  // The branch lives on the student, not on the profile — which is why this
  // module needed no column of its own. The join it filters through is already
  // in FROM_ALUMNI and was already in scope on every read; only the predicate
  // was missing.
  pushBranchFilter(conditions, params, schoolId, 's.school_id');

  if (search) {
    conditions.push(
      "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR s.admission_number LIKE ? OR a.current_company LIKE ?)"
    );
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term);
  }
  if (graduationYear !== undefined) {
    conditions.push('a.graduation_year = ?');
    params.push(graduationYear);
  }
  if (stream) {
    conditions.push('s.stream = ?');
    params.push(stream);
  }

  return { whereClause: conditions.join(' AND '), params };
}

async function listAlumni(orgId, { search, graduationYear, stream, page, limit, schoolId }) {
  const offset = (page - 1) * limit;
  const { whereClause, params } = buildFilters(orgId, { search, graduationYear, stream, schoolId });

  // pool.query (not execute) for the paginated SELECT: mysql2's prepared-statement
  // protocol rejects `LIMIT ?/OFFSET ?` on some engines (ER_WRONG_ARGUMENTS).
  // query() still escapes the `?` params — injection-safe on both MariaDB and MySQL.
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     ${FROM_ALUMNI}
     WHERE ${whereClause}
     ORDER BY a.graduation_year DESC, u.last_name ASC, u.first_name ASC, a.id ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total ${FROM_ALUMNI} WHERE ${whereClause}`,
    params
  );

  return { rows, total: Number(countRows[0].total) };
}

async function findAlumnusById(orgId, alumniId, schoolId = null) {
  // Guessing an id must not defeat the branch filter, so the by-id read carries
  // the same predicate the list does. This is also the gate the UPDATE relies
  // on — see updateAlumnus.
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} ${FROM_ALUMNI}
      WHERE a.org_id = ? AND a.id = ?
        AND (? IS NULL OR s.school_id IS NULL OR s.school_id = ?)
      LIMIT 1`,
    [orgId, alumniId, schoolId, schoolId]
  );
  return rows[0] || null;
}

/**
 * Summary for the page header. One pass for the totals, then the two groupings
 * the directory filters are built from — so the dropdowns only ever offer values
 * that actually match something.
 */
async function alumniStats(orgId, schoolId = null) {
  // The header counts and the filter dropdowns are built from these three, so
  // they carry the same branch predicate as the list. A count that includes the
  // other campus is its own disclosure — "412 alumni" on a screen showing 180 of
  // them tells a branch admin exactly how much they are not being shown.
  const branch = '(? IS NULL OR s.school_id IS NULL OR s.school_id = ?)';

  const [totals] = await pool.execute(
    `SELECT COUNT(*) AS total,
            SUM(u.is_active = 1) AS active,
            SUM(a.willing_to_mentor = 1) AS mentors,
            SUM(a.current_company IS NOT NULL AND a.current_company <> '') AS placed
     ${FROM_ALUMNI}
     WHERE a.org_id = ? AND ${branch}`,
    [orgId, schoolId, schoolId]
  );

  const [byYear] = await pool.execute(
    `SELECT a.graduation_year AS graduationYear, COUNT(*) AS total
     ${FROM_ALUMNI}
     WHERE a.org_id = ? AND ${branch} AND a.graduation_year IS NOT NULL
     GROUP BY a.graduation_year
     ORDER BY a.graduation_year DESC`,
    [orgId, schoolId, schoolId]
  );

  const [byStream] = await pool.execute(
    `SELECT s.stream, COUNT(*) AS total
     ${FROM_ALUMNI}
     WHERE a.org_id = ? AND ${branch} AND s.stream IS NOT NULL AND s.stream <> ''
     GROUP BY s.stream
     ORDER BY total DESC, s.stream ASC`,
    [orgId, schoolId, schoolId]
  );

  const t = totals[0] || {};
  return {
    total: Number(t.total || 0),
    active: Number(t.active || 0),
    mentors: Number(t.mentors || 0),
    placed: Number(t.placed || 0),
    byYear: byYear.map((r) => ({ graduationYear: Number(r.graduationYear), total: Number(r.total) })),
    byStream: byStream.map((r) => ({ stream: r.stream, total: Number(r.total) })),
  };
}

/**
 * Only the after-school fields are writable here. Name, email and phone belong
 * to the person's user record and are edited there — an alumni screen that let
 * you retype a name would just create a second version of the truth.
 */
const UPDATABLE = {
  graduationYear: 'graduation_year',
  finalGrade: 'final_grade',
  currentInstitution: 'current_institution',
  currentProgram: 'current_program',
  currentCompany: 'current_company',
  currentDesignation: 'current_designation',
  linkedinUrl: 'linkedin_url',
  achievements: 'achievements',
  willingToMentor: 'willing_to_mentor',
  willingToRefer: 'willing_to_refer',
  testimonial: 'testimonial',
  testimonialApproved: 'testimonial_approved',
};

async function updateAlumnus(orgId, alumniId, data, schoolId = null) {
  const updates = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (data[key] === undefined) continue;
    updates.push(`${column} = ?`);
    const boolean = key === 'willingToMentor' || key === 'willingToRefer' || key === 'testimonialApproved';
    params.push(boolean ? (data[key] ? 1 : 0) : data[key]);
  }

  if (updates.length === 0) return findAlumnusById(orgId, alumniId, schoolId);

  // The branch check is in the UPDATE itself, not only in the read before it.
  // The service does read first, but a read-then-write gate is a decision made
  // on a row nobody is holding — and this UPDATE was the one confirmed
  // cross-branch write on the platform: (id, org_id) alone matched another
  // campus's record and reported affectedRows = 1. client_alumni_profiles has
  // no branch column, so the predicate reaches the student it belongs to, the
  // same hop the reads make.
  params.push(alumniId, orgId, schoolId, schoolId, orgId);
  const [result] = await pool.execute(
    `UPDATE client_alumni_profiles SET ${updates.join(', ')}
      WHERE id = ? AND org_id = ?
        AND (? IS NULL OR student_id IN (
              SELECT id FROM client_students
               WHERE (school_id IS NULL OR school_id = ?) AND org_id = ?))`,
    params
  );
  if (result.affectedRows === 0) return null;
  return findAlumnusById(orgId, alumniId, schoolId);
}

module.exports = { listAlumni, findAlumnusById, alumniStats, updateAlumnus, UPDATABLE };
