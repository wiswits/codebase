'use strict';
const { transaction } = require('../../../config/db');
const { AppError } = require('../_kit');
const visitorQueries = require('./visitor.queries');
const passQueries = require('../pass/pass.queries');

async function listVisitors({ orgId, search, status, visitorType, page, limit, schoolId }) {
  const { rows, total } = await visitorQueries.listVisitors(orgId, {
    search,
    status,
    visitorType,
    page,
    limit,
    schoolId,
  });
  const counts = await visitorQueries.visitorCounts(orgId, schoolId);
  return {
    visitors: rows,
    counts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  };
}

// schoolId is the branch the request resolved to (null = not scoped), threaded
// from the controller because resolving it needs `req`.
async function getVisitor(orgId, visitorId, schoolId = null) {
  const visitor = await visitorQueries.findVisitorById(orgId, visitorId, undefined, schoolId);
  if (!visitor) throw new AppError(404, 'VISITOR_NOT_FOUND', 'Visitor not found.');
  // The pass hangs off a visit this caller has already been allowed to read, so
  // it needs no branch check of its own — the gate above is the gate.
  const pass = await passQueries.findLatestPassByVisitorId(orgId, visitorId);
  return { ...visitor, pass };
}

async function checkInVisitor(data, orgId, userId, schoolId = null) {
  return visitorQueries.createVisitor(data, orgId, userId, schoolId);
}

/**
 * Close a visit and revoke its gate pass in ONE transaction.
 *
 * Upstream did the pass revocation after the status update and outside any
 * transaction, so a crash in between left an active pass on a visitor who had
 * already left the building — a pass that still reads valid at the gate. The
 * row lock plus the `AND status = 'checked_in'` clause inside the UPDATE also
 * close the double-checkout race: the pre-check alone can be overtaken.
 */
function closeVisit({ orgId, visitorId, userId, to, schoolId = null }) {
  const isCancel = to === 'cancelled';
  return transaction(async (conn) => {
    const existing = await visitorQueries.findVisitorByIdForUpdate(orgId, visitorId, conn, schoolId);
    if (!existing) throw new AppError(404, 'VISITOR_NOT_FOUND', 'Visitor not found.');
    if (existing.status !== 'checked_in') {
      throw new AppError(
        409,
        isCancel ? 'VISITOR_NOT_CANCELLABLE' : 'VISITOR_NOT_CHECKED_IN',
        isCancel
          ? 'Only a checked-in visit can be cancelled.'
          : 'Only a checked-in visitor can be checked out.'
      );
    }

    const updated = isCancel
      ? await visitorQueries.cancelVisitor(orgId, visitorId, userId, conn, schoolId)
      : await visitorQueries.checkOutVisitor(orgId, visitorId, userId, conn, schoolId);

    if (!updated) {
      throw new AppError(
        409,
        isCancel ? 'VISITOR_NOT_CANCELLABLE' : 'VISITOR_NOT_CHECKED_IN',
        isCancel
          ? 'Only a checked-in visit can be cancelled.'
          : 'Only a checked-in visitor can be checked out.'
      );
    }

    await passQueries.revokePassesForVisitor(orgId, visitorId, conn);
    return updated;
  });
}

const checkOutVisitor = ({ orgId, visitorId, userId, schoolId }) =>
  closeVisit({ orgId, visitorId, userId, schoolId, to: 'checked_out' });

const cancelVisitor = ({ orgId, visitorId, userId, schoolId }) =>
  closeVisit({ orgId, visitorId, userId, schoolId, to: 'cancelled' });

module.exports = {
  listVisitors,
  getVisitor,
  checkInVisitor,
  checkOutVisitor,
  cancelVisitor,
};
