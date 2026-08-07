const { query, transaction } = require('../../config/db');
const { getActiveSchool, getWriteSchool, BRANCH_SQL } = require('../../utils/activeSchool');
const { success, error } = require('../../utils/response');
const { canTransition, getAllowedNext } = require('../../utils/lifecycleStateMachine');
const meters = require('../../services/meters');
const { audit } = require('../../utils/audit');

exports.transitionStatus = async (req, res) => {
  const studentId = req.params.id;
  const { to_status, reason, metadata } = req.body;
  const { org_id, user_id, role_slug: role } = req.user;

  if (!['admin','principal','owner'].includes(role)) return error(res, 'Admin only', 403);
  if (!to_status) return error(res, 'to_status required', 400);

  try {
    const result = await transaction(async (conn) => {
      const [students] = await conn.execute(
        'SELECT id, lifecycle_status FROM client_students WHERE id = ? AND org_id = ? FOR UPDATE',
        [studentId, org_id]
      );
      if (!students.length) throw new Error('NOT_FOUND');
      const fromStatus = students[0].lifecycle_status;
      if (!canTransition(fromStatus, to_status)) {
        throw new Error('INVALID_TRANSITION:' + fromStatus + ':' + getAllowedNext(fromStatus).join(','));
      }
      await conn.execute(
        'UPDATE client_students SET lifecycle_status = ?, lifecycle_changed_at = NOW() WHERE id = ?',
        [to_status, studentId]
      );
      await conn.execute(
        'INSERT INTO client_lifecycle_history (org_id, student_id, from_status, to_status, changed_by_user_id, reason, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [org_id, studentId, fromStatus, to_status, user_id, reason || null, metadata ? JSON.stringify(metadata) : null]
      );
      if (to_status === 'alumni') {
        await conn.execute(
          'INSERT IGNORE INTO client_alumni_profiles (org_id, student_id, graduation_year) VALUES (?, ?, YEAR(NOW()))',
          [org_id, studentId]
        );
        await conn.execute('UPDATE client_students SET graduation_date = NOW() WHERE id = ?', [studentId]);
      }
      if (to_status === 'enrolled' || to_status === 'active') {
        await conn.execute('UPDATE client_students SET admission_date = COALESCE(admission_date, NOW()) WHERE id = ?', [studentId]);
      }
      return { from: fromStatus, to: to_status };
    });
    // Every lifecycle move is auditable, but the two ends of it are the ones §12
    // names by name: entering the school is an Admission, leaving it is the
    // student-removal event. Recorded under those action names so a search for
    // "who admitted this child" finds this route too, not just the convert ones.
    const action = ['enrolled', 'active'].includes(result.to) ? 'ADMISSION'
      : ['withdrawn', 'alumni', 'archived'].includes(result.to) ? 'STUDENT_DELETE'
      : 'STUDENT_LIFECYCLE';
    await audit(req, action, 'student', Number(studentId), {
      old_data: { lifecycle_status: result.from },
      new_data: { lifecycle_status: result.to, reason: reason || null },
    });
    return success(res, result, 'Lifecycle updated');
  } catch (e) {
    if (e.message === 'NOT_FOUND') return error(res, 'Student not found', 404);
    if (e.message.startsWith('INVALID_TRANSITION:')) {
      const parts = e.message.split(':');
      return error(res, 'Cannot transition from ' + parts[1] + '. Allowed: ' + (parts[2] || 'none'), 400);
    }
    console.error('transitionStatus:', e);
    return error(res, 'Transition failed', 500);
  }
};

exports.getHistory = async (req, res) => {
  const studentId = req.params.id;
  const { org_id, role_slug: role } = req.user;
  // Free-text reason/metadata (withdrawal/suspension reasons etc) was
  // reachable by any authenticated org member with no check — same gate
  // transitionStatus already uses.
  if (!['admin', 'principal', 'owner'].includes(role)) return error(res, 'Admin only', 403);
  try {
    const rows = await query(
      `SELECT h.*, u.email AS changed_by_email
       FROM client_lifecycle_history h
       LEFT JOIN client_users u ON u.id = h.changed_by_user_id
       WHERE h.student_id = ? AND h.org_id = ?
       ORDER BY h.changed_at DESC LIMIT 100`,
      [studentId, org_id]
    );
    return success(res, { history: rows });
  } catch (e) {
    console.error('getHistory:', e);
    return error(res, 'Fetch failed', 500);
  }
};

exports.getAllowedTransitions = async (req, res) => {
  const studentId = req.params.id;
  const { org_id } = req.user;
  try {
    const rows = await query(
      'SELECT lifecycle_status FROM client_students WHERE id = ? AND org_id = ?',
      [studentId, org_id]
    );
    if (!rows.length) return error(res, 'Student not found', 404);
    return success(res, { current: rows[0].lifecycle_status, allowed: getAllowedNext(rows[0].lifecycle_status) });
  } catch (e) {
    console.error('getAllowedTransitions:', e);
    return error(res, 'Fetch failed', 500);
  }
};

// Convert existing CRM lead to student (uses existing client_leads table)
exports.convertLeadToStudent = async (req, res) => {
  const leadId = req.params.id;
  const { admission_number, user_id: studentUserId } = req.body;
  const { org_id, user_id, role_slug: role } = req.user;

  if (!['admin','principal','owner'].includes(role)) return error(res, 'Admin only', 403);
  if (!studentUserId) return error(res, 'user_id (for student account) required', 400);

  // PLAN LIMIT (KI-118) — before the transaction opens, so a refusal never holds a
  // FOR UPDATE lock on the lead row. Enrolling a lead consumes headcount like any
  // other admission route.
  const cap = await meters.checkHeadcount(org_id, 'students', 1);
  if (!cap.ok) return error(res, cap.message, 402);

  // Resolved HERE, in the function that uses them. They lived in
  // transitionStatus for one commit — a different function entirely — so every
  // call to this route died on a ReferenceError before the branch gate below
  // ever ran, including in single-branch organisations that are not scoped at
  // all. The cross-branch case still "failed", which is exactly why no
  // assertion of the form "not 200" would have caught it.
  const activeSchool = await getActiveSchool(req);
  const writeSchool = await getWriteSchool(req);

  try {
    const result = await transaction(async (conn) => {
      const [leads] = await conn.execute(
        `SELECT * FROM client_leads WHERE id = ? AND org_id = ? AND ${BRANCH_SQL} FOR UPDATE`,
        [leadId, org_id, activeSchool, activeSchool]
      );
      if (!leads.length) throw new Error('LEAD_NOT_FOUND');
      const lead = leads[0];
      if (lead.converted_student_id) throw new Error('ALREADY_CONVERTED');

      // The branch the child is admitted into. This is the SECOND conversion
      // route — crm.routes.js has the other — and it had the identical defect:
      // school_id was never set, so every student admitted here landed with a
      // NULL branch, missing from their own campus's roster and present on
      // every other one.
      const [stuRes] = await conn.execute(
        `INSERT INTO client_students (org_id, user_id, admission_number, lifecycle_status, admission_date, school_id)
         VALUES (?, ?, ?, 'enrolled', NOW(), ?)`,
        [org_id, studentUserId, admission_number || null, lead.school_id ?? writeSchool]
      );
      const studentId = stuRes.insertId;

      await conn.execute(
        `INSERT INTO client_lifecycle_history (org_id, student_id, from_status, to_status, changed_by_user_id, reason)
         VALUES (?, ?, 'lead', 'enrolled', ?, 'Converted from CRM lead #' || ?)`,
        [org_id, studentId, user_id, leadId]
      ).catch(async () => {
        // Fallback if MariaDB doesn't accept || in prepared
        await conn.execute(
          `INSERT INTO client_lifecycle_history (org_id, student_id, from_status, to_status, changed_by_user_id, reason)
           VALUES (?, ?, 'lead', 'enrolled', ?, ?)`,
          [org_id, studentId, user_id, 'Converted from CRM lead #' + leadId]
        );
      });

      // org_id was missing here entirely (§17). The FOR UPDATE read above
      // already proved the row is ours, so this was not independently
      // exploitable — but a WHERE that names only an id is one refactor away
      // from being the bug.
      await conn.execute(
        'UPDATE client_leads SET converted_student_id = ?, is_won = 1 WHERE id = ? AND org_id = ?',
        [studentId, leadId, org_id]
      );

      return { student_id: studentId, lead_id: parseInt(leadId) };
    });
    // §12 Admission. client_lifecycle_history already records the state change,
    // but it is scoped to the student and cascades away with them; the audit row
    // is the org-level record that survives and carries who/where/when.
    await audit(req, 'ADMISSION', 'student', result.student_id, {
      new_data: { via: 'lifecycle_lead', lead_id: result.lead_id, admission_number: admission_number || null },
    });
    return success(res, result, 'Lead converted to student');
  } catch (e) {
    if (e.message === 'LEAD_NOT_FOUND') return error(res, 'Lead not found', 404);
    if (e.message === 'ALREADY_CONVERTED') return error(res, 'Lead already converted', 409);
    console.error('convertLeadToStudent:', e);
    return error(res, 'Conversion failed', 500);
  }
};
