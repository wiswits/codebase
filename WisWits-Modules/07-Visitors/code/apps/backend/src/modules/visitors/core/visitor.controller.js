'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const visitorService = require('./visitor.service');

const getAllVisitors = asyncHandler(async (req, res) => {
  const { search, status, visitorType, page, limit } = req.query;
  const result = await visitorService.listVisitors({
    orgId: req.user.org_id,
    search,
    status,
    visitorType,
    page,
    limit,
    // Resolved here, from the request — the service never sees `req`.
    schoolId: await getActiveSchool(req),
  });
  return success(res, result, 'Visitors fetched');
});

const getVisitorById = asyncHandler(async (req, res) => {
  const visitor = await visitorService.getVisitor(req.user.org_id, req.params.visitorId, await getActiveSchool(req));
  return success(res, { visitor }, 'Visitor fetched');
});

const checkInVisitor = asyncHandler(async (req, res) => {
  const visitor = await visitorService.checkInVisitor(
    req.body,
    req.user.org_id,
    req.user.user_id,
    await getActiveSchool(req)
  );
  await audit(req, 'VISITOR_CHECKIN', 'visitor', visitor.id, {
    new_data: {
      visitorName: visitor.visitorName,
      hostId: visitor.hostId,
      purpose: visitor.purpose,
    },
  });
  return success(res, { visitor }, 'Visitor checked in', 201);
});

const checkOutVisitor = asyncHandler(async (req, res) => {
  const visitor = await visitorService.checkOutVisitor({
    orgId: req.user.org_id,
    visitorId: req.params.visitorId,
    userId: req.user.user_id,
    schoolId: await getActiveSchool(req),
  });
  await audit(req, 'VISITOR_CHECKOUT', 'visitor', visitor.id, {
    new_data: { checkOutAt: visitor.checkOutAt },
  });
  return success(res, { visitor }, 'Visitor checked out');
});

const cancelVisitor = asyncHandler(async (req, res) => {
  const visitor = await visitorService.cancelVisitor({
    orgId: req.user.org_id,
    visitorId: req.params.visitorId,
    userId: req.user.user_id,
    schoolId: await getActiveSchool(req),
  });
  await audit(req, 'VISITOR_CANCEL', 'visitor', visitor.id, {
    old_data: { status: 'checked_in' },
    new_data: { status: 'cancelled' },
  });
  return success(res, { visitor }, 'Visit cancelled');
});

module.exports = {
  getAllVisitors,
  getVisitorById,
  checkInVisitor,
  checkOutVisitor,
  cancelVisitor,
};
