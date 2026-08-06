'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./visitor.controller');
const { checkInSchema, visitorIdParams, listQuery } = require('./visitor.validation');

const router = Router();

// Upstream shipped a requirePermission() that set a property on the request and
// called next() — it authorised nothing, so any authenticated user could cancel
// anyone's visit. These are the real platform gates.
router.get('/', requirePermission('visitors.view'), validate(listQuery, 'query'), controller.getAllVisitors);

router.post(
  '/check-in',
  requirePermission('visitors.manage'),
  validate(checkInSchema),
  controller.checkInVisitor
);

router.get(
  '/:visitorId',
  requirePermission('visitors.view'),
  validate(visitorIdParams, 'params'),
  controller.getVisitorById
);

router.patch(
  '/:visitorId/check-out',
  requirePermission('visitors.manage'),
  validate(visitorIdParams, 'params'),
  controller.checkOutVisitor
);

router.patch(
  '/:visitorId/cancel',
  requirePermission('visitors.manage'),
  validate(visitorIdParams, 'params'),
  controller.cancelVisitor
);

module.exports = router;
