const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Event photos are publicly readable (rendered in <img>), stored under
// backend/uploads/gallery which the /uploads static mount serves.
const GALLERY_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'gallery');
try { fs.mkdirSync(GALLERY_DIR, { recursive: true }); } catch (e) { /* created on boot */ }

// Upload to MEMORY, then compress with sharp before writing to disk. Tuned to
// OPTIMISE WITHOUT COMPROMISING QUALITY: 2560px (2K) long edge + WebP q85 is
// visually lossless for photos (indistinguishable from the original on any screen,
// good for prints/downloads), yet a raw 8–12 MB phone photo still lands as
// ~500–800 KB — 8–12× smaller storage/bandwidth/cost, zero admin effort.
const MAX_EDGE = 2560;          // long-edge cap (2K — beyond typical screens)
const WEBP_QUALITY = 85;        // visually lossless for photos
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => cb(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)),
});

// Compress+resize one uploaded buffer to a WebP on disk; returns the public
// /uploads/gallery/<name>.webp path. Falls back to the original bytes if sharp
// can't process the file (never fail an upload over one odd image).
async function storeCompressed(orgId, buffer) {
  const base = `org${orgId}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
  const name = `${base}.webp`;
  const dest = path.join(GALLERY_DIR, name);
  try {
    await sharp(buffer)
      .rotate()                                                   // honour EXIF orientation (phones)
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(dest);
    return `/uploads/gallery/${name}`;
  } catch (e) {
    const raw = `${base}.jpg`;
    fs.writeFileSync(path.join(GALLERY_DIR, raw), buffer);
    return `/uploads/gallery/${raw}`;
  }
}

router.use(authenticate);

// EVENTS ───────────────────────────────────────────────────────────────────
router.get('/events', async (req, res) => {
  try {
    const o = req.user.org_id;
    // scope=mine (SUG-0042b): teacher sees only events tagged to sections they
    // teach (timetable-derived, same predicate as teacherScope).
    let where = 'WHERE e.org_id=?';
    const params = [o];
    if (req.query.scope === 'mine') {
      where += ` AND e.section_id IN (
        SELECT DISTINCT ts.section_id FROM client_timetable_slots ts
         WHERE ts.org_id=? AND ts.teacher_id=?)`;
      params.push(o, req.user.user_id);
    }
    let rows;
    try {
      rows = await query(
        `SELECT e.*,
          (SELECT COUNT(*) FROM client_gallery_albums WHERE event_id=e.id) AS album_count,
          (SELECT COALESCE(SUM(photos_count),0) FROM client_gallery_albums WHERE event_id=e.id) AS photo_count
         FROM client_events e ${where}
         ORDER BY e.event_date DESC`, params);
    } catch (e) {
      if (!/section_id/i.test(e.message)) throw e;
      // Pre-migration schema: no section tags yet → 'mine' has nothing to match.
      rows = req.query.scope === 'mine' ? [] : await query(
        `SELECT e.*,
          (SELECT COUNT(*) FROM client_gallery_albums WHERE event_id=e.id) AS album_count,
          (SELECT COALESCE(SUM(photos_count),0) FROM client_gallery_albums WHERE event_id=e.id) AS photo_count
         FROM client_events e WHERE e.org_id=? ORDER BY e.event_date DESC`, [o]);
    }
    return success(res, { events: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// Added by audit script — root alias for frontend compat
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { query: q } = require('../../config/db');
    const rows = await q(
      `SELECT id, title, description, cover_url, created_at FROM client_gallery_albums
       WHERE org_id = ? ORDER BY created_at DESC LIMIT 20`,
      [orgId]
    );
    return res.json({ status: 'success', data: rows });
  } catch (e) {
    return res.json({ status: 'success', data: [] });
  }
});


router.post('/events', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { title, description, event_type, event_date, venue, cover_image_url, status, section_id } = req.body;
    if (!title) return error(res, 'title required', 400);

    let r;
    try {
      r = await query(
        `INSERT INTO client_events (org_id, title, description, event_type, event_date, venue, organizer_id, status, cover_image_url, section_id)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [o, title, description||null, event_type||'other', event_date||null, venue||null, req.user.user_id, status||'upcoming', cover_image_url||null, section_id||null]
      );
    } catch (e) {
      if (!/section_id/i.test(e.message)) throw e;
      r = await query(
        `INSERT INTO client_events (org_id, title, description, event_type, event_date, venue, organizer_id, status, cover_image_url)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [o, title, description||null, event_type||'other', event_date||null, venue||null, req.user.user_id, status||'upcoming', cover_image_url||null]
      );
    }

    // Auto-create matching album
    await query(
      `INSERT INTO client_gallery_albums (org_id, event_id, title, description, cover_photo_url, created_by, status)
       VALUES (?,?,?,?,?,?,?)`,
      [o, r.insertId, `${title} — Photo Album`, description||null, cover_image_url||null, req.user.user_id, 'published']
    );

    return success(res, { id: r.insertId }, 'Event created', 201);
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/events/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { title, description, event_type, event_date, venue, cover_image_url, status } = req.body;
    await query(
      `UPDATE client_events SET
        title=COALESCE(?,title), description=COALESCE(?,description),
        event_type=COALESCE(?,event_type), event_date=COALESCE(?,event_date),
        venue=COALESCE(?,venue), cover_image_url=COALESCE(?,cover_image_url),
        status=COALESCE(?,status)
       WHERE id=? AND org_id=?`,
      [title||null, description||null, event_type||null, event_date||null,
       venue||null, cover_image_url||null, status||null, req.params.id, o]
    );
    return success(res, {}, 'Event updated');
  } catch(e) { return error(res, e.message, 500); }
});

router.delete('/events/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    // cascade delete albums + photos
    const albums = await query('SELECT id FROM client_gallery_albums WHERE event_id=? AND org_id=?', [req.params.id, o]);
    for (const a of albums) {
      await query('DELETE FROM client_gallery_photos WHERE album_id=? AND org_id=?', [a.id, o]);
    }
    await query('DELETE FROM client_gallery_albums WHERE event_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_events WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Event deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// ALBUMS ───────────────────────────────────────────────────────────────────
router.get('/albums', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { event_id } = req.query;
    let where = 'WHERE a.org_id=?';
    const params = [o];
    if (event_id) { where += ' AND a.event_id=?'; params.push(event_id); }

    const rows = await query(
      `SELECT a.*, e.title AS event_title, e.event_type, e.event_date
       FROM client_gallery_albums a
       LEFT JOIN client_events e ON e.id=a.event_id
       ${where}
       ORDER BY a.created_at DESC`,
      params
    );
    return success(res, { albums: rows });
  } catch(e) { return error(res, e.message, 500); }
});

router.get('/albums/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const album = await queryOne(
      `SELECT a.*, e.title AS event_title, e.event_date, e.venue, e.event_type
       FROM client_gallery_albums a
       LEFT JOIN client_events e ON e.id=a.event_id
       WHERE a.id=? AND a.org_id=?`,
      [req.params.id, o]
    );
    if (!album) return error(res, 'Not found', 404);

    const photos = await query(
      `SELECT * FROM client_gallery_photos WHERE album_id=? AND org_id=? ORDER BY sort_order, id`,
      [req.params.id, o]
    );
    return success(res, { album, photos });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/albums', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { event_id, title, description, cover_photo_url } = req.body;
    if (!title) return error(res, 'title required', 400);
    const r = await query(
      `INSERT INTO client_gallery_albums (org_id, event_id, title, description, cover_photo_url, created_by, status)
       VALUES (?,?,?,?,?,?,?)`,
      [o, event_id||null, title, description||null, cover_photo_url||null, req.user.user_id, 'published']
    );
    return success(res, { id: r.insertId }, 'Album created', 201);
  } catch(e) { return error(res, e.message, 500); }
});

router.delete('/albums/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    await query('DELETE FROM client_gallery_photos WHERE album_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_gallery_albums WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// PHOTOS ───────────────────────────────────────────────────────────────────
router.post('/albums/:id/photos', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { photos } = req.body; // array of {file_url, caption, thumbnail_url}
    if (!Array.isArray(photos) || photos.length === 0) return error(res, 'photos array required', 400);

    for (const p of photos) {
      await query(
        `INSERT INTO client_gallery_photos (org_id, album_id, file_url, thumbnail_url, caption, uploaded_by)
         VALUES (?,?,?,?,?,?)`,
        [o, req.params.id, p.file_url, p.thumbnail_url || p.file_url, p.caption || null, req.user.user_id]
      );
    }

    // Update count
    await query(
      `UPDATE client_gallery_albums SET photos_count=(SELECT COUNT(*) FROM client_gallery_photos WHERE album_id=?) WHERE id=?`,
      [req.params.id, req.params.id]
    );

    return success(res, { added: photos.length }, `${photos.length} photos added`);
  } catch (e) { return error(res, e.message, 500); }
});

// Upload real image FILES (phone/computer) — the school no longer needs to paste URLs.
router.post('/albums/:id/photos/upload', requireRole('owner','admin','principal','teacher'), photoUpload.array('photos', 20), async (req, res) => {
  try {
    const o = req.user.org_id;
    const album = await queryOne('SELECT id FROM client_gallery_albums WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!album) return error(res, 'Album not found', 404);
    const files = req.files || [];
    if (!files.length) return error(res, 'Choose at least one image', 400);

    for (const f of files) {
      const url = await storeCompressed(o, f.buffer);
      await query(
        `INSERT INTO client_gallery_photos (org_id, album_id, file_url, thumbnail_url, caption, uploaded_by)
         VALUES (?,?,?,?,?,?)`,
        [o, req.params.id, url, url, null, req.user.user_id]
      );
    }
    await query(
      `UPDATE client_gallery_albums SET photos_count=(SELECT COUNT(*) FROM client_gallery_photos WHERE album_id=?) WHERE id=?`,
      [req.params.id, req.params.id]
    );
    return success(res, { added: files.length }, `${files.length} photo${files.length !== 1 ? 's' : ''} uploaded`);
  } catch(e) { return error(res, e.message, 500); }
});

router.delete('/photos/:id', requireRole('owner','admin','principal','teacher'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const p = await queryOne('SELECT album_id FROM client_gallery_photos WHERE id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_gallery_photos WHERE id=? AND org_id=?', [req.params.id, o]);
    if (p) {
      await query(
        `UPDATE client_gallery_albums SET photos_count=(SELECT COUNT(*) FROM client_gallery_photos WHERE album_id=?) WHERE id=?`,
        [p.album_id, p.album_id]
      );
    }
    return success(res, {}, 'Deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// FEATURED ─────────────────────────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const o = req.user.org_id;
    const photos = await query(
      `SELECT p.*, a.title AS album_title, e.title AS event_title
       FROM client_gallery_photos p
       JOIN client_gallery_albums a ON a.id=p.album_id
       LEFT JOIN client_events e ON e.id=a.event_id
       WHERE p.org_id=? AND p.is_featured=1
       ORDER BY p.uploaded_at DESC LIMIT 10`,
      [o]
    );
    return success(res, { photos });
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;
