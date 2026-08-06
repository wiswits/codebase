'use strict';
const { AppError } = require('../_kit');
const eventQueries = require('../shared/event.queries');
const albumQueries = require('./album.queries');
const galleryService = require('../../gallery/gallery.service');

/**
 * Ensure a managed event has a linked Gallery photo album, creating one if
 * needed. Idempotent: if the event is already linked to a live album, that album
 * is returned instead of creating a second one.
 */
async function ensureEventAlbum({ orgId, eventId, userId, schoolId = null }) {
  const event = await eventQueries.findEventById(orgId, eventId, undefined, schoolId);
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');

  if (event.galleryAlbumId) {
    const existing = await galleryService.getAlbumSummary(orgId, event.galleryAlbumId);
    if (existing) return { ...existing, created: false };
    // Link points at a deleted album → fall through and create a fresh one.
  }

  const albumId = await galleryService.createStandaloneAlbum({
    orgId,
    title: `${event.title} — Photos`,
    createdBy: userId,
  });
  await albumQueries.setEventAlbum(orgId, eventId, albumId);
  const summary = await galleryService.getAlbumSummary(orgId, albumId);
  return { ...summary, created: true };
}

/** Read the event's linked album summary (or null if not linked yet). */
async function getEventAlbum({ orgId, eventId, schoolId = null }) {
  const event = await eventQueries.findEventById(orgId, eventId, undefined, schoolId);
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.');
  if (!event.galleryAlbumId) return null;
  return galleryService.getAlbumSummary(orgId, event.galleryAlbumId);
}

module.exports = { ensureEventAlbum, getEventAlbum };
