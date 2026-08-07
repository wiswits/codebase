'use strict';
const { pool } = require('../../../config/db');

// Stamp the linked gallery album id onto an event (tenant-scoped).
async function setEventAlbum(orgId, eventId, albumId, connection = pool) {
  const [result] = await connection.execute(
    `UPDATE client_em_events
     SET gallery_album_id = ?
     WHERE id = ? AND org_id = ?`,
    [albumId, eventId, orgId]
  );
  return result.affectedRows > 0;
}

module.exports = { setEventAlbum };
