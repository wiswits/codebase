'use strict';
/**
 * Gallery service — the small, reusable seam other modules call instead of
 * touching the gallery tables directly. Today it exists so the Events module
 * (events/album) can create a photo album for a managed event and read its
 * summary, without duplicating gallery's photo/album logic.
 *
 * A "standalone" album is a client_gallery_albums row with event_id = NULL — it
 * is NOT tied to gallery's own client_events; the link lives on the Events side
 * (client_em_events.gallery_album_id). Photo upload/view still flow through the
 * existing gallery endpoints unchanged.
 */
const { query, queryOne } = require('../../config/db');

/**
 * Create a standalone gallery album (event_id = NULL) and return its id.
 * Mirrors the INSERT in gallery.routes.js POST /albums.
 */
async function createStandaloneAlbum({ orgId, title, description = null, createdBy }) {
  const r = await query(
    `INSERT INTO client_gallery_albums (org_id, event_id, title, description, cover_photo_url, created_by, status)
     VALUES (?, NULL, ?, ?, NULL, ?, 'published')`,
    [orgId, title, description, createdBy || null]
  );
  return r.insertId;
}

/**
 * Album summary (id + title + photo count) scoped to the org, or null if the
 * album does not exist / belongs to another tenant.
 */
async function getAlbumSummary(orgId, albumId) {
  if (!albumId) return null;
  const album = await queryOne(
    `SELECT id, title, photos_count AS photosCount, status
     FROM client_gallery_albums
     WHERE id = ? AND org_id = ?`,
    [albumId, orgId]
  );
  if (!album) return null;
  return {
    albumId: album.id,
    title: album.title,
    photosCount: Number(album.photosCount) || 0,
    status: album.status,
  };
}

module.exports = { createStandaloneAlbum, getAlbumSummary };
