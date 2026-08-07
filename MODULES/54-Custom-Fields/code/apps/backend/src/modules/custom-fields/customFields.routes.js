'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('./customFields.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.use(authenticate);

// Elevated staff who administer org settings. Governance (`fields` dim) is the
// second gate inside each mutation — a locked dim returns 403 even for these.
const canManage = requireRole('owner', 'admin', 'principal', 'super_admin', 'system_admin');

// GET is open to any authenticated org user: the entity forms render from these
// defs, and field labels are not sensitive.
router.get('/:entity', ctrl.list);

// reorder is static — must precede the /:id routes
router.put('/:entity/reorder', canManage, ctrl.reorder);

router.post('/:entity', canManage, ctrl.create);
router.put('/:entity/:id', canManage, ctrl.update);
router.delete('/:entity/:id', canManage, ctrl.remove);

module.exports = router;
