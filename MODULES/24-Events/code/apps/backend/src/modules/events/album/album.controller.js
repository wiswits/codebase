'use strict';
const { success } = require('../../../utils/response');
const { audit } = require('../../../utils/audit');
const { asyncHandler } = require('../_kit');
const { getActiveSchool } = require('../../../utils/activeSchool');
const albumService = require('./album.service');

// POST /api/events/:eventId/album  → create (or return existing) photo album.
const createAlbum = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const album = await albumService.ensureEventAlbum({
    orgId: req.user.org_id,
    eventId,
    userId: req.user.user_id,
    schoolId: await getActiveSchool(req),
  });
  if (album.created) {
    await audit(req, 'EVENT_ALBUM_CREATE', 'event', Number(eventId), {
      new_data: { albumId: album.albumId },
    });
  }
  return success(res, { album }, album.created ? 'Album created' : 'Album already linked', album.created ? 201 : 200);
});

// GET /api/events/:eventId/album  → linked album summary, or null.
const getAlbum = asyncHandler(async (req, res) => {
  const album = await albumService.getEventAlbum({
    orgId: req.user.org_id,
    eventId: req.params.eventId,
    schoolId: await getActiveSchool(req),
  });
  return success(res, { album }, 'Event album fetched');
});

module.exports = { createAlbum, getAlbum };
