'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./pass.controller');
const { issuePassSchema, visitorIdParams } = require('./pass.validation');

const router = Router();

router.post(
  '/:visitorId/pass',
  requirePermission('visitors.pass_manage'),
  validate(visitorIdParams, 'params'),
  validate(issuePassSchema),
  controller.issuePass
);

router.get(
  '/:visitorId/pass',
  requirePermission('visitors.view'),
  validate(visitorIdParams, 'params'),
  controller.getPass
);

module.exports = router;
