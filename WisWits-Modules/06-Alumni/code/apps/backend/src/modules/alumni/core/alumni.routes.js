'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./alumni.controller');
const { alumniIdParams, listQuery, updateAlumniSchema } = require('./alumni.validation');

const router = Router();

// The EduSuite build had no auth, no permission check and no audit anywhere —
// its own README deferred all three to the host platform. These are them.
router.get('/', requirePermission('alumni.view'), validate(listQuery, 'query'), controller.getAllAlumni);

router.get(
  '/:alumniId',
  requirePermission('alumni.view'),
  validate(alumniIdParams, 'params'),
  controller.getAlumnusById
);

router.patch(
  '/:alumniId',
  requirePermission('alumni.manage'),
  validate(alumniIdParams, 'params'),
  validate(updateAlumniSchema),
  controller.updateAlumnus
);

module.exports = router;
