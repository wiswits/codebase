'use strict';
const { AppError } = require('../_kit');
const alumniQueries = require('./alumni.queries');

// schoolId is the branch the request resolved to (null = not scoped). It is
// threaded from the controller rather than looked up here, because resolving it
// needs `req` — the header and the caller's memberships — and the service layer
// deliberately never sees a request object.
async function listAlumni({ orgId, search, graduationYear, stream, page, limit, schoolId }) {
  const { rows, total } = await alumniQueries.listAlumni(orgId, {
    search,
    graduationYear,
    stream,
    page,
    limit,
    schoolId,
  });
  const stats = await alumniQueries.alumniStats(orgId, schoolId);
  return {
    alumni: rows,
    stats,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  };
}

async function getAlumnus(orgId, alumniId, schoolId = null) {
  const alumnus = await alumniQueries.findAlumnusById(orgId, alumniId, schoolId);
  if (!alumnus) throw new AppError(404, 'ALUMNUS_NOT_FOUND', 'That alumni record was not found.');
  return alumnus;
}

async function updateAlumnus(orgId, alumniId, data, schoolId = null) {
  // Read first so a record in another org — or another branch — is a clean 404
  // rather than a silent no-op that would report success for something that was
  // never touched. The UPDATE carries the same branch predicate itself, so this
  // read is the courtesy, not the guard.
  await getAlumnus(orgId, alumniId, schoolId);
  const updated = await alumniQueries.updateAlumnus(orgId, alumniId, data, schoolId);
  if (!updated) throw new AppError(404, 'ALUMNUS_NOT_FOUND', 'That alumni record was not found.');
  return updated;
}

module.exports = { listAlumni, getAlumnus, updateAlumnus };
