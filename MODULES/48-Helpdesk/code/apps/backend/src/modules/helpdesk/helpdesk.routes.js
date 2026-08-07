'use strict';
/**
 * Report-an-Issue helpdesk API.
 *
 * Three audiences, one router:
 *   · REPORTER  — any authenticated user. Creates tickets from the floating
 *                 widget, reads their own, replies, confirms the fix.
 *   · SCHOOL    — elevated roles inside an org read their own org's tickets.
 *   · PLATFORM  — WisWits org only (requirePlatformOrg): every org's tickets,
 *                 status changes, merges, and the per-org widget switch.
 *
 * Tenant scoping is absolute: every reporter/school query carries org_id
 * (§6, §17). The platform routes are the ONLY cross-org surface and they sit
 * behind requirePlatformOrg, which checks org membership, not just role.
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requirePlatformOrg, PLATFORM_ORG_ID } = require('../../middleware/rbac');
const { rateLimitKey } = require('../../middleware/rateLimits');
const { RedisRateStore } = require('../../middleware/redisRateStore');
const { getWriteSchool } = require('../../utils/activeSchool');
const logger = require('../../utils/logger');
const S = require('./helpdesk.service');
const A = require('./helpdesk.area');
const RC = require('./helpdesk.rc');
const ideas = require('./ideas.service');
const github = require('./helpdesk.github');

router.use(authenticate);

// Ticket creation is user-keyed, never IP-keyed: an IP-keyed limit puts a whole
// school behind one NAT into a single bucket, which is exactly the P0 the
// platform already hit once (docs KI / rate-limit keying test). 40/hour is far
// above real reporting and still stops a runaway client loop.
const createLimiter = rateLimit({
  // Redis-backed like every other limiter here, so the count is shared across
  // pm2 workers instead of being per-process (own prefix — never share a
  // namespace with the general/auth buckets).
  store: new RedisRateStore('helpdesk'),
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: rateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many reports from this account — please try again later.' },
});

const asInt = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
const actorOf = (req, name) => ({ user_id: req.user.user_id, name: name || req.user.email });

// ═══════════════════════════════════════════════════════════════════════════
// REPORTER
// ═══════════════════════════════════════════════════════════════════════════

// Does this org get the widget at all? The widget calls this once on mount and
// renders nothing when disabled, so a paying client never sees it early.
router.get('/config', async (req, res) => {
  try {
    return success(res, {
      enabled: await S.widgetEnabled(req.user.org_id),
      kinds: Object.entries(S.KINDS).map(([key, v]) => ({ key, label: v.label })),
    });
  } catch (e) { return error(res, e.message, 500); }
});

// Create a ticket. The reporter supplies `kind` + `description`; everything
// else on the body is context the widget collected for them.
router.post('/tickets', createLimiter, async (req, res) => {
  try {
    const o = req.user.org_id;
    if (!await S.widgetEnabled(o)) return error(res, 'Issue reporting is not enabled for this school', 403);

    const kind = String(req.body.kind || '').trim();
    if (!S.KINDS[kind]) return error(res, 'Please choose what kind of problem it is', 400);

    const description = String(req.body.description || '').trim();
    if (description.length < 3) return error(res, 'Please tell us what happened', 400);

    const page_url    = String(req.body.page_url || '').slice(0, 500) || null;
    const module_slug = String(req.body.module_slug || '').slice(0, 100) || null;
    const section     = String(req.body.section || '').slice(0, 150) || null;

    // The title is the first line of what they wrote — never a separate field
    // to fill in. One box is the whole point (§1, ≤3 clicks).
    const title = description.split('\n')[0].slice(0, 200) || S.KINDS[kind].label;

    // ── WHERE, precisely ────────────────────────────────────────────────────
    // The widget infers a dot-path (module.page.section.component) from the DOM
    // and the route. It is never trusted as sent: areaPath() re-validates every
    // segment and forces the module level to the one derived here, so a broken
    // client cannot file under another module's prefix. With no client value at
    // all it falls back to module + section, which every ticket already has —
    // which is why this works before a single component has been tagged.
    const area_path = A.areaPath(req.body.area_path, module_slug, section);
    const nearest_element = A.nearestElement(req.body.nearest_element);
    // Both of these are OURS, never the school's: they are stripped from every
    // non-platform response below, alongside context_json.
    const source_file_hint = A.sourceFileHint(area_path);
    const suggested_rc_code = RC.suggestRc({ title, description, kind });

    const me = await queryOne(
      'SELECT first_name, last_name, email FROM client_users WHERE id=? AND org_id=?',
      [req.user.user_id, o]);
    const name = S.reporterName(req.user, me);

    // Dedup against OPEN tickets only — a bug that comes back after being
    // closed deserves a fresh ticket, not a resurrected one.
    const fp = S.fingerprint(o, kind, module_slug, page_url, description);
    const twin = await queryOne(
      `SELECT id, ticket_no, status FROM client_helpdesk_tickets
        WHERE org_id=? AND fingerprint=? AND status <> 'closed'
          AND duplicate_of IS NULL AND withdrawn_at IS NULL
        ORDER BY id ASC LIMIT 1`, [o, fp]);

    const school_id = await getWriteSchool(req).catch(() => null);

    // Context is client-supplied, so it is bounded here rather than trusted.
    // The breadcrumb buffer is capped at 8 client-side; a caller that ignores
    // that gets trimmed, not accepted.
    const raw = (typeof req.body.context === 'object' && req.body.context) ? req.body.context : {};
    const context = {
      viewport: String(raw.viewport || '').slice(0, 40),
      screen: String(raw.screen || '').slice(0, 40),
      language: String(raw.language || '').slice(0, 20),
      online: raw.online !== false,
      referrer: String(raw.referrer || '').slice(0, 300),
      breadcrumbs: (Array.isArray(raw.breadcrumbs) ? raw.breadcrumbs : []).slice(0, 10).map((b) => ({
        at: String(b?.at || '').slice(0, 30),
        kind: b?.kind === 'js' ? 'js' : 'api',
        detail: String(b?.detail || '').slice(0, 300),
      })),
      user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
      reported_at: new Date().toISOString(),
    };

    // A merged report carries its PARENT's status, not a 'duplicate' status of
    // its own: the person who filed it must see the same progress as everyone
    // else who hit the same bug, not a pill frozen at "merged" forever.
    const status = twin ? twin.status : 'open';

    const r = await query(
      `INSERT INTO client_helpdesk_tickets
        (org_id, school_id, reported_by, reporter_role, reporter_name, reporter_email,
         kind, severity, title, description, page_url, module_slug, section,
         area_path, nearest_element, source_file_hint, suggested_rc_code,
         app_build, context_json, fingerprint, duplicate_of, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [o, school_id, req.user.user_id, req.user.role_slug || null, name, me?.email || req.user.email,
       kind, S.KINDS[kind].severity, title, description, page_url, module_slug, section,
       area_path, nearest_element, source_file_hint, suggested_rc_code,
       S.BUILD_INFO.git_sha, JSON.stringify(context), fp, twin ? twin.id : null,
       status]);

    const id = r.insertId;
    const ticket_no = `WW-${id}`;
    await query('UPDATE client_helpdesk_tickets SET ticket_no=? WHERE id=?', [ticket_no, id]);

    const ticket = { id, org_id: o };
    await S.logEvent(ticket, actorOf(req, name), 'created',
      { to: status, note: twin ? `merged into #${twin.id}` : title });

    // Screenshot is best-effort by design: it must never be the reason a bug
    // report fails to save.
    let screenshot = false;
    const shot = S.storeScreenshot(o, id, req.body.screenshot);
    if (shot) {
      await query(
        `INSERT INTO client_helpdesk_attachments
           (org_id, ticket_id, kind, file_path, mime_type, bytes, uploaded_by)
         VALUES (?,?,'screenshot',?,?,?,?)`,
        [o, id, shot.file_path, shot.mime_type, shot.bytes, req.user.user_id]);
      screenshot = true;
    }

    logger.info('[HELPDESK] ticket created', {
      ticket_no, org_id: o, user_id: req.user.user_id, role: req.user.role_slug,
      kind, module: module_slug, area: area_path, rc: suggested_rc_code,
      duplicate_of: twin?.id || null, screenshot });

    // Mirror to GitHub so the ticket becomes work someone can pick up. Only for
    // real tickets, never duplicates (they are already on the parent's issue),
    // and never awaited — the reporter must not wait on GitHub to see "sent",
    // and a GitHub outage must not turn into a failed bug report.
    if (!twin && github.enabled()) {
      const forIssue = {
        id, ticket_no, org_id: o, title, description, severity: S.KINDS[kind].severity,
        page_url, module_slug, section, app_build: S.BUILD_INFO.git_sha,
        area_path, nearest_element, source_file_hint, suggested_rc_code,
        reporter_name: name, reporter_role: req.user.role_slug,
      };
      github.createIssue(forIssue, context)
        .then((issue) => issue && query(
          'UPDATE client_helpdesk_tickets SET github_issue_no=?, github_issue_url=? WHERE id=?',
          [issue.number, issue.url, id]))
        .catch((e) => logger.warn('[HELPDESK] github mirror failed:', e.message));
    }

    return success(res, {
      id, ticket_no, status,
      merged_into: twin ? { id: twin.id, ticket_no: twin.ticket_no } : null,
      screenshot,
    }, 'Thank you — we have it.', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// My tickets (what the reporter sees in their own list).
router.get('/my', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, ticket_no, kind, severity, title, status, page_url, module_slug,
              resolution, resolved_at, confirmed_at, created_at, updated_at
         FROM client_helpdesk_tickets
        WHERE org_id=? AND reported_by=? AND withdrawn_at IS NULL
        ORDER BY id DESC LIMIT 100`,
      [req.user.org_id, req.user.user_id]);
    return success(res, { tickets: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Org-wide list for elevated roles: a principal watching their own school.
// Everyone else gets their own tickets only — no exceptions, no query param
// that widens it.
router.get('/tickets', async (req, res) => {
  try {
    const o = req.user.org_id;
    const mine = !S.isElevated(req.user);
    // A MERGED report must still be visible to the person who filed it. The
    // org-wide view hides duplicates on purpose (one bug, one row, with an
    // "affected" count) — but applying that to someone's OWN list meant their
    // report disappeared the moment we merged it, while they kept receiving
    // notifications about a ticket they could no longer open. Reported by AK
    // as "gayab ho gayi".
    const params = [o];
    // A withdrawn report is gone from every list and every count — it exists
    // only in the audit trail (§15: the row is never deleted).
    let where = 'WHERE t.org_id=? AND t.withdrawn_at IS NULL';
    if (mine) { where += ' AND t.reported_by=?'; params.push(req.user.user_id); }
    if (req.query.status && S.STATUSES.includes(req.query.status)) {
      where += ' AND t.status=?'; params.push(req.query.status);
    }
    const rows = await query(
      `SELECT t.id, t.ticket_no, t.kind, t.severity, t.title, t.status, t.page_url,
              t.module_slug, t.section, t.reporter_name, t.reporter_role,
              t.created_at, t.updated_at, t.resolved_at, t.confirmed_at,
              (SELECT COUNT(*) FROM client_helpdesk_tickets d WHERE d.duplicate_of=t.id) + 1 AS affected
         FROM client_helpdesk_tickets t
         ${where} ${mine ? '' : 'AND t.duplicate_of IS NULL'}
        ORDER BY t.id DESC LIMIT 200`, params);

    // The three tab counts, computed over the WHOLE scope rather than over the
    // 200 rows that came back — a tab that says "12" only because the 13th fell
    // off the limit is a tab that lies.
    const countParams = [o];
    let countWhere = mine
      ? 'WHERE org_id=? AND withdrawn_at IS NULL'
      : 'WHERE org_id=? AND duplicate_of IS NULL AND withdrawn_at IS NULL';
    if (mine) { countWhere += ' AND reported_by=?'; countParams.push(req.user.user_id); }
    const counts = await query(
      `SELECT status, COUNT(*) n FROM client_helpdesk_tickets ${countWhere} GROUP BY status`,
      countParams);

    return success(res, { tickets: rows, counts, scope: mine ? 'mine' : 'org' });
  } catch (e) { return error(res, e.message, 500); }
});

// One ticket, with its thread. Readable by: the reporter, an elevated user in
// the same org, or the platform team.
async function loadTicket(req, id) {
  const platform = req.user.org_id === PLATFORM_ORG_ID;
  const t = platform
    ? await queryOne('SELECT * FROM client_helpdesk_tickets WHERE id=?', [id])
    : await queryOne('SELECT * FROM client_helpdesk_tickets WHERE id=? AND org_id=?', [id, req.user.org_id]);
  if (!t) return { t: null, canRead: false, platform };
  const canRead = platform || t.reported_by === req.user.user_id || S.isElevated(req.user);
  return { t, canRead, platform };
}

router.get('/tickets/:id', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    if (!id) return error(res, 'Bad ticket id', 400);
    const { t, canRead, platform } = await loadTicket(req, id);
    if (!t) return error(res, 'Ticket not found', 404);
    if (!canRead) return error(res, 'Not your ticket', 403);

    // Internal notes stay internal — never returned outside the platform org.
    const messages = await query(
      `SELECT id, author_name, author_side, body, is_internal, created_at
         FROM client_helpdesk_messages
        WHERE ticket_id=? ${platform ? '' : 'AND is_internal=0'}
        ORDER BY id ASC`, [id]);
    const attachments = await query(
      `SELECT id, kind, mime_type, bytes, created_at FROM client_helpdesk_attachments
        WHERE ticket_id=? ORDER BY id ASC`, [id]);
    const duplicates = await query(
      `SELECT id, ticket_no, reporter_name, created_at FROM client_helpdesk_tickets
        WHERE duplicate_of=? ORDER BY id ASC`, [id]);
    const events = platform
      ? await query(`SELECT actor_name, event_type, from_status, to_status, note, created_at
                       FROM client_helpdesk_events WHERE ticket_id=? ORDER BY id ASC`, [id])
      : [];

    // ── DIAGNOSTICS ARE OURS, NOT THE SCHOOL'S (§1, §4) ─────────────────────
    // The widget attaches the failing API call, the build hash, the module slug
    // and the user agent so WE can fix things. A principal opening the same
    // ticket was being shown all of it — "GET playbooks/events -> 404",
    // "APP BUILD 790239a", "events › Events" — which is exactly the technical
    // implementation §1 says never to expose, and it makes our own missing
    // content look like the school's broken page.
    //
    // Stripped HERE rather than hidden in the page, because §4 makes the API
    // responsible for what each viewer may see: a field the browser never
    // receives cannot leak through a future redesign.
    //
    // The four location columns (058) extend that same rule rather than
    // inventing a second one: `area_path` and `suggested_rc_code` are our
    // internal vocabulary, and `source_file_hint` is a path into our source
    // tree — none of it means anything to a principal, and a file path in a
    // support record is the clearest possible breach of §1. `nearest_element`
    // goes too: a row action reads "Delete Priya Sharma", so it can carry a
    // student's name.
    const diagnostic = { ...t };
    if (!platform) {
      delete diagnostic.context_json;
      delete diagnostic.app_build;
      delete diagnostic.released_build;
      delete diagnostic.module_slug;
      delete diagnostic.user_agent;
      delete diagnostic.area_path;
      delete diagnostic.nearest_element;
      delete diagnostic.source_file_hint;
      delete diagnostic.suggested_rc_code;
    } else {
      diagnostic.context_json = t.context_json
        ? (typeof t.context_json === 'string' ? JSON.parse(t.context_json) : t.context_json)
        : null;
    }

    return success(res, {
      ticket: diagnostic,
      messages, attachments, duplicates, events,
      affected: duplicates.length + 1,
      can_confirm: S.canConfirm(t, req.user.user_id),
      // Shown as "Take this back" — the same three conditions the DELETE
      // enforces, so the button never appears for something the API refuses.
      can_withdraw: t.reported_by === req.user.user_id && t.status === 'open'
        && !t.withdrawn_at && !messages.some((m) => m.author_side === 'team'),
      // Whose report this is, so the page can say plainly why someone is looking
      // at a colleague's ticket instead of leaving them to wonder.
      is_mine: t.reported_by === req.user.user_id,
      viewer_scope: platform ? 'platform' : (t.reported_by === req.user.user_id ? 'mine' : 'school'),
    });
  } catch (e) { return error(res, e.message, 500); }
});

// The screenshot. Streamed through an authorised route, never a static mount —
// it can hold student names and fee amounts.
router.get('/attachments/:id', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    if (!id) return error(res, 'Bad attachment id', 400);
    const a = await queryOne('SELECT * FROM client_helpdesk_attachments WHERE id=?', [id]);
    if (!a) return error(res, 'Not found', 404);
    const { t, canRead } = await loadTicket(req, a.ticket_id);
    if (!t || !canRead) return error(res, 'Not your ticket', 403);
    const file = S.screenshotPath(a.file_path);
    if (!file) return error(res, 'File is no longer available', 404);
    res.set('Content-Type', a.mime_type || 'image/webp');
    res.set('Cache-Control', 'private, max-age=300');
    return fs.createReadStream(file).pipe(res);
  } catch (e) { return error(res, e.message, 500); }
});

// Reply on the thread — reporter or team, same endpoint, side inferred.
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    const body = String(req.body.body || '').trim();
    if (!id) return error(res, 'Bad ticket id', 400);
    if (!body) return error(res, 'Please type a message', 400);

    const { t, canRead, platform } = await loadTicket(req, id);
    if (!t) return error(res, 'Ticket not found', 404);
    if (!canRead) return error(res, 'Not your ticket', 403);

    const internal = platform && !!req.body.is_internal;
    const me = await queryOne('SELECT first_name, last_name FROM client_users WHERE id=?', [req.user.user_id]);
    const name = platform ? 'WisWits Team' : S.reporterName(req.user, me);

    await query(
      `INSERT INTO client_helpdesk_messages
         (org_id, ticket_id, author_user_id, author_name, author_side, is_internal, body)
       VALUES (?,?,?,?,?,?,?)`,
      [t.org_id, id, req.user.user_id, name, platform ? 'team' : 'reporter', internal ? 1 : 0, body.slice(0, 5000)]);
    await S.logEvent(t, actorOf(req, name), 'reply', { note: internal ? 'internal note' : 'reply' });

    // Only a visible team reply pings the reporter. An internal note must not.
    if (platform && !internal) {
      await S.notifyReporters(t, 'Update on your report',
        `${t.ticket_no}: ${body.slice(0, 160)}`);
    }
    return success(res, {}, 'Sent', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// The loop that keeps a "closed" ticket honest: we call it done, the reporter
// says whether it actually works. 👍 records the confirmation; 👎 puts it
// straight back to `processing` with the original context intact.
router.post('/tickets/:id/confirm', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    if (!id) return error(res, 'Bad ticket id', 400);
    const t = await queryOne(
      'SELECT * FROM client_helpdesk_tickets WHERE id=? AND org_id=?', [id, req.user.org_id]);
    if (!t) return error(res, 'Ticket not found', 404);
    if (t.reported_by !== req.user.user_id) return error(res, 'Only the person who reported it can confirm', 403);

    const works = req.body.works !== false;
    const note = String(req.body.note || '').trim().slice(0, 1000);

    if (works) {
      await query(
        `UPDATE client_helpdesk_tickets SET status='closed', confirmed_at=NOW() WHERE id=?`, [id]);
      await S.logEvent(t, actorOf(req), 'confirmed', { from: t.status, to: 'closed', note });
      return success(res, { status: 'closed' }, 'Thank you for confirming.');
    }

    // Still broken — back to OPEN, not Processing. We thought it was done and it
    // is not, so it returns to the queue where unpicked work lives; saying
    // "being worked on now" the instant a school tells us it is still broken
    // would be the second wrong thing we told them. Somebody picking it up
    // moves it to Processing on its own (assignment, or the ticket number in a
    // commit). The original context is kept and the bounce is counted, so a fix
    // that did not hold is visible as a bad fix rather than as noise.
    await query(
      `UPDATE client_helpdesk_tickets
          SET status='open', resolved_at=NULL, reopened_count=reopened_count+1 WHERE id=?`, [id]);
    // Merged duplicates follow it back, exactly as they followed it closed.
    await query(`UPDATE client_helpdesk_tickets SET status='open' WHERE duplicate_of=?`, [id]);
    if (note) {
      await query(
        `INSERT INTO client_helpdesk_messages (org_id, ticket_id, author_user_id, author_name, author_side, body)
         VALUES (?,?,?,?,'reporter',?)`,
        [t.org_id, id, req.user.user_id, t.reporter_name, note]);
    }
    await S.logEvent(t, actorOf(req), 'reopened', { from: t.status, to: 'open', note });
    logger.warn('[HELPDESK] reopened', { ticket_no: t.ticket_no, org_id: t.org_id, times: t.reopened_count + 1 });
    return success(res, { status: 'open' }, 'Thank you — we have reopened it.');
  } catch (e) { return error(res, e.message, 500); }
});

// Take back a report filed by mistake. WW-7 is the word "demo" — somebody
// testing the button — and it has sat in a real school's queue ever since,
// because there has never been a way to remove it.
//
// Only the person who filed it, only while it is still OPEN, and only while
// nobody from our side has replied: once a human has spent time on it, the
// thread is a record of that work and quietly removing it would hide it. The
// row is never deleted (§15) — it stops appearing in lists and counts, and the
// audit trail keeps what happened.
router.delete('/tickets/:id', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    if (!id) return error(res, 'Bad ticket id', 400);
    const t = await queryOne(
      'SELECT * FROM client_helpdesk_tickets WHERE id=? AND org_id=?', [id, req.user.org_id]);
    if (!t) return error(res, 'Ticket not found', 404);
    if (t.reported_by !== req.user.user_id) return error(res, 'Only the person who reported it can take it back', 403);
    if (t.withdrawn_at) return success(res, {}, 'Already taken back');
    if (t.status !== 'open') return error(res, 'This one is already being worked on — reply on it instead', 400);
    const replied = await queryOne(
      `SELECT id FROM client_helpdesk_messages WHERE ticket_id=? AND author_side='team' LIMIT 1`, [id]);
    if (replied) return error(res, 'We have already replied to this one — reply on it instead', 400);

    await query('UPDATE client_helpdesk_tickets SET withdrawn_at=NOW() WHERE id=?', [id]);
    // Anything merged into it goes back to being its own report rather than
    // hanging off a ticket that is no longer listed anywhere.
    await query('UPDATE client_helpdesk_tickets SET duplicate_of=NULL WHERE duplicate_of=?', [id]);
    await S.logEvent(t, actorOf(req), 'status', { from: t.status, to: 'withdrawn', note: 'taken back by the reporter' });
    logger.info('[HELPDESK] withdrawn', { ticket_no: t.ticket_no, org_id: t.org_id, user_id: req.user.user_id });
    return success(res, {}, 'Taken back. It is off your list.');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM — WisWits org only. Cross-tenant by design, gated by org membership
// (requirePlatformOrg), not by role name alone.
// ═══════════════════════════════════════════════════════════════════════════
const platform = express.Router();
platform.use(requirePlatformOrg);

// The triage inbox: every org's tickets, newest and most severe first.
platform.get('/tickets', async (req, res) => {
  try {
    const where = ['t.duplicate_of IS NULL', 't.withdrawn_at IS NULL'];
    const params = [];
    if (req.query.status && S.STATUSES.includes(req.query.status)) { where.push('t.status=?'); params.push(req.query.status); }
    if (req.query.severity) { where.push('t.severity=?'); params.push(String(req.query.severity).toUpperCase()); }
    if (req.query.org_id) { where.push('t.org_id=?'); params.push(asInt(req.query.org_id)); }
    if (req.query.module) { where.push('t.module_slug=?'); params.push(String(req.query.module)); }
    // WHERE on the page, not just which page. `area=fees.collection` matches
    // that area and everything tagged beneath it, so a prefix narrows from a
    // module to a region to a single control without needing three filters.
    // The escape matters: `_` and `%` are wildcards in LIKE, and `_` is in every
    // area path we generate — unescaped, `fees.collect_fees` would also match
    // `fees.collectXfees`.
    if (req.query.area) {
      const area = A.areaPath(req.query.area, String(req.query.area).split('.')[0], '');
      if (area) {
        const esc = area.replace(/[\\%_]/g, (c) => `\\${c}`);
        where.push('(t.area_path = ? OR t.area_path LIKE ?)');
        params.push(area, `${esc}.%`);
      }
    }
    if (req.query.rc) { where.push('t.suggested_rc_code=?'); params.push(String(req.query.rc).slice(0, 10)); }
    if (req.query.open === '1') where.push("t.status <> 'closed'");
    // "We called it done and nobody has told us whether it actually is" — the
    // one pile that rots quietly, so it is a filter, not a number to eyeball.
    if (req.query.awaiting === '1') where.push("t.status='closed' AND t.confirmed_at IS NULL");
    // "what is mine" and "what has nobody" are the two questions anyone running a queue
    // asks first, so they are filters rather than something to eyeball down a column.
    if (req.query.assignee === 'none') where.push('t.assignee_user_id IS NULL');
    else if (req.query.assignee) { where.push('t.assignee_user_id=?'); params.push(asInt(req.query.assignee)); }
    // WHO is hitting it. A queue full of P1s from students is a different morning
    // from three P1s raised by principals, and the inbox had no way to tell them
    // apart even though reporter_role has been on every row since day one.
    if (req.query.role) { where.push('LOWER(t.reporter_role)=?'); params.push(String(req.query.role).toLowerCase()); }
    // What KIND of problem — "does not work" and "feature request" do not belong
    // in the same triage pass.
    if (req.query.kind && S.KINDS[req.query.kind]) { where.push('t.kind=?'); params.push(req.query.kind); }
    // Free text over the words a human would remember: the title, the ticket
    // number, and the page it happened on. Parameterised, never concatenated (§17).
    if (req.query.q) {
      const q = `%${String(req.query.q).trim().slice(0, 80)}%`;
      where.push('(t.title LIKE ? OR t.ticket_no LIKE ? OR t.page_url LIKE ?)');
      params.push(q, q, q);
    }

    const rows = await query(
      // `assignee_user_id` has been a column since this table was created and the PATCH
      // handler has always accepted it — but the list never SELECTed it, so the triage
      // inbox could not show who owns a ticket and had no way to set one. A queue where
      // nobody is named is a list, not a queue.
      `SELECT t.id, t.ticket_no, t.org_id, o.name AS org_name, t.kind, t.severity, t.title,
              t.status, t.page_url, t.module_slug, t.section,
              t.area_path, t.source_file_hint, t.suggested_rc_code, t.nearest_element,
              t.reporter_name, t.reporter_role, t.reporter_email,
              t.assignee_user_id,
              NULLIF(TRIM(CONCAT(COALESCE(a.first_name,''), ' ', COALESCE(a.last_name,''))), '') AS assignee_name,
              a.email AS assignee_email,
              t.github_issue_no, t.github_issue_url, t.reopened_count,
              t.resolved_at, t.confirmed_at,
              t.created_at, t.updated_at,
              (SELECT COUNT(*) FROM client_helpdesk_tickets d WHERE d.duplicate_of=t.id) + 1 AS affected
         FROM client_helpdesk_tickets t
         LEFT JOIN client_organizations o ON o.id = t.org_id
         LEFT JOIN client_users a ON a.id = t.assignee_user_id
        WHERE ${where.join(' AND ')}
        ORDER BY FIELD(t.severity,'P1','P2','P3'), t.id DESC
        LIMIT 300`, params);

    const counts = await query(
      `SELECT status, COUNT(*) n FROM client_helpdesk_tickets
        WHERE duplicate_of IS NULL AND withdrawn_at IS NULL GROUP BY status`);
    const [{ unassigned }] = await query(
      `SELECT COUNT(*) AS unassigned FROM client_helpdesk_tickets
        WHERE duplicate_of IS NULL AND assignee_user_id IS NULL
          AND status <> 'closed' AND withdrawn_at IS NULL`);
    return success(res, { tickets: rows, counts, unassigned: Number(unassigned) || 0 });
  } catch (e) { return error(res, e.message, 500); }
});

// ── THE NUMBERS THAT DECIDE THE MORNING ─────────────────────────────────────
//
// Deliberately its OWN endpoint rather than more fields on the list, because
// these must NOT move when you filter. A headline that says "3 open" only
// because you are looking at one school is a headline that lies — the whole job
// of these six numbers is to be the fixed picture you filter *against*.
//
// Every number is one somebody can act on:
//   open / p1        — the queue, and the part of it that is on fire
//   unassigned       — nobody has picked it up; the difference between a queue
//                      and a list
//   awaiting_check   — WE are done and a school is waiting to confirm. This is
//                      the one that quietly rots: it looks finished to us and
//                      unfixed to them
//   reopened         — fixes that did not hold. A rising number here means the
//                      released ones are not trustworthy
//   oldest_open_at   — the age of the oldest thing nobody has closed, which is
//                      the honest health of a backlog in a single date
//   resolved_7d      — what actually got finished, so the rest has a denominator
//
// The facets are built FROM the data, not from a hardcoded list, so a dropdown
// can only ever offer a value that has tickets behind it — no filter that
// returns an empty table and looks broken.
platform.get('/stats', async (req, res) => {
  try {
    // "Open" means one thing everywhere on this screen, so it is written once.
    // Two spellings rather than one plus a regex rewrite: the aliased query needs
    // the prefix, and a string that quietly rewrites SQL is the kind of clever
    // that breaks the day someone adds a column with 'status' in its name.
    const OPEN = "status <> 'closed' AND duplicate_of IS NULL AND withdrawn_at IS NULL";
    const OPEN_T = "t.status <> 'closed' AND t.duplicate_of IS NULL AND t.withdrawn_at IS NULL";

    // queryOne, NOT `const [[k]] = await query(...)`. config/db's query() returns
    // the rows directly, unlike pool.execute() which returns [rows, fields] — the
    // double-destructure reads a row object as an array and yields undefined, and
    // the first property access after it throws.
    const k = await queryOne(`
      SELECT
        SUM(${OPEN})                                              AS open_now,
        SUM(${OPEN} AND severity='P1')                            AS p1_open,
        SUM(${OPEN} AND assignee_user_id IS NULL)                 AS unassigned,
        SUM(status='closed' AND confirmed_at IS NULL
            AND duplicate_of IS NULL AND withdrawn_at IS NULL)    AS awaiting_check,
        SUM(${OPEN} AND reopened_count > 0)                       AS reopened,
        COUNT(DISTINCT CASE WHEN ${OPEN} THEN org_id END)         AS orgs_affected,
        MIN(CASE WHEN ${OPEN} THEN created_at END)                AS oldest_open_at,
        SUM(status='closed' AND resolved_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS resolved_7d
      FROM client_helpdesk_tickets`);

    const byStatus = await query(
      `SELECT status, COUNT(*) n FROM client_helpdesk_tickets
        WHERE duplicate_of IS NULL AND withdrawn_at IS NULL GROUP BY status`);

    // Facets carry an OPEN count, not a total: a school with forty closed
    // tickets and none open is not who you are looking for this morning.
    // Aggregates are spelled out again in ORDER BY — MariaDB will not take the
    // alias there even though local MySQL does.
    const orgs = await query(`
      SELECT t.org_id id, o.name, SUM(${OPEN_T}) open_now, COUNT(*) total
        FROM client_helpdesk_tickets t
        LEFT JOIN client_organizations o ON o.id = t.org_id
       GROUP BY t.org_id, o.name
       ORDER BY SUM(${OPEN_T}) DESC, COUNT(*) DESC`);

    const roles = await query(`
      SELECT LOWER(reporter_role) role, COUNT(*) total,
             SUM(${OPEN}) open_now
        FROM client_helpdesk_tickets
       WHERE reporter_role IS NOT NULL AND reporter_role <> ''
       GROUP BY LOWER(reporter_role)
       ORDER BY COUNT(*) DESC`);

    const modules = await query(`
      SELECT module_slug module, COUNT(*) total,
             SUM(${OPEN}) open_now
        FROM client_helpdesk_tickets
       WHERE module_slug IS NOT NULL AND module_slug <> ''
       GROUP BY module_slug
       ORDER BY COUNT(*) DESC
       LIMIT 40`);

    // WHERE on the page the queue is piling up. Grouped at two levels rather
    // than on the full path: `fees.collection` is a place someone can go and
    // look at, whereas `fees.collection.payment_summary.receipt_button` is forty
    // rows of one ticket each and answers nothing. The full path is still on
    // every row for the person who opens the ticket.
    const areas = await query(`
      SELECT SUBSTRING_INDEX(area_path, '.', 2) area, COUNT(*) total,
             SUM(${OPEN}) open_now
        FROM client_helpdesk_tickets
       WHERE area_path IS NOT NULL AND area_path <> ''
       GROUP BY SUBSTRING_INDEX(area_path, '.', 2)
       ORDER BY COUNT(*) DESC
       LIMIT 40`);

    // Which known bug class the words point at. Only ever a hint (see
    // helpdesk.rc.js) — most tickets match nothing and are absent here.
    const rcs = await query(`
      SELECT suggested_rc_code rc, COUNT(*) total,
             SUM(${OPEN}) open_now
        FROM client_helpdesk_tickets
       WHERE suggested_rc_code IS NOT NULL
       GROUP BY suggested_rc_code
       ORDER BY COUNT(*) DESC`);

    const n = (v) => Number(v) || 0;
    return success(res, {
      kpi: {
        open: n(k.open_now), p1: n(k.p1_open), unassigned: n(k.unassigned),
        awaiting_check: n(k.awaiting_check), reopened: n(k.reopened),
        orgs_affected: n(k.orgs_affected), resolved_7d: n(k.resolved_7d),
        oldest_open_at: k.oldest_open_at || null,
      },
      by_status: byStatus,
      facets: {
        orgs: orgs.map((o) => ({ ...o, open_now: n(o.open_now), total: n(o.total) })),
        roles: roles.map((r) => ({ ...r, open_now: n(r.open_now), total: n(r.total) })),
        modules: modules.map((m) => ({ ...m, open_now: n(m.open_now), total: n(m.total) })),
        areas: areas.map((a) => ({ ...a, open_now: n(a.open_now), total: n(a.total) })),
        rcs: rcs.map((r) => ({ ...r, open_now: n(r.open_now), total: n(r.total) })),
        kinds: Object.entries(S.KINDS).map(([key, v]) => ({ key, label: v.label })),
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

// Move a ticket along. Every field is optional; only what is sent changes.
platform.patch('/tickets/:id', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    if (!id) return error(res, 'Bad ticket id', 400);
    const t = await queryOne('SELECT * FROM client_helpdesk_tickets WHERE id=?', [id]);
    if (!t) return error(res, 'Ticket not found', 404);

    const sets = [], params = [];
    let newStatus = null;

    if (req.body.status !== undefined) {
      if (!S.STATUSES.includes(req.body.status)) return error(res, 'Unknown status', 400);
      newStatus = req.body.status;
      sets.push('status=?'); params.push(newStatus);
      // Closing IS "the fix is live" now — the separate `released` step is gone.
      // Stamp when, and in which build, so a fix that did not hold can be traced
      // to what shipped; and clear any earlier confirmation so the reporter is
      // asked again about THIS fix rather than being counted as already happy.
      if (newStatus === 'closed') {
        sets.push('resolved_at=NOW()', 'released_build=?', 'confirmed_at=NULL');
        params.push(S.BUILD_INFO.git_sha);
      }
    }
    if (req.body.severity !== undefined) {
      const sev = String(req.body.severity).toUpperCase();
      if (!['P1', 'P2', 'P3'].includes(sev)) return error(res, 'Severity must be P1, P2 or P3', 400);
      sets.push('severity=?'); params.push(sev);
    }
    if (req.body.assignee_user_id !== undefined) {
      // Null clears it. Otherwise the user MUST be on the platform team: the column has
      // no foreign key and no org check, so without this a ticket could be assigned to
      // a user at another school — putting one customer's bug in another customer's
      // name, and showing that name back to the reporter.
      const aid = req.body.assignee_user_id === null || req.body.assignee_user_id === ''
        ? null : asInt(req.body.assignee_user_id);
      if (aid) {
        const ok = await queryOne(
          'SELECT id FROM client_users WHERE id=? AND org_id=? AND is_active=1', [aid, PLATFORM_ORG_ID]);
        if (!ok) return error(res, 'A ticket can only be assigned to a WisWits team member', 400);
      }
      sets.push('assignee_user_id=?'); params.push(aid);
      // Somebody owning a ticket IS "being worked on" — so the status moves
      // itself. Asking a person to pick an assignee and then also remember to
      // change a dropdown is how a ticket sits at "Open" while it is half
      // fixed, which is exactly what the school then reports again.
      if (aid && t.status === 'open' && newStatus === null) {
        newStatus = 'processing';
        sets.push('status=?'); params.push(newStatus);
      }
    }
    if (req.body.resolution !== undefined) { sets.push('resolution=?'); params.push(String(req.body.resolution).slice(0, 4000)); }
    if (!sets.length) return error(res, 'Nothing to update', 400);

    params.push(id);
    await query(`UPDATE client_helpdesk_tickets SET ${sets.join(', ')} WHERE id=?`, params);

    if (newStatus && newStatus !== t.status) {
      // Everyone who reported the same bug watches their OWN row, so the merged
      // children move with the parent. Without this they are notified that it is
      // fixed while their ticket still reads "Processing".
      await query('UPDATE client_helpdesk_tickets SET status=? WHERE duplicate_of=?', [newStatus, id]);
      await S.logEvent(t, actorOf(req, 'WisWits Team'), 'status',
        { from: t.status, to: newStatus, note: req.body.resolution || '' });
      const msg = S.STATUS_MESSAGE[newStatus];
      if (msg) {
        await S.notifyReporters(t,
          newStatus === 'closed' ? 'Your report is fixed — please check' : 'Update on your report',
          `${t.ticket_no}: ${msg}`);
      }
      // Keep the GitHub issue in step. Not awaited, for the same reason as above.
      github.syncStatus(t, newStatus).catch(() => { /* logged inside */ });
    }
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

// Merge one ticket into another (they are the same bug).
platform.post('/tickets/:id/merge', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    const into = asInt(req.body.into);
    if (!id || !into) return error(res, 'Both ticket ids are required', 400);
    if (id === into) return error(res, 'A ticket cannot merge into itself', 400);
    const child = await queryOne('SELECT * FROM client_helpdesk_tickets WHERE id=?', [id]);
    const parent = await queryOne('SELECT * FROM client_helpdesk_tickets WHERE id=?', [into]);
    if (!child || !parent) return error(res, 'Ticket not found', 404);
    if (parent.duplicate_of) return error(res, 'That ticket is itself a duplicate — merge into the original', 400);

    // The child takes the PARENT's status, not a 'duplicate' one of its own —
    // it is the same bug, so its reporter should watch the same progress.
    await query(`UPDATE client_helpdesk_tickets SET duplicate_of=?, status=? WHERE id=?`,
      [into, parent.status, id]);
    // Anything already merged into the child follows it, so no reporter is
    // orphaned from the fix notification.
    await query(`UPDATE client_helpdesk_tickets SET duplicate_of=?, status=? WHERE duplicate_of=?`,
      [into, parent.status, id]);
    await S.logEvent(child, actorOf(req, 'WisWits Team'), 'merged',
      { from: child.status, to: parent.status, note: `into ${parent.ticket_no}` });
    return success(res, {}, `Merged into ${parent.ticket_no}`);
  } catch (e) { return error(res, e.message, 500); }
});

// Turn the widget on/off for one org. Absent row means off, so this is how a
// pilot school gets it without any client seeing it.
platform.post('/orgs/:orgId/widget', async (req, res) => {
  try {
    const orgId = asInt(req.params.orgId);
    if (!orgId) return error(res, 'Bad org id', 400);
    const on = req.body.enabled !== false;
    await query(
      `INSERT INTO client_feature_flags (org_id, feature_key, is_enabled) VALUES (?, 'helpdesk_widget', ?)
       ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled)`, [orgId, on ? 1 : 0]);
    logger.info('[HELPDESK] widget flag', { org_id: orgId, enabled: on, by: req.user.user_id });
    return success(res, { org_id: orgId, enabled: on }, on ? 'Reporting turned on' : 'Reporting turned off');
  } catch (e) { return error(res, e.message, 500); }
});

// Which orgs currently have it on — the roll-out picture in one call.
/**
 * Who a ticket can be assigned to: the WisWits platform team, and only them.
 *
 * Scoped to the platform org rather than "any elevated user", because assigning a
 * customer's bug to somebody at another customer's school would put one school's
 * problem in another school's name — and `assignee_user_id` has no org check of its own.
 */
platform.get('/assignees', async (req, res) => {
  try {
    // Platform org membership alone is not enough. Org 1 also holds the platform's
    // own student and parent demo logins, and the first version of this listed them —
    // offering to assign a school's bug to "the student account". Restricted to the
    // roles that can actually work a ticket, which is the SAME list that decides who
    // may read one (S.ELEVATED), so the dropdown and the permission agree by
    // construction instead of by coincidence.
    const rows = await query(
      `SELECT DISTINCT u.id,
              NULLIF(TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))), '') AS name,
              u.email
         FROM client_users u
         JOIN client_user_roles ur ON ur.user_id = u.id
         JOIN client_roles r ON r.id = ur.role_id
        WHERE u.org_id = ? AND u.is_active = 1
          AND LOWER(r.slug) IN (${S.ELEVATED.map(() => '?').join(',')})
        ORDER BY name, u.email`, [PLATFORM_ORG_ID, ...S.ELEVATED]);
    return success(res, { assignees: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ IDEAS — what schools have asked us to BUILD ═══════════════════════════
//
// The wishes never belonged in the bug queue. Of the first 58 reports, roughly
// four in ten were wants, and each one sat on a school's board as an open
// PROBLEM — making a working product look broken and burying the few things
// that were. They are now their own list, and the unit of that list is not the
// idea, it is the GROUP: one admin saying "print receipt" is a line, eleven
// people across four schools saying it is a roadmap item nobody has to argue
// about.
//
// Grouping is COMPUTED on every load (ideas.service.js — no AI, no per-idea
// cost, same answer every run). Only the decision is stored.
platform.get('/ideas', async (req, res) => {
  try {
    // `people` and `roles` come back too, because demand is what SETS the
    // default priority now — a list that ranks itself from evidence and lets a
    // human overrule it beats a list of numbers somebody had to invent.
    const accepted = await query(
      `SELECT i.*,
              (SELECT COUNT(*) FROM platform_idea_tickets t WHERE t.idea_id=i.id) AS reports,
              (SELECT COUNT(DISTINCT t.org_id) FROM platform_idea_tickets t WHERE t.idea_id=i.id) AS schools,
              (SELECT COUNT(DISTINCT h.reported_by) FROM platform_idea_tickets t
                 JOIN client_helpdesk_tickets h ON h.id=t.ticket_id WHERE t.idea_id=i.id) AS people,
              (SELECT COUNT(DISTINCT LOWER(h.reporter_role)) FROM platform_idea_tickets t
                 JOIN client_helpdesk_tickets h ON h.id=t.ticket_id WHERE t.idea_id=i.id) AS roles
         FROM platform_ideas i
        ORDER BY i.status='parked', COALESCE(i.priority, 0) DESC, i.id DESC`);

    for (const idea of accepted) {
      idea.members = await query(
        `SELECT t.id, t.ticket_no, t.title, t.org_id, o.name AS org_name, t.reporter_name,
                t.reporter_role, t.module_slug, t.created_at
           FROM platform_idea_tickets pit
           JOIN client_helpdesk_tickets t ON t.id = pit.ticket_id
           LEFT JOIN client_organizations o ON o.id = t.org_id
          WHERE pit.idea_id=? ORDER BY t.id ASC`, [idea.id]);
    }

    // Everything a school has asked for that is not yet in the list. Oldest
    // first so the grouping is stable between loads.
    const loose = await query(
      `SELECT t.id, t.ticket_no, t.title, t.description, t.org_id, o.name AS org_name,
              t.reporter_name, t.reporter_role AS role, t.reported_by, t.module_slug AS module,
              t.status, t.created_at
         FROM client_helpdesk_tickets t
         LEFT JOIN client_organizations o ON o.id = t.org_id
        WHERE t.kind IN ('request','question')
          AND t.withdrawn_at IS NULL
          AND t.id NOT IN (SELECT ticket_id FROM platform_idea_tickets)
        ORDER BY t.id ASC`);

    const suggested = ideas.groupIdeas(
      loose.map((t) => ({ ...t, text: `${t.title} ${t.description || ''}` })));

    return success(res, {
      accepted,
      suggested,
      // What is NOT in this list yet, so nobody assumes the list is everything.
      unsorted: loose.length,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// Accept a group into the list — or park it with a reason.
platform.post('/ideas', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim().slice(0, 255);
    const ticketIds = (Array.isArray(req.body.ticket_ids) ? req.body.ticket_ids : []).map(asInt).filter(Boolean);
    if (!title) return error(res, 'A title is required', 400);
    if (!ticketIds.length) return error(res, 'An idea needs at least one report behind it', 400);

    const status = ['new', 'planned', 'building', 'shipped', 'parked'].includes(req.body.status)
      ? req.body.status : 'new';
    const r = await query(
      `INSERT INTO platform_ideas (title, summary, status, priority, decision, module_slug)
       VALUES (?,?,?,?,?,?)`,
      [title, req.body.summary || null, status,
       req.body.priority != null ? asInt(req.body.priority) : null,
       req.body.decision || null, req.body.module_slug || null]);

    // INSERT IGNORE, because a ticket belongs to exactly one idea (the UNIQUE
    // key says so) and a double-click must not 500 in someone's face.
    for (const tid of ticketIds) {
      await query(
        `INSERT IGNORE INTO platform_idea_tickets (idea_id, ticket_id, org_id)
         SELECT ?, id, org_id FROM client_helpdesk_tickets WHERE id=?`, [r.insertId, tid]);
    }
    logger.info('[IDEAS] accepted', { idea: r.insertId, title, reports: ticketIds.length, by: req.user.user_id });
    return success(res, { id: r.insertId }, 'Added to the list', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// Move it along the list: priority, status, the reason behind either.
platform.patch('/ideas/:id', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    if (!id) return error(res, 'Bad idea id', 400);
    const sets = [], params = [];
    if (req.body.title !== undefined) { sets.push('title=?'); params.push(String(req.body.title).slice(0, 255)); }
    if (req.body.summary !== undefined) { sets.push('summary=?'); params.push(req.body.summary); }
    if (req.body.decision !== undefined) { sets.push('decision=?'); params.push(req.body.decision); }
    if (req.body.priority !== undefined) {
      sets.push('priority=?'); params.push(req.body.priority === null || req.body.priority === '' ? null : asInt(req.body.priority));
    }
    if (req.body.status !== undefined) {
      if (!['new', 'planned', 'building', 'shipped', 'parked'].includes(req.body.status)) {
        return error(res, 'Unknown status', 400);
      }
      sets.push('status=?'); params.push(req.body.status);
    }
    if (!sets.length) return error(res, 'Nothing to update', 400);
    params.push(id);
    await query(`UPDATE platform_ideas SET ${sets.join(', ')} WHERE id=?`, params);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

// Pull one more report into an existing idea — the manual half of grouping,
// for the pairs no similarity score will ever see ("payroll" and "biometric").
platform.post('/ideas/:id/tickets', async (req, res) => {
  try {
    const id = asInt(req.params.id);
    const tid = asInt(req.body.ticket_id);
    if (!id || !tid) return error(res, 'Idea id and ticket id are required', 400);
    await query(
      `INSERT IGNORE INTO platform_idea_tickets (idea_id, ticket_id, org_id)
       SELECT ?, id, org_id FROM client_helpdesk_tickets WHERE id=?`, [id, tid]);
    return success(res, {}, 'Added to the idea');
  } catch (e) { return error(res, e.message, 500); }
});

platform.get('/orgs', async (req, res) => {
  try {
    const rows = await query(
      `SELECT o.id, o.name,
              COALESCE(f.is_enabled, 0) AS enabled,
              (SELECT COUNT(*) FROM client_helpdesk_tickets t
                WHERE t.org_id=o.id AND t.duplicate_of IS NULL) AS tickets
         FROM client_organizations o
         LEFT JOIN client_feature_flags f ON f.org_id=o.id AND f.feature_key='helpdesk_widget'
        ORDER BY enabled DESC, o.name ASC`);
    return success(res, { orgs: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.use('/admin', platform);

module.exports = router;
