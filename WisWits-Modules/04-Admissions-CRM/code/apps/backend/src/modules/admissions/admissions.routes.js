'use strict';
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');

const coreRoutes = require('./core/admissions.routes');

const router = Router();

// Tenant identity comes from req.user.org_id (set by authenticate) — never from
// body/query/params. The EduSuite original took it from an env constant.
router.use(authenticate);
router.use('/', coreRoutes);

module.exports = router;
