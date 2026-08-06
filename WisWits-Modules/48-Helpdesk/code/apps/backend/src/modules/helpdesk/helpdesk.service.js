'use strict';
/**
 * Report-an-Issue helpdesk — shared logic for the reporter widget, the school
 * view and the platform triage inbox.
 *
 * Design notes that matter:
 *  · Screenshots are stored OUTSIDE backend/uploads. That directory is served
 *    by two public static mounts (uploads.static / uploads.api-static), and a
 *    screenshot can contain student names and fee amounts. They live in
 *    backend/private-uploads/helpdesk and are only ever streamed back through
 *    an authorised route (§12 file storage, §17).
 *  · Duplicates keep their own ticket row and point at the parent via
 *    duplicate_of. That is deliberate: it is the only way to notify EVERY
 *    person who hit the bug when the parent is fixed.
 *  · Every state change writes a row to client_helpdesk_events (§12 audit).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { query, queryOne } = require('../../config/db');
const logger = require('../../utils/logger');
const notifications = require('../../services/notificationService');
const { BUILD_INFO } = require('../../core/buildInfo');

// ── vocabulary ────────────────────────────────────────────────────────────
// kind → the severity we start the ticket at. A reporter never picks a
// priority (they should not have to think about ours); the chip implies it and
// the team can change it during triage.
const KINDS = {
  broken:   { label: 'Does not work',     severity: 'P1' },
  wrong:    { label: 'Wrong information', severity: 'P1' },
  slow:     { label: 'Too slow',          severity: 'P2' },
  ui:       { label: 'Looks broken',      severity: 'P3' },
  request:  { label: 'Feature request',   severity: 'P3' },
  question: { label: 'Question',          severity: 'P3' },
};

// ── THREE STATUSES, AND NO MORE ───────────────────────────────────────────
// This started with eight (new · triaged · in_progress · fixed_staging ·
// released · closed · wont_fix · duplicate). Nobody outside the team could tell
// "triaged" from "in_progress", or "released" from "closed", and a status
// nobody can explain is a status nobody trusts. Three is what a school actually
// asks: has anyone seen it · is someone on it · is it done.
//
// The nuance the old list carried did NOT disappear, it moved to where it
// belongs — as data on the row rather than as a word in the pill:
//   · "fix is live, waiting on the reporter" = closed AND confirmed_at IS NULL
//   · "we will not change this"              = closed WITH a resolution saying so
//   · "this is the same bug as that one"     = duplicate_of, which has always
//     been the real answer; 'duplicate' as a *status* meant a merged ticket's
//     own reporter watched a pill that never moved again. Merged tickets now
//     carry their parent's status, so every reporter sees the real progress.
const STATUSES = ['open', 'processing', 'closed'];

// What the REPORTER is told each status means. Deliberately free of our
// internal vocabulary — a parent should never read the word "staging" (§1).
const STATUS_MESSAGE = {
  open:       'We have your report. It is in the queue.',
  processing: 'Our team is working on this.',
  closed:     'This is done. Please check and tell us if it is still not right.',
};

// The reporter is asked to confirm once we have called it done — and only
// while they have not answered yet. Being asked twice is how a person learns to
// ignore the question.
const canConfirm = (t, userId) =>
  !!t && t.reported_by === userId && t.status === 'closed' && !t.confirmed_at;

const isOpen = (s) => s !== 'closed';

// ── private screenshot store ──────────────────────────────────────────────
const SHOT_DIR = path.join(__dirname, '..', '..', '..', 'private-uploads', 'helpdesk');
try { fs.mkdirSync(SHOT_DIR, { recursive: true }); } catch { /* created on boot */ }

const SHOT_MIME = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' };
const MAX_SHOT_BYTES = 4 * 1024 * 1024;

/**
 * Decode a `data:image/...;base64,...` URL to a file in the private store.
 * Returns { file_path, mime_type, bytes } or null. NEVER throws: a screenshot
 * that will not decode must not cost us the bug report.
 */
function storeScreenshot(orgId, ticketId, dataUrl) {
  try {
    if (typeof dataUrl !== 'string') return null;
    const m = /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
    if (!m) return null;
    const buf = Buffer.from(m[2], 'base64');
    if (!buf.length || buf.length > MAX_SHOT_BYTES) return null;
    const name = `org${orgId}_t${ticketId}_${Date.now()}.${SHOT_MIME[m[1]]}`;
    fs.writeFileSync(path.join(SHOT_DIR, name), buf);
    return { file_path: name, mime_type: m[1], bytes: buf.length };
  } catch (e) {
    logger.warn('[helpdesk] screenshot store failed:', e.message);
    return null;
  }
}

// Resolve a stored attachment row to a path on disk, refusing anything that
// tries to escape the private directory (path traversal).
function screenshotPath(fileName) {
  const full = path.join(SHOT_DIR, path.basename(String(fileName || '')));
  return full.startsWith(SHOT_DIR) && fs.existsSync(full) ? full : null;
}

// ── dedup ─────────────────────────────────────────────────────────────────
// Same org + page + module + kind + similar wording = the same bug. Wording is
// reduced to its first few significant words so "receipt not printing" and
// "receipt is not printing!!" collapse together, while a genuinely different
// complaint on the same page stays its own ticket.
function fingerprint(orgId, kind, moduleSlug, pageUrl, text) {
  const words = String(text || '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 3).slice(0, 6).sort().join(' ');
  const url = String(pageUrl || '').split('?')[0];
  return crypto.createHash('sha1')
    .update([orgId, kind, moduleSlug || '', url, words].join('|')).digest('hex');
}

// ── audit ─────────────────────────────────────────────────────────────────
async function logEvent(ticket, actor, type, extra = {}) {
  try {
    await query(
      `INSERT INTO client_helpdesk_events
         (org_id, ticket_id, actor_user_id, actor_name, event_type, from_status, to_status, note)
       VALUES (?,?,?,?,?,?,?,?)`,
      [ticket.org_id, ticket.id, actor?.user_id || null, actor?.name || null, type,
       extra.from || null, extra.to || null, (extra.note || '').slice(0, 500)]);
  } catch (e) {
    // An audit write must never sink the operation it is auditing.
    logger.warn('[helpdesk] event log failed:', e.message);
  }
}

// ── notifying the reporter ────────────────────────────────────────────────
/**
 * Tell the person who reported it (and everyone whose duplicate was merged
 * into it) what changed. One fix, everyone who hit it hears about it.
 */
async function notifyReporters(ticket, title, body) {
  try {
    const rows = await query(
      `SELECT id, org_id, reported_by, reporter_role, ticket_no
         FROM client_helpdesk_tickets
        WHERE id = ? OR duplicate_of = ?`, [ticket.id, ticket.id]);
    for (const t of rows) {
      if (!t.reported_by) continue;
      await notifications.send(t.org_id, {
        recipient_id: t.reported_by,
        recipient_role: t.reporter_role || 'student',
        type: 'helpdesk_update',
        title,
        body,
        action_url: `/support/${t.id}`,
        icon: 'LifeBuoy',
        priority: 'normal',
        meta: { ticket_id: t.id, ticket_no: t.ticket_no },
      }).catch((e) => logger.warn('[helpdesk] notify failed:', e.message));
    }
  } catch (e) {
    logger.warn('[helpdesk] notifyReporters failed:', e.message);
  }
}

// ── access ────────────────────────────────────────────────────────────────
const ELEVATED = ['owner', 'admin', 'sub_admin', 'principal', 'vice_principal',
                  'coordinator', 'academic_coordinator', 'hod', 'super_admin', 'system_admin'];

const isElevated = (u) => ELEVATED.includes(String(u?.role_slug || '').toLowerCase());

/** Is the org allowed to see the widget? Absent flag row = off. */
async function widgetEnabled(orgId) {
  try {
    const r = await queryOne(
      `SELECT is_enabled FROM client_feature_flags WHERE org_id=? AND feature_key='helpdesk_widget'`,
      [orgId]);
    return !!(r && r.is_enabled);
  } catch { return false; }
}

const reporterName = (u, row) =>
  [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim() || u?.email || 'Someone';

module.exports = {
  KINDS, STATUSES, STATUS_MESSAGE, canConfirm, ELEVATED,
  isOpen, isElevated, widgetEnabled, reporterName,
  storeScreenshot, screenshotPath, fingerprint, logEvent, notifyReporters,
  BUILD_INFO, SHOT_DIR,
};
