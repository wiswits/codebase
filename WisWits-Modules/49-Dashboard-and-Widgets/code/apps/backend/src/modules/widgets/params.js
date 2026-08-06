/*
 * Uniform /api/v1 query contract (PLATFORM_STANDARDS.md §9, F2).
 * Every widgets endpoint parses its list params through here so pagination,
 * sorting, search and date windows behave identically platform-wide.
 * Sorting is whitelist-only — a sort key not in `allowedSorts` silently falls
 * back to the default (never into SQL).
 */
'use strict';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseListParams(req, { allowedSorts = [], defaultSort = null, defaultLimit = 20, maxLimit = 100 } = {}) {
  const q = req.query || {};
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(q.limit, 10) || defaultLimit));
  const order = String(q.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sort = allowedSorts.includes(q.sort) ? q.sort : defaultSort;
  const search = typeof q.search === 'string' ? q.search.trim().slice(0, 100) : '';
  const status = typeof q.status === 'string' && /^[\w-]{1,40}$/.test(q.status) ? q.status : null;
  const dateFrom = DATE_RE.test(q.date_from || '') ? q.date_from : null;
  const dateTo = DATE_RE.test(q.date_to || '') ? q.date_to : null;
  const intOrNull = (v) => (v != null && /^\d{1,12}$/.test(String(v)) ? Number(v) : null);
  return {
    page, limit, offset: (page - 1) * limit, sort, order, search, status, dateFrom, dateTo,
    classId: intOrNull(q.class_id ?? q.class), sectionId: intOrNull(q.section_id ?? q.section),
    subjectId: intOrNull(q.subject_id ?? q.subject), teacherId: intOrNull(q.teacher_id ?? q.teacher),
    studentId: intOrNull(q.student_id),
    academicYear: typeof q.academic_year === 'string' && /^[\d-]{4,9}$/.test(q.academic_year) ? q.academic_year : null,
    term: typeof q.term === 'string' ? q.term.slice(0, 30) : null,
  };
}

// "Today" is always IST wall time (platform idiom) — ONE definition, shared
// with the attendance module and the dashboards via utils/schoolDay.js.
const { istToday } = require('../../utils/schoolDay');

const ELEVATED = ['owner', 'admin', 'principal', 'coordinator', 'hod', 'super_admin', 'system_admin'];
const isElevated = (req) => ELEVATED.includes((req.user?.role_slug || '').toLowerCase());

module.exports = { parseListParams, istToday, isElevated, ELEVATED };
