'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./audience.controller');
const { setAudienceBody, previewBody, eventIdParams } = require('./audience.validation');

const router = Router({ mergeParams: true });

// BEFORE the /:eventId routes, so "audience" is never read as an event id.
// Prices a rule set for an event that does not exist yet, so the school sees
// who it reaches while composing rather than after saving.
router.post('/audience/preview',
  requirePermission('events.manage'),
  validate(previewBody),
  controller.previewDraftAudience);

// Reading who an event is for needs events.view; changing it needs
// events.manage — the same split the rest of the module uses. Preview is a
// WRITE-shaped question (it is part of composing an audience), so it sits
// behind manage rather than view.
router.get('/:eventId/audience',
  requirePermission('events.view'),
  validate(eventIdParams, 'params'),
  controller.getAudience);

router.put('/:eventId/audience',
  requirePermission('events.manage'),
  validate(eventIdParams, 'params'),
  validate(setAudienceBody),
  controller.setAudience);

router.post('/:eventId/audience/preview',
  requirePermission('events.manage'),
  validate(eventIdParams, 'params'),
  validate(previewBody),
  controller.previewAudience);

module.exports = router;
