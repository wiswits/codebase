'use strict';
/*
 * ADMIN router — manage the org's admissions form (enable, copy link, edit copy).
 * Authenticated + elevated-role only. Governance-agnostic: the form reuses the
 * org's custom-field defs (which ARE governed under the `fields` dim).
 */
const express = require('express');
const router = express.Router();
const ctrl = require('./publicForms.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

router.use(authenticate);
router.use(requireRole('owner', 'admin', 'principal', 'super_admin', 'system_admin'));

// back-compat: the default admissions form
router.get('/admissions', ctrl.adminGet);
router.put('/admissions', ctrl.adminUpdate);

// generic Form Builder — any named public form for any entity
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id/submissions', ctrl.submissions);
// A single response, deleted for good — the responses table is the ORIGINAL
// record a lead was made from, so there is nothing further back to restore
// from. Declared before `/:id` so the two-segment path is matched first.
router.delete('/:id/submissions/:subId', ctrl.removeSubmission);
router.put('/:id', ctrl.updateForm);
router.delete('/:id', ctrl.removeForm);

module.exports = router;
