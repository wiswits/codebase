'use strict';
const { pool } = require('../../../config/db');
const { BRANCH_SQL } = require('../../../utils/activeSchool');

const SELECT_FIELDS = `
  id,
  org_id        AS orgId,
  lead_id       AS leadId,
  document_type AS documentType,
  document_name AS documentName,
  is_required   AS isRequired,
  status,
  remarks,
  verified_by   AS verifiedBy,
  verified_at   AS verifiedAt,
  created_at    AS createdAt,
  updated_at    AS updatedAt
`;

/**
 * The lead this checklist belongs to, scoped by org.
 *
 * Every document call goes through here first. The foreign key is on lead_id
 * alone — client_leads has no unique index on (org_id, id) for a composite key
 * to point at — so the database by itself would not stop a row claiming one org
 * while pointing at another's applicant. This read is what closes that. The
 * EduSuite original had the identical gap and shipped a hand-run SELECT to spot
 * violations after the fact instead of preventing them.
 */
async function findLeadForOrg(orgId, leadId, schoolId = null) {
  const [rows] = await pool.execute(
    `SELECT id, org_id AS orgId, first_name AS firstName, last_name AS lastName,
            converted_student_id AS convertedStudentId
     FROM client_leads WHERE id = ? AND org_id = ? AND ${BRANCH_SQL} LIMIT 1`,
    [leadId, orgId, schoolId, schoolId]
  );
  return rows[0] || null;
}

/**
 * A document carries no branch of its own — it hangs off the applicant, and the
 * applicant's campus is the answer. One subquery, so the by-id read, the update
 * and the delete cannot drift apart on which lead counts as reachable.
 */
const DOC_BRANCH_SQL = `(? IS NULL OR lead_id IN (
  SELECT id FROM client_leads WHERE org_id = ? AND (school_id IS NULL OR school_id = ?)))`;
const docBranchParams = (orgId, schoolId) => [schoolId, orgId, schoolId];

async function listForLead(orgId, leadId) {
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM client_admission_documents
     WHERE org_id = ? AND lead_id = ?
     ORDER BY is_required DESC, document_name ASC, id ASC`,
    [orgId, leadId]
  );
  return rows;
}

async function findById(orgId, documentId, schoolId = null) {
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM client_admission_documents
     WHERE org_id = ? AND id = ? AND ${DOC_BRANCH_SQL} LIMIT 1`,
    [orgId, documentId, ...docBranchParams(orgId, schoolId)]
  );
  return rows[0] || null;
}

async function createDocument(orgId, leadId, data, userId, schoolId = null) {
  const verified = data.status === 'verified';
  const [result] = await pool.execute(
    `INSERT INTO client_admission_documents
      (org_id, lead_id, document_type, document_name, is_required, status, remarks,
       verified_by, verified_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId,
      leadId,
      data.documentType,
      data.documentName,
      data.isRequired === false ? 0 : 1,
      data.status || 'pending',
      data.remarks || null,
      verified ? userId || null : null,
      verified ? new Date() : null,
      userId || null,
    ]
  );
  return findById(orgId, result.insertId, schoolId);
}

const UPDATABLE = {
  documentName: 'document_name',
  isRequired: 'is_required',
  status: 'status',
  remarks: 'remarks',
};

/**
 * document_type is intentionally not updatable: it is part of the uniqueness key
 * that stops the same paper being listed twice. Renaming the display name is
 * fine; changing what the row IS would let two rows collapse onto one type.
 */
async function updateDocument(orgId, documentId, data, userId, schoolId = null) {
  const updates = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATABLE)) {
    if (data[key] === undefined) continue;
    updates.push(`${column} = ?`);
    params.push(key === 'isRequired' ? (data[key] ? 1 : 0) : data[key]);
  }

  // Who verified and when are derived from the caller and the clock, never taken
  // from the request. Upstream accepted verifiedBy straight from the body, so
  // anyone could sign off a document in someone else's name.
  if (data.status !== undefined) {
    if (data.status === 'verified') {
      updates.push('verified_by = ?', 'verified_at = NOW()');
      params.push(userId || null);
    } else {
      updates.push('verified_by = NULL', 'verified_at = NULL');
    }
  }

  if (updates.length === 0) return findById(orgId, documentId, schoolId);

  params.push(documentId, orgId, ...docBranchParams(orgId, schoolId));
  const [result] = await pool.execute(
    `UPDATE client_admission_documents SET ${updates.join(', ')}
      WHERE id = ? AND org_id = ? AND ${DOC_BRANCH_SQL}`,
    params
  );
  if (result.affectedRows === 0) return null;
  return findById(orgId, documentId, schoolId);
}

async function deleteDocument(orgId, documentId, schoolId = null) {
  const [result] = await pool.execute(
    `DELETE FROM client_admission_documents WHERE id = ? AND org_id = ? AND ${DOC_BRANCH_SQL}`,
    [documentId, orgId, ...docBranchParams(orgId, schoolId)]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findLeadForOrg,
  listForLead,
  findById,
  createDocument,
  updateDocument,
  deleteDocument,
  UPDATABLE,
};
