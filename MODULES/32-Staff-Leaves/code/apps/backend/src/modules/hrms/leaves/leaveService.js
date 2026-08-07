const { query, queryOne } = require('../../../config/db');
const logger = require('../../../utils/logger');

const LEAVE_STAFF = ['owner', 'admin', 'principal', 'coordinator', 'hod', 'super_admin', 'system_admin'];

// CANONICAL "awaiting approval" predicate for client_leave_requests.
//
// The status enum is ('pending','pending_parent','pending_teacher','pending_admin',
// 'approved','rejected','cancelled') and the column DEFAULTS to 'pending_teacher' —
// a plain 'pending' row is the rare legacy case, not the norm. Anything counting
// `status='pending'` therefore reports ~0 while the approval queue is full: that is
// exactly why the Admin dashboard showed "Leave requests 0" next to an AI insight
// saying "2 leave requests require approval" (QA round-5).
//
// It is a fixed SQL fragment with no interpolated input — safe to embed; every
// caller still passes org_id as a bound parameter.
const PENDING_LEAVE_SQL = "status LIKE 'pending%'";

// Is this parent linked to this student?
async function parentOwnsStudent(orgId, userId, studentId) {
  if (!studentId) return false;
  const parent = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [orgId, userId]);
  if (!parent) return false;
  const link = await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, studentId]);
  return !!link;
}

// Does this teacher (user id) teach this student's section?
//
// This was a second, private copy of the timetable-only predicate. It drifted
// the moment middleware/teacherScope stopped being timetable-only, which would
// have left a JDPS class teacher able to see their students everywhere EXCEPT
// their leave requests. Two definitions of "teaches" is one too many — there is
// now exactly one, and this defers to it. — JDPS P-0, 2026-07-29
const { teacherTeachesStudent } = require('../../../middleware/teacherScope');

// Who may READ a specific leave: staff, the applicant, the student's parent,
// or a teacher who teaches the student (medical certs / PII otherwise leak).
async function canViewLeave(user, leave) {
  if (!leave) return false;
  if (LEAVE_STAFF.includes(user.role_slug)) return true;
  if (leave.applicant_user_id === user.user_id) return true;
  if (user.role_slug === 'parent') return parentOwnsStudent(leave.org_id, user.user_id, leave.student_id);
  if (user.role_slug === 'teacher') {
    if (leave.teacher_approver_id === user.user_id) return true;
    return teacherTeachesStudent(leave.org_id, user.user_id, leave.student_id);
  }
  return false;
}

// ═════════ Helper: compute days between dates ═════════
function computeDays(from, to, halfDay) {
  if (!from || !to) return 0;
  const f = new Date(from);
  const t = new Date(to);
  const days = Math.floor((t - f) / (1000 * 60 * 60 * 24)) + 1;
  return halfDay && days === 1 ? 0.5 : days;
}

// ═════════ Resolve role of applicant ═════════
async function getUserRole(userId) {
  const r = await queryOne(`
    SELECT r.base_role, r.slug FROM client_user_roles ur
    JOIN client_roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? LIMIT 1
  `, [userId]);
  return r?.base_role || null;
}

// ═════════ Find teacher approver for a student ═════════
async function findStudentTeacher(orgId, studentId) {
  // Find class teacher of student's section
  const r = await queryOne(`
    SELECT s.class_teacher_id FROM client_students st
    JOIN client_enrollments e ON e.student_id = st.id
    JOIN client_sections s ON s.id = e.section_id
    WHERE st.id = ? AND st.org_id = ?
    ORDER BY e.created_at DESC LIMIT 1
  `, [studentId, orgId]).catch(() => null);
  return r?.class_teacher_id || null;
}

// ═════════ Find parent of a student ═════════
async function findStudentParent(studentId) {
  const r = await queryOne(`
    SELECT ps.parent_id FROM client_parent_students ps
    WHERE ps.student_id = ?
    ORDER BY ps.is_primary DESC LIMIT 1
  `, [studentId]).catch(() => null);
  return r?.parent_id || null;
}

// ═════════ Notification helper ═════════
async function notify(orgId, recipientId, title, body, actionUrl, priority = 'normal') {
  if (!recipientId) return;
  try {
    await query(`
      INSERT INTO client_notifications (org_id, recipient_id, user_id, title, body, action_url, icon, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'CalendarOff', ?, NOW())
    `, [orgId, recipientId, recipientId, title, body, actionUrl, priority]);
  } catch (e) { logger.error('Leave notify failed: ' + e.message); }
}

// ═════════ CREATE leave request ═════════
async function createLeave({ orgId, applicantUserId, applicantRole, payload }) {
  const {
    leave_type_slug, from_date, to_date, reason, half_day = 0,
    attachments = [], student_id = null, initiated_by = 'self', is_urgent = 0
  } = payload;

  if (!leave_type_slug || !from_date || !to_date || !reason) {
    throw new Error('Type, dates, and reason are required');
  }
  if (new Date(from_date) > new Date(to_date)) throw new Error('End date must be after start date');

  const days = computeDays(from_date, to_date, half_day);

  // Determine applicant + initial status
  let applicantType, targetStudentId = null, status, currentApproverRole, approverId = null;

  if (applicantRole === 'student') {
    applicantType = 'student';
    // Student needs to lookup their own student.id
    const st = await queryOne('SELECT id FROM client_students WHERE user_id=?', [applicantUserId]);
    if (!st) throw new Error('Student profile not found');
    targetStudentId = st.id;
    // Student → parent approval first
    status = 'pending_parent';
    currentApproverRole = 'parent';
    approverId = await findStudentParent(targetStudentId);
  } else if (applicantRole === 'parent') {
    applicantType = 'student';
    if (!student_id) throw new Error('Child (student_id) required when parent applies');
    // A parent may only file a leave for THEIR OWN linked child — never an
    // arbitrary (cross-section / cross-tenant) student_id from the payload.
    if (!(await parentOwnsStudent(orgId, applicantUserId, student_id))) {
      throw new Error('You can only apply leave for your own child');
    }
    targetStudentId = student_id;
    // Parent-initiated → goes directly to teacher (or admin if >3 days)
    if (days > 3) {
      status = 'pending_admin';
      currentApproverRole = 'admin';
    } else {
      status = 'pending_teacher';
      currentApproverRole = 'teacher';
      approverId = await findStudentTeacher(orgId, targetStudentId);
    }
  } else {
    // Staff (teacher/admin/etc.)
    applicantType = 'staff';
    status = 'pending_admin';
    currentApproverRole = 'admin';
  }

  const escalated = (applicantType === 'student' && days > 3) ? 1 : 0;

  const result = await query(`
    INSERT INTO client_leave_requests (
      org_id, user_id, applicant_type, applicant_user_id, student_id,
      leave_type, leave_type_slug, from_date, to_date, days, half_day,
      reason, attachments, initiated_by, status, current_approver_role,
      escalated_to_admin, is_urgent, parent_approver_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    orgId, applicantUserId, applicantType, applicantUserId, targetStudentId,
    leave_type_slug, leave_type_slug, from_date, to_date, days, half_day ? 1 : 0,
    reason, attachments.length ? JSON.stringify(attachments) : null,
    initiated_by, status, currentApproverRole, escalated,
    is_urgent ? 1 : 0,
    applicantRole === 'student' ? approverId : null
  ]);

  const leaveId = result.insertId;

  // Fire notifications
  const actionUrl = applicantType === 'student' ? `/admin/leaves/${leaveId}` : `/admin/leaves/${leaveId}`;
  if (status === 'pending_parent' && approverId) {
    await notify(orgId, approverId, 'Your child applied for leave', `${reason.substring(0, 80)} — please review`, `/parent/leaves/${leaveId}`, 'high');
  } else if (status === 'pending_teacher' && approverId) {
    await notify(orgId, approverId, 'New student leave request', `Leave for ${days} day(s) — requires your approval`, `/teacher/leaves/${leaveId}`, 'normal');
  } else if (status === 'pending_admin') {
    // Notify all admins
    const admins = await query(`
      SELECT DISTINCT u.id FROM client_users u
      JOIN client_user_roles ur ON ur.user_id = u.id
      JOIN client_roles r ON r.id = ur.role_id
      WHERE u.org_id = ? AND r.base_role IN ('admin','owner') AND u.is_active = 1
    `, [orgId]);
    for (const a of admins) {
      await notify(orgId, a.id, 'New leave request', `${applicantType === 'staff' ? 'Staff' : 'Student'} leave for ${days} day(s)`, `/admin/leaves/${leaveId}`, is_urgent ? 'high' : 'normal');
    }
  }

  return getLeave(orgId, leaveId);
}

// ═════════ GET single leave with full details ═════════
async function getLeave(orgId, leaveId) {
  const r = await queryOne(`
    SELECT lr.*,
      CONCAT(u.first_name,' ',u.last_name) AS applicant_name,
      u.email AS applicant_email,
      u.profile_photo_url AS applicant_photo,
      st.admission_number,
      CONCAT(su.first_name,' ',su.last_name) AS student_name,
      sec.name AS section_name,
      cls.name AS class_name,
      lt.name AS leave_type_name,
      lt.color AS leave_type_color,
      lt.icon AS leave_type_icon,
      CONCAT(pa.first_name,' ',pa.last_name) AS parent_approver_name,
      CONCAT(ta.first_name,' ',ta.last_name) AS teacher_approver_name,
      CONCAT(aa.first_name,' ',aa.last_name) AS admin_approver_name
    FROM client_leave_requests lr
    LEFT JOIN client_users u ON u.id = lr.applicant_user_id
    LEFT JOIN client_students st ON st.id = lr.student_id
    LEFT JOIN client_users su ON su.id = st.user_id
    LEFT JOIN client_enrollments e ON e.student_id = st.id
    LEFT JOIN client_sections sec ON sec.id = e.section_id
    LEFT JOIN client_classes cls ON cls.id = sec.class_id
    LEFT JOIN client_leave_types lt ON lt.slug = lr.leave_type_slug AND lt.org_id = lr.org_id
    LEFT JOIN client_users pa ON pa.id = lr.parent_approver_id
    LEFT JOIN client_users ta ON ta.id = lr.teacher_approver_id
    LEFT JOIN client_users aa ON aa.id = lr.admin_approver_id
    WHERE lr.id = ? AND lr.org_id = ?
    LIMIT 1
  `, [leaveId, orgId]);
  if (!r) return null;
  try { r.attachments_parsed = r.attachments ? JSON.parse(r.attachments) : []; } catch { r.attachments_parsed = []; }
  return r;
}

// ═════════ LIST leaves with filters + role scoping ═════════
async function listLeaves(orgId, userId, role, filters = {}) {
  const where = ['lr.org_id = ?'];
  const params = [orgId];

  // Role-based scoping
  if (role === 'student') {
    where.push('lr.applicant_user_id = ?');
    params.push(userId);
  } else if (role === 'parent') {
    // Parent sees their own-initiated OR student-initiated for their children
    const pStudents = await query(`
      SELECT ps.student_id FROM client_parent_students ps
      JOIN client_parents p ON p.id = ps.parent_id
      WHERE p.user_id = ? AND COALESCE(ps.status,'active')='active'
    `, [userId]).catch(() => []);
    const ids = pStudents.map(x => x.student_id);
    if (ids.length === 0) return { requests: [], total: 0 };
    where.push(`(lr.applicant_user_id = ? OR lr.student_id IN (${ids.map(() => '?').join(',')}))`);
    params.push(userId, ...ids);
  } else if (role === 'teacher') {
    if (filters.view === 'to_approve') {
      // Teacher's approval queue: student leaves routed to them
      where.push(`lr.status = 'pending_teacher' AND lr.teacher_approver_id = ?`);
      params.push(userId);
    } else {
      // Teacher's own leaves
      where.push('lr.applicant_user_id = ?');
      params.push(userId);
    }
  }
  // admin/owner sees all

  if (filters.status) { where.push('lr.status = ?'); params.push(filters.status); }
  if (filters.applicant_type) { where.push('lr.applicant_type = ?'); params.push(filters.applicant_type); }
  if (filters.leave_type) { where.push('lr.leave_type_slug = ?'); params.push(filters.leave_type); }
  if (filters.from) { where.push('lr.from_date >= ?'); params.push(filters.from); }
  if (filters.to) { where.push('lr.to_date <= ?'); params.push(filters.to); }
  if (filters.search) {
    where.push('(lr.reason LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }

  const rows = await query(`
    SELECT lr.*,
      CONCAT(u.first_name,' ',u.last_name) AS applicant_name,
      u.profile_photo_url AS applicant_photo,
      CONCAT(su.first_name,' ',su.last_name) AS student_name,
      st.admission_number,
      sec.name AS section_name,
      cls.name AS class_name,
      lt.name AS leave_type_name,
      lt.color AS leave_type_color,
      lt.icon AS leave_type_icon
    FROM client_leave_requests lr
    LEFT JOIN client_users u ON u.id = lr.applicant_user_id
    LEFT JOIN client_students st ON st.id = lr.student_id
    LEFT JOIN client_users su ON su.id = st.user_id
    LEFT JOIN client_enrollments e ON e.student_id = st.id
    LEFT JOIN client_sections sec ON sec.id = e.section_id
    LEFT JOIN client_classes cls ON cls.id = sec.class_id
    LEFT JOIN client_leave_types lt ON lt.slug = lr.leave_type_slug AND lt.org_id = lr.org_id
    WHERE ${where.join(' AND ')}
    ORDER BY lr.is_urgent DESC, lr.created_at DESC
    LIMIT 200
  `, params);

  return { requests: rows, total: rows.length };
}

// ═════════ APPROVE / REJECT ═════════
async function decideLeave(orgId, leaveId, deciderUserId, deciderRole, decision, remarks) {
  const leave = await queryOne('SELECT * FROM client_leave_requests WHERE id=? AND org_id=?', [leaveId, orgId]);
  if (!leave) throw new Error('Leave not found');
  if (['approved', 'rejected', 'cancelled'].includes(leave.status)) throw new Error('Leave already ' + leave.status);

  // Check authorization by role
  const role = deciderRole === 'owner' ? 'admin' : deciderRole;
  if (leave.current_approver_role !== role) {
    throw new Error(`This request needs ${leave.current_approver_role} approval, not ${role}`);
  }

  // ...and that this specific person is entitled to approve THIS leave — role
  // alone let any parent approve any student's leave, any teacher any student's.
  if (role === 'parent' && !(await parentOwnsStudent(orgId, deciderUserId, leave.student_id))) {
    throw new Error('You can only decide leave for your own child');
  }
  if (role === 'teacher') {
    const assigned = leave.teacher_approver_id && leave.teacher_approver_id === deciderUserId;
    if (!assigned && !(await teacherTeachesStudent(orgId, deciderUserId, leave.student_id))) {
      throw new Error('You can only decide leave for students in your classes');
    }
  }

  let newStatus = leave.status;
  let nextApprover = null;
  let nextApproverRole = null;
  const updates = [];
  const params = [];

  if (decision === 'reject') {
    newStatus = 'rejected';
    updates.push('status = ?', 'rejection_reason = ?');
    params.push(newStatus, remarks || 'Rejected');
  } else if (decision === 'approve') {
    if (role === 'parent') {
      updates.push('parent_approved_at = NOW()', 'parent_approver_id = ?');
      params.push(deciderUserId);
      // Next step: teacher (or admin if >3 days)
      if (leave.days > 3) {
        newStatus = 'pending_admin';
        nextApproverRole = 'admin';
      } else {
        newStatus = 'pending_teacher';
        nextApproverRole = 'teacher';
        nextApprover = await findStudentTeacher(orgId, leave.student_id);
      }
      updates.push('status = ?', 'current_approver_role = ?', 'teacher_approver_id = ?');
      params.push(newStatus, nextApproverRole, nextApprover);
    } else if (role === 'teacher') {
      updates.push('teacher_approved_at = NOW()', 'teacher_approver_id = ?');
      params.push(deciderUserId);
      if (leave.days > 3) {
        newStatus = 'pending_admin';
        nextApproverRole = 'admin';
        updates.push('status = ?', 'current_approver_role = ?');
        params.push(newStatus, nextApproverRole);
      } else {
        newStatus = 'approved';
        updates.push('status = ?', 'current_approver_role = NULL');
        params.push(newStatus);
      }
    } else if (role === 'admin') {
      updates.push('admin_approved_at = NOW()', 'admin_approver_id = ?');
      params.push(deciderUserId);
      newStatus = 'approved';
      updates.push('status = ?', 'current_approver_role = NULL');
      params.push(newStatus);
    }
  }

  params.push(leaveId);
  await query(`UPDATE client_leave_requests SET ${updates.join(', ')} WHERE id = ?`, params);

  // Notify
  const title = decision === 'approve' && newStatus === 'approved'
    ? '✅ Your leave was approved'
    : decision === 'reject'
      ? '❌ Your leave was rejected'
      : '📋 Leave moved to next approver';
  const body = remarks ? `Remarks: ${remarks}` : '';
  await notify(orgId, leave.applicant_user_id, title, body, `/${await getUserRole(leave.applicant_user_id)}/leaves/${leaveId}`, 'high');

  if (nextApprover && newStatus.startsWith('pending_')) {
    await notify(orgId, nextApprover, 'Leave awaiting your approval', `${leave.reason?.substring(0, 80) || ''}`, `/${nextApproverRole}/leaves/${leaveId}`, 'high');
  }
  if (newStatus === 'pending_admin') {
    const admins = await query(`
      SELECT DISTINCT u.id FROM client_users u
      JOIN client_user_roles ur ON ur.user_id = u.id
      JOIN client_roles r ON r.id = ur.role_id
      WHERE u.org_id = ? AND r.base_role IN ('admin','owner') AND u.is_active = 1
    `, [orgId]);
    for (const a of admins) await notify(orgId, a.id, 'Leave escalated to admin', `${leave.days} day(s) — needs admin sign-off`, `/admin/leaves/${leaveId}`, 'high');
  }

  return getLeave(orgId, leaveId);
}

// ═════════ CANCEL (applicant cancels own request) ═════════
async function cancelLeave(orgId, leaveId, userId) {
  const leave = await queryOne('SELECT * FROM client_leave_requests WHERE id=? AND org_id=?', [leaveId, orgId]);
  if (!leave) throw new Error('Not found');
  if (leave.applicant_user_id !== userId) throw new Error('Only the applicant can cancel');
  if (['approved', 'rejected', 'cancelled'].includes(leave.status)) throw new Error('Cannot cancel ' + leave.status);

  await query(`UPDATE client_leave_requests SET status='cancelled' WHERE id=?`, [leaveId]);
  return { ok: true };
}

// ═════════ STATS for admin dashboard ═════════
async function getStats(orgId) {
  const s = await queryOne(`
    SELECT 
      SUM(${PENDING_LEAVE_SQL}) AS pending,
      SUM(status='pending_admin') AS pending_admin,
      SUM(status='approved') AS approved,
      SUM(status='rejected') AS rejected,
      SUM(applicant_type='student' AND status LIKE 'pending%') AS pending_students,
      SUM(applicant_type='staff' AND status LIKE 'pending%') AS pending_staff,
      SUM(is_urgent=1 AND status LIKE 'pending%') AS urgent,
      COUNT(*) AS total
    FROM client_leave_requests
    WHERE org_id = ? AND created_at > NOW() - INTERVAL 90 DAY
  `, [orgId]);
  return s || {};
}

// ═════════ LEAVE TYPES for org ═════════
async function listLeaveTypes(orgId, applicantRole = null) {
  const where = ['org_id = ?', 'is_active = 1'];
  const params = [orgId];
  if (applicantRole === 'student' || applicantRole === 'parent') {
    where.push(`applies_to IN ('student','both')`);
  } else if (applicantRole === 'teacher' || applicantRole === 'admin') {
    where.push(`applies_to IN ('staff','both')`);
  }
  return query(`SELECT * FROM client_leave_types WHERE ${where.join(' AND ')} ORDER BY sort_order, name`, params);
}

module.exports = {
  createLeave, getLeave, listLeaves, decideLeave, cancelLeave, canViewLeave,
  getStats, listLeaveTypes, computeDays, PENDING_LEAVE_SQL
};
