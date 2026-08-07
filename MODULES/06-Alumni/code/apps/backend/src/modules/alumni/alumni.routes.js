'use strict';
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');

const coreAlumniRoutes = require('./core/alumni.routes');

const router = Router();

// Every Alumni route requires authentication. Tenant identity comes from
// req.user.org_id (set by authenticate) — never from body/query/params.
router.use(authenticate);
router.use('/', coreAlumniRoutes);

module.exports = router;
