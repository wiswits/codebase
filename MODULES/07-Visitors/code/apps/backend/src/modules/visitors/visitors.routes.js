'use strict';
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');

const passRoutes = require('./pass/pass.routes');
const coreVisitorRoutes = require('./core/visitor.routes');

const router = Router();

// Every Visitor Management route requires authentication. Tenant identity comes
// from req.user.org_id (set by authenticate) — never from body/query/params.
router.use(authenticate);

// Pass routes first: they own the literal "/:visitorId/pass" segment. Core CRUD
// mounts last because it contains the bare "/:visitorId" matcher, which would
// otherwise swallow anything more specific.
router.use('/', passRoutes);
router.use('/', coreVisitorRoutes);

module.exports = router;
