const { query, queryOne, transaction } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { generateUniqueInviteCode } = require('../../utils/inviteCode');

const RATE_LIMIT_WINDOW_MS = 3600000;
const RATE_LIMIT_MAX = 10;

async function checkRateLimit(userId) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const rows = await query(
    'SELECT COUNT(*) AS cnt FROM client_link_attempts WHERE user_id = ? AND attempted_at >= ?',
    [userId, since]
  );
  return rows[0].cnt < RATE_LIMIT_MAX;
}

async function logAttempt(userId, ip, type, ok) {
  await query(
    'INSERT INTO client_link_attempts (user_id, ip_address, attempt_type, was_successful) VALUES (?, ?, ?, ?)',
    [userId, ip || null, type, ok ? 1 : 0]
  );
}

// POST /api/students/:id/invite-code/regenerate
exports.regenerateInviteCode = async (req, res) => {
  const studentId = req.params.id;
  const { org_id, user_id, role_slug: role } = req.user;
  try {
    const student = await queryOne(
      'SELECT id, user_id FROM client_students WHERE id = ? AND org_id = ?',
      [studentId, org_id]
    );
    if (!student) return error(res, 'Student not found', 404);
    const isOwner = student.user_id === user_id;
    const isPrivileged = ['admin','principal','owner','teacher'].includes(role);
    if (!isOwner && !isPrivileged) return error(res, 'Not authorized', 403);
    const { code, expiresAt } = await generateUniqueInviteCode(org_id, studentId, 30);
    return success(res, { invite_code: code, expires_at: expiresAt }, 'Invite code generated');
  } catch (e) {
    console.error('regenerateInviteCode:', e);
    return error(res, 'Failed to generate invite code', 500);
  }
};

// POST /api/parent-link/by-code  (parent uses code → auto-approve)
exports.linkByInviteCode = async (req, res) => {
  const { invite_code, relation, is_primary = false } = req.body;
  const { org_id, user_id, role_slug: role } = req.user;
  const ip = req.ip;

  if (role !== 'parent') return error(res, 'Only parents can use this endpoint', 403);
  if (!invite_code || !relation) return error(res, 'invite_code and relation required', 400);

  const allowed = await checkRateLimit(user_id);
  if (!allowed) return error(res, 'Too many attempts. Try again in 1 hour.', 429);

  try {
    // Resolve parent profile id from user_id
    const parent = await queryOne('SELECT id FROM client_parents WHERE user_id = ? AND org_id = ?', [user_id, org_id]);
    if (!parent) return error(res, 'Parent profile not found. Complete profile first.', 404);

    const result = await transaction(async (conn) => {
      const [students] = await conn.execute(
        'SELECT id, invite_code_expires_at FROM client_students WHERE invite_code = ? AND org_id = ?',
        [invite_code.toUpperCase(), org_id]
      );
      if (!students.length) {
        await conn.execute('INSERT INTO client_link_attempts (user_id, ip_address, attempt_type, was_successful) VALUES (?, ?, ?, 0)', [user_id, ip || null, 'invite_code']);
        throw new Error('INVALID_CODE');
      }
      const student = students[0];
      if (student.invite_code_expires_at && new Date(student.invite_code_expires_at) < new Date()) {
        await conn.execute('INSERT INTO client_link_attempts (user_id, ip_address, attempt_type, was_successful) VALUES (?, ?, ?, 0)', [user_id, ip || null, 'invite_code']);
        throw new Error('EXPIRED_CODE');
      }
      const [existing] = await conn.execute(
        'SELECT id, status FROM client_parent_students WHERE parent_id = ? AND student_id = ?',
        [parent.id, student.id]
      );
      if (existing.length) throw new Error('ALREADY_LINKED:' + existing[0].status);

      if (is_primary) {
        const [primaries] = await conn.execute(
          `SELECT COUNT(*) AS cnt FROM client_parent_students WHERE student_id = ? AND is_primary = 1 AND status = 'active'`,
          [student.id]
        );
        if (primaries[0].cnt >= 2) throw new Error('PRIMARY_LIMIT');
      }

      await conn.execute(
        `INSERT INTO client_parent_students (org_id, parent_id, student_id, relation, is_primary, status, link_method, approved_at)
         VALUES (?, ?, ?, ?, ?, 'active', 'invite_code', NOW())`,
        [org_id, parent.id, student.id, relation, is_primary ? 1 : 0]
      );
      await conn.execute('INSERT INTO client_link_attempts (user_id, ip_address, attempt_type, was_successful) VALUES (?, ?, ?, 1)', [user_id, ip || null, 'invite_code']);
      return { linked: true, student_id: student.id, status: 'active' };
    });
    return success(res, result, 'Linked successfully');
  } catch (e) {
    if (e.message === 'INVALID_CODE') return error(res, 'Invalid invite code', 404);
    if (e.message === 'EXPIRED_CODE') return error(res, 'Invite code expired. Ask student to regenerate.', 410);
    if (e.message.startsWith('ALREADY_LINKED:')) return error(res, 'Already linked (' + e.message.split(':')[1] + ')', 409);
    if (e.message === 'PRIMARY_LIMIT') return error(res, 'Maximum 2 primary parents allowed', 409);
    console.error('linkByInviteCode:', e);
    return error(res, 'Link failed', 500);
  }
};

// POST /api/parent-link/request  (manual request → admin approves)
exports.requestLink = async (req, res) => {
  const { student_id, relation, message } = req.body;
  const { org_id, user_id, role_slug: role } = req.user;
  if (!['parent','student','teacher'].includes(role)) return error(res, 'Not authorized', 403);
  if (!student_id || !relation) return error(res, 'student_id and relation required', 400);
  try {
    const student = await queryOne('SELECT id FROM client_students WHERE id = ? AND org_id = ?', [student_id, org_id]);
    if (!student) return error(res, 'Student not found', 404);
    const existing = await queryOne(
      `SELECT id FROM client_link_requests WHERE requester_user_id = ? AND target_student_id = ? AND status = 'pending'`,
      [user_id, student_id]
    );
    if (existing) return error(res, 'Pending request already exists', 409);
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    const result = await query(
      `INSERT INTO client_link_requests (org_id, requester_user_id, requester_role, target_student_id, proposed_relation, link_method, message, expires_at)
       VALUES (?, ?, ?, ?, ?, 'self_request', ?, ?)`,
      [org_id, user_id, role, student_id, relation, message || null, expiresAt]
    );
    return success(res, { request_id: result.insertId, status: 'pending', expires_at: expiresAt }, 'Request submitted');
  } catch (e) {
    console.error('requestLink:', e);
    return error(res, 'Request failed', 500);
  }
};

// POST /api/parent-link/requests/:id/approve  (admin)
exports.approveLinkRequest = async (req, res) => {
  const requestId = req.params.id;
  const { is_primary = false } = req.body;
  const { org_id, user_id, role_slug: role } = req.user;
  if (!['admin','principal','owner'].includes(role)) return error(res, 'Admin only', 403);

  try {
    const result = await transaction(async (conn) => {
      const [reqs] = await conn.execute(
        `SELECT * FROM client_link_requests WHERE id = ? AND org_id = ? AND status = 'pending' FOR UPDATE`,
        [requestId, org_id]
      );
      if (!reqs.length) throw new Error('NOT_FOUND');
      const r = reqs[0];
      if (new Date(r.expires_at) < new Date()) {
        await conn.execute(`UPDATE client_link_requests SET status = 'expired' WHERE id = ?`, [requestId]);
        throw new Error('EXPIRED');
      }
      const [parents] = await conn.execute('SELECT id FROM client_parents WHERE user_id = ? AND org_id = ?', [r.requester_user_id, org_id]);
      if (!parents.length) throw new Error('PARENT_PROFILE_MISSING');
      const parentId = parents[0].id;

      await conn.execute(
        `INSERT INTO client_parent_students (org_id, parent_id, student_id, relation, is_primary, status, link_method, approved_by_user_id, approved_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NOW())
         ON DUPLICATE KEY UPDATE status = 'active', approved_by_user_id = VALUES(approved_by_user_id), approved_at = NOW()`,
        [org_id, parentId, r.target_student_id, r.proposed_relation, is_primary ? 1 : 0, r.link_method, user_id]
      );
      await conn.execute(
        `UPDATE client_link_requests SET status = 'approved', reviewed_by_user_id = ?, reviewed_at = NOW() WHERE id = ?`,
        [user_id, requestId]
      );
      return { approved: true };
    });
    return success(res, result, 'Request approved');
  } catch (e) {
    if (e.message === 'NOT_FOUND') return error(res, 'Pending request not found', 404);
    if (e.message === 'EXPIRED') return error(res, 'Request expired', 410);
    if (e.message === 'PARENT_PROFILE_MISSING') return error(res, 'Parent profile missing for requester', 404);
    console.error('approveLinkRequest:', e);
    return error(res, 'Approval failed', 500);
  }
};

// POST /api/parent-link/requests/:id/reject
exports.rejectLinkRequest = async (req, res) => {
  const requestId = req.params.id;
  const { reason } = req.body;
  const { org_id, user_id, role_slug: role } = req.user;
  if (!['admin','principal','owner'].includes(role)) return error(res, 'Admin only', 403);
  try {
    const result = await query(
      `UPDATE client_link_requests SET status = 'rejected', reviewed_by_user_id = ?, reviewed_at = NOW(), rejection_reason = ?
       WHERE id = ? AND org_id = ? AND status = 'pending'`,
      [user_id, reason || null, requestId, org_id]
    );
    if (!result.affectedRows) return error(res, 'Pending request not found', 404);
    return success(res, { rejected: true }, 'Request rejected');
  } catch (e) {
    console.error('rejectLinkRequest:', e);
    return error(res, 'Reject failed', 500);
  }
};

// DELETE /api/parent-link/links/:id  (admin only unlink)
exports.unlinkParent = async (req, res) => {
  const linkId = req.params.id;
  const { reason } = req.body;
  const { org_id, user_id, role_slug: role } = req.user;
  if (!['admin','principal','owner'].includes(role)) return error(res, 'Only admin can unlink. Contact your institution.', 403);
  try {
    const result = await query(
      `UPDATE client_parent_students SET status = 'revoked', revoked_by_user_id = ?, revoked_at = NOW(), revoke_reason = ?
       WHERE id = ? AND org_id = ? AND status = 'active'`,
      [user_id, reason || null, linkId, org_id]
    );
    if (!result.affectedRows) return error(res, 'Active link not found', 404);
    return success(res, { unlinked: true }, 'Unlinked');
  } catch (e) {
    console.error('unlinkParent:', e);
    return error(res, 'Unlink failed', 500);
  }
};

// GET /api/students/:id/parents
exports.getStudentParents = async (req, res) => {
  const studentId = req.params.id;
  const { org_id, role_slug: role } = req.user;
  // Returns parents' email + phone — was reachable by any authenticated org
  // member with no check at all (IDOR via student id iteration). Same
  // admin-only gate this file already uses for other student-linked data.
  if (!['admin', 'principal', 'owner', 'super_admin', 'system_admin'].includes(role)) {
    return error(res, 'Admin only', 403);
  }
  try {
    const rows = await query(
      `SELECT ps.id AS link_id, ps.relation, ps.is_primary, ps.status, ps.link_method, ps.created_at,
              p.id AS parent_id, u.id AS user_id, u.email, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS full_name, u.phone
       FROM client_parent_students ps
       JOIN client_parents p ON p.id = ps.parent_id
       JOIN client_users u ON u.id = p.user_id
       WHERE ps.student_id = ? AND ps.org_id = ? AND ps.status = 'active'
       ORDER BY ps.is_primary DESC, ps.created_at ASC`,
      [studentId, org_id]
    );
    return success(res, { parents: rows });
  } catch (e) {
    console.error('getStudentParents:', e);
    return error(res, 'Fetch failed', 500);
  }
};

// GET /api/parent-link/me/children
exports.getMyChildren = async (req, res) => {
  const { org_id, user_id, role_slug: role } = req.user;
  if (role !== 'parent') return error(res, 'Parent only', 403);
  try {
    const rows = await query(
      `SELECT s.id, s.admission_number, s.lifecycle_status, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS full_name, u.email,
              ps.relation, ps.is_primary, ps.created_at AS linked_at
       FROM client_parent_students ps
       JOIN client_parents p ON p.id = ps.parent_id
       JOIN client_students s ON s.id = ps.student_id
       JOIN client_users u ON u.id = s.user_id
       WHERE p.user_id = ? AND ps.org_id = ? AND ps.status = 'active'
       ORDER BY ps.is_primary DESC`,
      [user_id, org_id]
    );
    return success(res, { children: rows });
  } catch (e) {
    console.error('getMyChildren:', e);
    return error(res, 'Fetch failed', 500);
  }
};

// GET /api/parent-link/requests?status=pending  (admin)
exports.listLinkRequests = async (req, res) => {
  const { status = 'pending' } = req.query;
  const { org_id, role_slug: role } = req.user;
  if (!['admin','principal','owner'].includes(role)) return error(res, 'Admin only', 403);
  try {
    const rows = await query(
      `SELECT lr.*, u.email AS requester_email, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS requester_name,
              s.admission_number, CONCAT(su.first_name, ' ', COALESCE(su.last_name, '')) AS student_name
       FROM client_link_requests lr
       JOIN client_users u ON u.id = lr.requester_user_id
       JOIN client_students s ON s.id = lr.target_student_id
       LEFT JOIN client_users su ON su.id = s.user_id
       WHERE lr.org_id = ? AND lr.status = ?
       ORDER BY lr.created_at DESC LIMIT 200`,
      [org_id, status]
    );
    return success(res, { requests: rows });
  } catch (e) {
    console.error('listLinkRequests:', e);
    return error(res, 'Fetch failed', 500);
  }
};
