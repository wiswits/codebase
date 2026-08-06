'use strict';
const { Router } = require('express');
const { requirePermission } = require('../../../middleware/rbac');
const { validate } = require('../_kit');
const controller = require('./album.controller');
const { eventIdParams } = require('./album.validation');

/**
 * Event photo-album link. Creating/linking an album is a management action
 * (events.manage — admin/principal/teacher). Reading the link needs events.view
 * (which students/parents also have → they can find the album to view photos).
 * Actual photo upload/view reuses the existing Gallery endpoints unchanged.
 *
 * Mounts before core CRUD so "/:eventId/album" is not read as an ":eventId".
 */
const router = Router();

router.post(
  '/:eventId/album',
  requirePermission('events.manage'),
  validate(eventIdParams, 'params'),
  controller.createAlbum
);

router.get(
  '/:eventId/album',
  requirePermission('events.view'),
  validate(eventIdParams, 'params'),
  controller.getAlbum
);

module.exports = router;
