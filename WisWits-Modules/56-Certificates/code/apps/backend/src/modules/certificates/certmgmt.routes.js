'use strict';
/*
 * CERTIFICATE ENGINE — admin surface (/api/cert-mgmt).
 *
 * Tenant-configurable certificates: an organisation defines its own types and ID
 * format, uploads artwork, positions elements, and the SERVER renders the finished
 * PNG/PDF (certRender.js). The public verification endpoint lives in
 * certmgmt.public.routes.js — mounted separately, before `authenticate`.
 *
 * INVARIANTS (each has cost a bug somewhere before):
 *   • Every query scopes by org_id. No exceptions, including reads (§17).
 *   • Parameterised SQL only — no string-built WHERE fragments carrying values.
 *   • The browser never uploads a rendered certificate; it sends coordinates.
 *   • Nothing is hard-deleted. Issued certificates revoke; templates deactivate.
 *   • Expiry is DERIVED from expires_on at read time, never a stored status.
 *   • Generated files get opaque names: /uploads is publicly served, so a
 *     guessable "Certificate_Priya_Sharma.pdf" would be world-readable. The
 *     friendly filename is applied at download via Content-Disposition.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const QRCode = require('qrcode');

const router = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { audit } = require('../../utils/audit');
const logger = require('../../utils/logger');
const { makeCheckCode, formatId, effectivePattern, nextSequence, sanitiseCode } = require('./certIds');
const { buildHtml, buildVars, substituteBody, renderPng, renderPdf, inlineUpload, FONT_KEYS, fmtDate } = require('./certRender');
const { FONT_CATALOGUE } = require('./certFonts');
const { DEFAULT_TYPES, PRESETS, defaultLayout } = require('./certDefaults');
const { THEMES, THEME_KEYS, themeLayout, themeFrame } = require('./certThemes');

router.use(authenticate);

// Certificates are an act of the organisation, so issuing sits with the leadership
// tier. Teachers deliberately excluded — unlike student certificates, these carry
// the organisation's name to outside employers.
const ADMIN = ['owner', 'admin', 'principal', 'super_admin', 'system_admin'];
const STAFF = [...ADMIN, 'coordinator', 'hod'];
const requireAdmin = requireRole(...ADMIN);
const requireStaff = requireRole(...STAFF);

// ── Storage ─────────────────────────────────────────────────────────────────
const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');
const DIRS = {
  templates: path.join(UPLOAD_ROOT, 'certificates/templates'),
  signatures: path.join(UPLOAD_ROOT, 'certificates/signatures'),
  // Loose images placed on the canvas — a second logo, an accreditation mark, a
  // one-off scanned signature. Kept apart from `templates` because those are
  // ARTWORK (a whole sheet, listed in the picker) and these are just elements.
  assets: path.join(UPLOAD_ROOT, 'certificates/assets'),
  qr: path.join(UPLOAD_ROOT, 'certificates/qr'),
  out: path.join(UPLOAD_ROOT, 'certificates/generated'),
};
for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true });

const opaqueName = (ext) => `${crypto.randomBytes(16).toString('hex')}${ext}`;
const rel = (abs) => `/uploads/${path.relative(UPLOAD_ROOT, abs).split(path.sep).join('/')}`;

/*
 * Accepted image types.
 *
 * Everything Chrome can actually render, and nothing it cannot. HEIC is the
 * notable exclusion: phones produce it by default and Chrome will not decode it,
 * so accepting one would store a file that silently renders as a blank
 * certificate. Refusing it with a reason is the kinder outcome.
 *
 * SVG is allowed. It can carry scripts, but a vector loaded through <img> or a
 * CSS background — which is the only way this module ever uses one — is in the
 * browser's restricted image mode: no scripts run, no external resources are
 * fetched. That is also why the artwork is never injected as inline markup.
 */
const IMAGE_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
};
const ACCEPTED_LABEL = 'PNG, JPG, WebP, AVIF, GIF, SVG, BMP or TIFF';

/** Size ceiling for every certificate asset. */
const MAX_UPLOAD_MB = 2;

const imageUpload = (dir) => multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    // The extension comes from the DETECTED type, never from the uploaded name —
    // so "logo.php.png" cannot land on disk with an executable extension.
    filename: (req, file, cb) => cb(null, opaqueName(IMAGE_TYPES[file.mimetype] || '.png')),
  }),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
    // Reject with a REASON. multer's cb(null, false) drops the file silently and
    // the handler can then only guess why req.file is missing — which is how
    // "wrong format" and "no file chosen" ended up sharing one wrong message.
    const err = new Error(
      file.mimetype === 'image/heic' || file.mimetype === 'image/heif'
        ? 'HEIC images cannot be rendered. Export as JPG or PNG first — on iPhone, Settings → Camera → Formats → Most Compatible.'
        : `That file type (${file.mimetype || 'unknown'}) is not supported. Use ${ACCEPTED_LABEL}.`
    );
    err.code = 'UNSUPPORTED_IMAGE_TYPE';
    return cb(err);
  },
});
const templateUpload = imageUpload(DIRS.templates);
const signatureUpload = imageUpload(DIRS.signatures);
const assetUpload = imageUpload(DIRS.assets);

/**
 * Turn multer's rejections into the sentence the admin needs.
 * Without this a too-large file surfaces as a generic 500.
 */
function uploadError(err) {
  if (!err) return null;
  if (err.code === 'LIMIT_FILE_SIZE') {
    return `That file is larger than ${MAX_UPLOAD_MB} MB. Compress it, or save it as WebP or JPG — both hold print quality at a fraction of the size.`;
  }
  if (err.code === 'UNSUPPORTED_IMAGE_TYPE') return err.message;
  return err.message || 'Upload failed';
}

/** Wrap a multer middleware so its errors reach the client as 400s, not 500s. */
const withUpload = (mw) => (req, res, next) => mw(req, res, (err) => {
  if (err) return error(res, uploadError(err), 400);
  return next();
});

// ── Small helpers ───────────────────────────────────────────────────────────
const str = (v, max) => (v == null || v === '' ? null : String(v).slice(0, max));
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const dateOrNull = (v) => (isDate(v) ? v : null);
/** "Today" in IST — the platform's users are all in one timezone; UTC would roll a day early. */
const istToday = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

/*
 * Human duration between two dates.
 *
 * Weeks up to ~4 months, months beyond. The cut-off used to be 70 days, which
 * turned a 1 May–15 Jul internship (76 days) into "2 months" — both vague and
 * short: it is nearer two and a half. Internships and courses are counted in
 * weeks by the people who run them, and "11 weeks" is both what they say and
 * the more accurate number. Rounding to months only stops losing information
 * once the span is long enough for a month to be a sensible grain.
 */
function durationText(start, end) {
  if (!isDate(start) || !isDate(end)) return null;
  const days = Math.round((new Date(end) - new Date(start)) / 86400e3) + 1;
  if (days <= 0) return null;
  if (days < 14) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 122) { const w = Math.round(days / 7); return `${w} week${w === 1 ? '' : 's'}`; }
  const m = Math.round(days / 30.44);
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  const y = Math.floor(m / 12); const rm = m % 12;
  return rm ? `${y} year${y === 1 ? '' : 's'} ${rm} month${rm === 1 ? '' : 's'}` : `${y} year${y === 1 ? '' : 's'}`;
}

/** The one place validity is decided. Derived, never read from a stored column. */
function validityOf(row, today = istToday()) {
  if (row.status === 'revoked') return 'revoked';
  if (row.status !== 'issued') return row.status;               // draft
  const exp = row.expires_on ? String(row.expires_on).slice(0, 10) : null;
  if (exp && exp < today) return 'expired';
  return 'valid';
}

function appBase() {
  return String(process.env.PUBLIC_APP_URL || 'https://app.wiswits.com').replace(/\/+$/, '');
}

// ── Settings + types: created on first touch so no org ever meets an empty module ──
async function ensureSettings(orgId) {
  let s = await queryOne('SELECT * FROM client_cert_settings WHERE org_id=?', [orgId]);
  if (s) return s;
  // Seed the prefix from the organisation's own name — "Sunrise Public School"
  // becomes SPS — so the very first certificate already feels like theirs.
  const org = await queryOne('SELECT name FROM client_organizations WHERE id=?', [orgId]);
  const initials = String(org?.name || 'WWS').split(/\s+/).filter(Boolean).map((w) => w[0]).join('');
  const prefix = sanitiseCode(initials, 5) || 'WWS';
  await query(
    `INSERT INTO client_cert_settings (org_id, id_prefix) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE org_id = org_id`,
    [orgId, prefix]
  );
  return queryOne('SELECT * FROM client_cert_settings WHERE org_id=?', [orgId]);
}

async function ensureTypes(orgId) {
  const rows = await query('SELECT * FROM client_cert_types WHERE org_id=? ORDER BY sort_order, id', [orgId]);
  if (rows.length) return rows;
  for (const t of DEFAULT_TYPES) {
    await query(
      `INSERT INTO client_cert_types (org_id, name, code, default_validity_months, default_body, sort_order)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name = name`,
      [orgId, t.name, t.code, t.default_validity_months, t.default_body, t.sort_order]
    );
  }
  return query('SELECT * FROM client_cert_types WHERE org_id=? ORDER BY sort_order, id', [orgId]);
}

/*
 * Layout sanitisation. The layout is client-authored JSON that later drives a
 * server-side render, so it is untrusted input in the strict sense — but the
 * renderer already clamps every numeric and rejects any colour that is not a hex
 * literal, and escapes all text. What matters HERE is bounding the size: an
 * enormous elements array would be stored, re-read and re-rendered forever.
 */
/** The only shape an element `src` may take: an asset this module generated,
 *  in one of this module's own directories. Returns undefined for anything else. */
const CERT_ASSET = /^\/uploads\/certificates\/(templates|signatures|assets)\/[a-f0-9]{32}\.[a-z0-9]{2,5}$/i;
const certAssetPath = (v) => (v != null && CERT_ASSET.test(String(v)) ? String(v) : undefined);

function sanitiseLayout(input) {
  const src = input && typeof input === 'object' ? input : {};
  const elements = Array.isArray(src.elements) ? src.elements.slice(0, 40) : [];
  return {
    preset: typeof src.preset === 'string' ? src.preset.slice(0, 24) : 'custom',
    elements: elements.filter((e) => e && typeof e === 'object').map((e) => ({
      type: ['text', 'qr', 'image', 'logo', 'signatory', 'rule', 'seal'].includes(e.type) ? e.type : 'text',
      key: String(e.key || 'text').slice(0, 40),
      text: e.text != null ? String(e.text).slice(0, 2000) : undefined,
      /*
       * An image element's `src` is a path the SERVER later reads off disk to
       * inline (certRender.inlineUpload). inlineUpload refuses to escape the
       * uploads root, but "anywhere under uploads/" still spans student photos,
       * submissions and every other module's files. A certificate only ever
       * draws certificate assets, so say exactly that: our own directories, and
       * the opaque names we generate. Anything else is dropped, not corrected.
       */
      src: certAssetPath(e.src),
      x: Number(e.x), y: Number(e.y), w: Number(e.w),
      size: e.size != null ? Number(e.size) : undefined,
      font: FONT_KEYS.includes(e.font) ? e.font : undefined,
      weight: e.weight != null ? Number(e.weight) : undefined,
      color: e.color != null ? String(e.color).slice(0, 9) : undefined,
      align: ['left', 'center', 'right', 'justify'].includes(e.align) ? e.align : undefined,
      lineHeight: e.lineHeight != null ? Number(e.lineHeight) : undefined,
      letterSpacing: e.letterSpacing != null ? Number(e.letterSpacing) : undefined,
      rotate: e.rotate != null ? Number(e.rotate) : undefined,
      idx: e.idx != null ? Number(e.idx) : undefined,
      thickness: e.thickness != null ? Number(e.thickness) : undefined,
      italic: !!e.italic, underline: !!e.underline, uppercase: !!e.uppercase,
    })),
  };
}

const parseJson = (v, dflt = null) => {
  if (v == null) return dflt;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return dflt; }
};


/** A4 at 300 DPI, the size every built-in theme renders at. Matches the sheet the
 *  PDF is laid out on, so screenshot and print are the same design at two scales. */
const A4 = { landscape: { w: 3508, h: 2480 }, portrait: { w: 2480, h: 3508 } };

const validTheme = (k) => (THEME_KEYS.includes(String(k)) ? String(k) : null);
const validOrientation = (v) => (v === 'portrait' ? 'portrait' : 'landscape');

/**
 * Load the signatories to print, in the order given.
 *
 * Snapshotted onto the certificate (signatories_json) rather than joined at
 * render time: removing someone from the organisation's list later must not
 * silently change a certificate already in someone's hands.
 */
async function loadSignatories(orgId, ids) {
  const list = (Array.isArray(ids) ? ids : [ids]).filter((v) => v != null && v !== '').slice(0, 4);
  if (!list.length) return [];
  const rows = await query(
    `SELECT id, name, designation, signature_path FROM client_cert_signatories
      WHERE org_id=? AND id IN (${list.map(() => '?').join(',')})`, [orgId, ...list]);
  // Preserve the caller's order — left-to-right on the certificate is a decision.
  return list.map((id) => rows.find((r) => String(r.id) === String(id))).filter(Boolean);
}

/** The organisation's logo, if it has one and the certificate wants it shown. */
async function orgLogo(orgId) {
  const org = await queryOne('SELECT logo_url FROM client_organizations WHERE id=?', [orgId]);
  return org?.logo_url || null;
}

// ════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP — one call the module page opens with, so the UI never renders
// half-configured while four requests race.
// ════════════════════════════════════════════════════════════════════════════
router.get('/bootstrap', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const [settings, types] = [await ensureSettings(o), await ensureTypes(o)];
    const templates = await query(
      'SELECT id, name, file_path, width_px, height_px, orientation, layout_json, created_at FROM client_cert_templates WHERE org_id=? AND is_active=1 ORDER BY id DESC',
      [o]);
    const signatories = await query(
      'SELECT id, name, designation, signature_path FROM client_cert_signatories WHERE org_id=? AND is_active=1 ORDER BY name',
      [o]);
    const org = await queryOne('SELECT name, logo_url FROM client_organizations WHERE id=?', [o]);
    // Saved designs. Wrapped because the table arrives with migration 057 and the
    // editor must still open on a server that has not run it yet — a missing
    // design list is a smaller failure than a certificate page that will not load.
    let designs = [];
    try {
      designs = (await query(
        `SELECT ${DESIGN_COLS} FROM client_cert_designs WHERE org_id=? AND is_active=1 ORDER BY updated_at DESC`,
        [o])).map(designRow);
    } catch (e) {
      logger.warn?.('cert designs unavailable (migration 057 not applied?)', { message: e.message });
    }
    return success(res, {
      settings,
      types,
      templates: templates.map((t) => ({ ...t, layout_json: parseJson(t.layout_json) })),
      designs,
      signatories,
      organisation: org || null,
      // Full element sets, not just labels: the editor applies a preset locally
      // with no round trip, and "Classic" therefore means exactly the same thing
      // in the editor as it does in the render.
      presets: Object.entries(PRESETS).map(([key, p]) => ({ key, label: p.label, elements: p.elements })),
      // Built-in designs. Shipped with BOTH orientations' layouts so the editor
      // can switch orientation without a round trip, and with the frame markup
      // so the browser preview draws exactly what the renderer will.
      themes: THEME_KEYS.map((key) => ({
        key,
        label: THEMES[key].label,
        description: THEMES[key].description,
        ground: THEMES[key].ground,
        accent: THEMES[key].accent,
        ink: THEMES[key].ink,
        layouts: {
          landscape: themeLayout(key, 'landscape', 1).elements,
          portrait: themeLayout(key, 'portrait', 1).elements,
        },
        // The frame markup itself, verbatim. Lengths are calc(var(--sh) * n), so
        // the editor draws the identical border by setting --sh to its own
        // measured height — no second implementation, nothing to drift.
        frames: {
          landscape: themeFrame(key, true),
          portrait: themeFrame(key, false),
        },
      })),
      a4: A4,
      // The full typeface catalogue — key, label, group AND the exact CSS stack.
      // The editor must never re-derive a stack: a stack it invents is a stack
      // the renderer does not know, and the difference only shows up on paper.
      fonts: FONT_CATALOGUE,
      // Where the browser fetches those faces from. The render inlines its own.
      fonts_css_url: '/api/cert-mgmt/public/fonts.css',
      verify_base: `${appBase()}/verify`,
      can_manage: ADMIN.includes(String(req.user.role_slug || '').toLowerCase()),
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════════════════
router.patch('/settings', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    await ensureSettings(o);
    const b = req.body || {};
    const sets = [];
    const p = [];
    if (b.id_prefix !== undefined) {
      const pre = sanitiseCode(b.id_prefix, 12);
      if (!pre) return error(res, 'Prefix must contain at least one letter or digit', 400);
      sets.push('id_prefix=?'); p.push(pre);
    }
    if (b.id_pattern !== undefined) {
      const pat = String(b.id_pattern || '').slice(0, 64);
      // A pattern without a sequence token would hand every certificate the same
      // ID, and the unique index would then reject every one after the first.
      if (!/\{SEQ(:\d+)?\}/.test(pat)) return error(res, 'The pattern must include {SEQ} or {SEQ:n}', 400);
      // The ID becomes a URL path segment in every QR ever printed. A slash would
      // survive as %2F only until the first proxy that normalises it, and by then
      // the codes are on paper and unfixable. Refuse it here, once.
      if (pat.includes('/')) return error(res, 'The pattern cannot contain "/" — it is used in the verification link. Try "-" instead.', 400);
      sets.push('id_pattern=?'); p.push(pat);
    }
    for (const k of ['use_type_prefix', 'verify_show_department', 'verify_show_period', 'verify_show_signatory']) {
      if (b[k] !== undefined) { sets.push(`${k}=?`); p.push(b[k] ? 1 : 0); }
    }
    if (b.support_email !== undefined) { sets.push('support_email=?'); p.push(str(b.support_email, 190)); }
    if (b.default_theme_key !== undefined) {
      const th = validTheme(b.default_theme_key);
      if (!th) return error(res, 'Unknown design', 400);
      sets.push('default_theme_key=?'); p.push(th);
    }
    if (b.default_orientation !== undefined) { sets.push('default_orientation=?'); p.push(validOrientation(b.default_orientation)); }
    if (!sets.length) return error(res, 'Nothing to update', 400);
    await query(`UPDATE client_cert_settings SET ${sets.join(',')} WHERE org_id=?`, [...p, o]);
    await audit(req, 'CERT_SETTINGS_UPDATE', 'client_cert_settings', o, { new_data: b }).catch(() => {});
    return success(res, { settings: await queryOne('SELECT * FROM client_cert_settings WHERE org_id=?', [o]) }, 'Settings saved');
  } catch (e) { return error(res, e.message, 500); }
});

/** Preview the next ID without consuming a sequence number. */
router.get('/settings/preview-id', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const s = await ensureSettings(o);
    const type = req.query.type_id
      ? await queryOne('SELECT code FROM client_cert_types WHERE id=? AND org_id=?', [req.query.type_id, o])
      : null;

    /*
     * Honour the PENDING format if the caller sent one, else the saved format.
     *
     * The settings screen shows a live preview while you change the pattern and
     * the type-code toggle. Reading only the saved row left it frozen on the old
     * value, which reads as "my edit did nothing". The rule itself stays here,
     * server-side, so the preview and the real number cannot diverge.
     */
    const prefix = req.query.prefix !== undefined ? sanitiseCode(req.query.prefix, 12) : s.id_prefix;
    const pattern = req.query.pattern !== undefined ? String(req.query.pattern).slice(0, 64) : s.id_pattern;
    const useTypePrefix = req.query.use_type_prefix !== undefined
      ? (req.query.use_type_prefix === '1' || req.query.use_type_prefix === 'true')
      : !!s.use_type_prefix;

    const year = new Date().getFullYear();
    const scope = useTypePrefix && type?.code ? `${type.code}:${year}` : String(year);
    const row = await queryOne('SELECT next_val FROM client_cert_sequences WHERE org_id=? AND scope_key=?', [o, scope]);
    return success(res, {
      preview: formatId(effectivePattern(pattern, useTypePrefix), {
        prefix,
        typeCode: useTypePrefix ? type?.code : '',
        seq: Number(row?.next_val || 1),
      }),
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// TYPES — the org's own vocabulary
// ════════════════════════════════════════════════════════════════════════════
router.post('/types', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const b = req.body || {};
    const name = str(b.name, 80);
    const code = sanitiseCode(b.code, 12);
    if (!name) return error(res, 'Name is required', 400);
    if (!code) return error(res, 'Code is required — letters and digits only', 400);
    const dup = await queryOne('SELECT id FROM client_cert_types WHERE org_id=? AND code=?', [o, code]);
    if (dup) return error(res, `Code "${code}" is already used by another type`, 409);
    const r = await query(
      `INSERT INTO client_cert_types (org_id, name, code, default_validity_months, default_body, default_template_id, sort_order)
       VALUES (?,?,?,?,?,?,?)`,
      [o, name, code,
        b.default_validity_months != null && b.default_validity_months !== '' ? Number(b.default_validity_months) : null,
        str(b.default_body, 4000), b.default_template_id || null, Number(b.sort_order) || 0]);
    await audit(req, 'CERT_TYPE_CREATE', 'client_cert_types', r.insertId, { new_data: { name, code } }).catch(() => {});
    return success(res, { id: r.insertId }, 'Certificate type added', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/types/:id', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const existing = await queryOne('SELECT * FROM client_cert_types WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!existing) return error(res, 'Certificate type not found', 404);
    const b = req.body || {};
    const sets = []; const p = [];
    if (b.name !== undefined) { const n = str(b.name, 80); if (!n) return error(res, 'Name cannot be empty', 400); sets.push('name=?'); p.push(n); }
    if (b.code !== undefined) {
      const c = sanitiseCode(b.code, 12);
      if (!c) return error(res, 'Code cannot be empty', 400);
      const dup = await queryOne('SELECT id FROM client_cert_types WHERE org_id=? AND code=? AND id<>?', [o, c, existing.id]);
      if (dup) return error(res, `Code "${c}" is already used by another type`, 409);
      sets.push('code=?'); p.push(c);
    }
    if (b.default_validity_months !== undefined) {
      sets.push('default_validity_months=?');
      p.push(b.default_validity_months === null || b.default_validity_months === '' ? null : Number(b.default_validity_months));
    }
    if (b.default_body !== undefined) { sets.push('default_body=?'); p.push(str(b.default_body, 4000)); }
    if (b.default_template_id !== undefined) { sets.push('default_template_id=?'); p.push(b.default_template_id || null); }
    if (b.sort_order !== undefined) { sets.push('sort_order=?'); p.push(Number(b.sort_order) || 0); }
    if (b.is_active !== undefined) { sets.push('is_active=?'); p.push(b.is_active ? 1 : 0); }
    if (!sets.length) return error(res, 'Nothing to update', 400);
    await query(`UPDATE client_cert_types SET ${sets.join(',')} WHERE id=? AND org_id=?`, [...p, existing.id, o]);
    await audit(req, 'CERT_TYPE_UPDATE', 'client_cert_types', existing.id, { old_data: existing, new_data: b }).catch(() => {});
    // Renaming a type never touches certificates already issued — type_name is
    // denormalised onto each record precisely so history stays true.
    return success(res, {}, 'Certificate type updated');
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES — uploaded artwork
// ════════════════════════════════════════════════════════════════════════════
router.post('/templates', requireAdmin, withUpload(templateUpload.single('file')), async (req, res) => {
  try {
    const o = req.user.org_id;
    if (!req.file) return error(res, `Choose an image to upload — ${ACCEPTED_LABEL}, up to ${MAX_UPLOAD_MB} MB.`, 400);
    const b = req.body || {};
    const width = Math.round(Number(b.width_px)) || 3508;
    const height = Math.round(Number(b.height_px)) || 2480;
    if (width < 200 || height < 200 || width > 12000 || height > 12000) {
      fs.unlink(req.file.path, () => {});
      return error(res, 'Image dimensions look wrong — expected between 200 and 12000 pixels a side', 400);
    }
    const r = await query(
      `INSERT INTO client_cert_templates (org_id, name, file_path, width_px, height_px, orientation, layout_json, created_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [o, str(b.name, 120) || req.file.originalname.replace(/\.png$/i, '').slice(0, 120), rel(req.file.path),
        width, height, width >= height ? 'landscape' : 'portrait',
        // Fitted to THIS artwork's shape. Storing the landscape preset verbatim is
        // what buried a portrait letterhead under overlapping text the moment it
        // was uploaded — see fitElements() in certDefaults.js.
        JSON.stringify(defaultLayout(width, height)), req.user.user_id]);
    await audit(req, 'CERT_TEMPLATE_UPLOAD', 'client_cert_templates', r.insertId).catch(() => {});
    return success(res, {
      id: r.insertId, name: str(b.name, 120) || null, file_path: rel(req.file.path), width_px: width, height_px: height,
      orientation: width >= height ? 'landscape' : 'portrait', layout_json: defaultLayout(width, height),
    }, 'Template uploaded', 201);
  } catch (e) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return error(res, e.message, 500);
  }
});

router.patch('/templates/:id', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const tpl = await queryOne('SELECT id FROM client_cert_templates WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!tpl) return error(res, 'Template not found', 404);
    const b = req.body || {};
    const sets = []; const p = [];
    if (b.name !== undefined) { sets.push('name=?'); p.push(str(b.name, 120)); }
    if (b.layout_json !== undefined) { sets.push('layout_json=?'); p.push(JSON.stringify(sanitiseLayout(b.layout_json))); }
    if (b.is_active !== undefined) { sets.push('is_active=?'); p.push(b.is_active ? 1 : 0); }
    if (!sets.length) return error(res, 'Nothing to update', 400);
    await query(`UPDATE client_cert_templates SET ${sets.join(',')} WHERE id=? AND org_id=?`, [...p, tpl.id, o]);
    return success(res, {}, 'Template saved');
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * A loose image to place on the canvas — a second logo, an accreditation mark, a
 * scanned signature for a one-off signer.
 *
 * No database row on purpose. A template is an ASSET an organisation manages
 * (named, listed, archived); this is a pixel someone dropped into one design. Its
 * only reference is the `src` inside that layout, and the layout is a permanent
 * snapshot — so the file must simply keep existing, which a row would not change.
 * The path shape is the same opaque one certAssetPath() will accept back.
 */
router.post('/assets', requireAdmin, withUpload(assetUpload.single('file')), async (req, res) => {
  try {
    if (!req.file) return error(res, `Choose an image to upload — ${ACCEPTED_LABEL}, up to ${MAX_UPLOAD_MB} MB.`, 400);
    const p = rel(req.file.path);
    await audit(req, 'CERT_ASSET_UPLOAD', 'client_cert_templates', null, { new_data: { path: p } }).catch(() => {});
    return success(res, { path: p }, 'Image uploaded', 201);
  } catch (e) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return error(res, e.message, 500);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DESIGNS — a whole finished certificate, saved so the next thirty are quick
//
// A design is artwork/theme + layout + wording + signatories + logo, under a
// name. Issuing certificates to a batch of interns is that one design repeated
// with a different name and dates, so the design is what gets reused.
//
// Nothing here can reach back into an issued certificate: reserve() snapshots
// the layout, the wording and the signatories onto the certificate row, so
// editing or archiving a design changes nothing that has already been handed out.
// ════════════════════════════════════════════════════════════════════════════
const DESIGN_COLS = `id, name, template_id, theme_key, orientation, width_px, height_px,
                     layout_json, body_text, type_id, signatory_ids_json, show_logo, updated_at`;

/** The fields a design carries, validated. Returns [sets, params] for INSERT/UPDATE. */
async function designFields(orgId, b) {
  const out = {};
  if (b.name !== undefined) out.name = str(b.name, 120);
  if (b.orientation !== undefined) out.orientation = validOrientation(b.orientation);
  if (b.show_logo !== undefined) out.show_logo = b.show_logo ? 1 : 0;
  if (b.body_text !== undefined) out.body_text = str(b.body_text, 4000);
  if (b.layout_json !== undefined) out.layout_json = JSON.stringify(sanitiseLayout(b.layout_json));
  if (b.width_px !== undefined) out.width_px = Math.min(12000, Math.max(200, Math.round(Number(b.width_px)) || 3508));
  if (b.height_px !== undefined) out.height_px = Math.min(12000, Math.max(200, Math.round(Number(b.height_px)) || 2480));

  // Every id is checked against THIS org before it is stored. A design is later
  // loaded and applied wholesale, so an unchecked template_id here would be a
  // cross-tenant read waiting to happen (§17).
  if (b.template_id !== undefined) {
    const id = Number(b.template_id) || null;
    if (id) {
      const t = await queryOne('SELECT id FROM client_cert_templates WHERE id=? AND org_id=?', [id, orgId]);
      if (!t) throw new Error('That artwork does not belong to your organisation');
    }
    out.template_id = id;
  }
  if (b.theme_key !== undefined) out.theme_key = validTheme(b.theme_key);
  if (b.type_id !== undefined) {
    const id = Number(b.type_id) || null;
    if (id) {
      const t = await queryOne('SELECT id FROM client_cert_types WHERE id=? AND org_id=?', [id, orgId]);
      if (!t) throw new Error('That certificate type does not belong to your organisation');
    }
    out.type_id = id;
  }
  if (b.signatory_ids !== undefined) {
    const ids = (Array.isArray(b.signatory_ids) ? b.signatory_ids : [])
      .map((x) => Number(x)).filter(Boolean).slice(0, 4);
    if (ids.length) {
      const rows = await query(
        `SELECT id FROM client_cert_signatories WHERE org_id=? AND id IN (${ids.map(() => '?').join(',')})`,
        [orgId, ...ids]);
      if (rows.length !== ids.length) throw new Error('One of those signatories is not from your organisation');
    }
    out.signatory_ids_json = JSON.stringify(ids);
  }
  return out;
}

const designRow = (r) => ({
  ...r,
  layout_json: parseJson(r.layout_json),
  signatory_ids: parseJson(r.signatory_ids_json, []) || [],
  signatory_ids_json: undefined,
});

router.post('/designs', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const b = req.body || {};
    if (!str(b.name, 120)) return error(res, 'Give this design a name', 400);
    const f = await designFields(o, b);
    const cols = Object.keys(f);
    const r = await query(
      `INSERT INTO client_cert_designs (org_id, created_by${cols.length ? `, ${cols.join(',')}` : ''})
       VALUES (?,?${cols.map(() => ',?').join('')})
       ON DUPLICATE KEY UPDATE ${cols.map((c) => `${c}=VALUES(${c})`).join(',')}, is_active=1`,
      [o, req.user.user_id, ...cols.map((c) => f[c])]);
    // Saving under a name that already exists OVERWRITES it — an admin who saves
    // "Intern certificate" twice means "update it", not "fail". insertId is 0 on
    // that path, so read the row back by name rather than trusting it.
    const saved = await queryOne(`SELECT ${DESIGN_COLS} FROM client_cert_designs WHERE org_id=? AND name=?`, [o, f.name]);
    await audit(req, 'CERT_DESIGN_SAVE', 'client_cert_designs', saved?.id || r.insertId, { new_data: { name: f.name } }).catch(() => {});
    return success(res, designRow(saved || {}), 'Design saved', 201);
  } catch (e) { return error(res, e.message, 400); }
});

router.patch('/designs/:id', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const existing = await queryOne('SELECT id FROM client_cert_designs WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!existing) return error(res, 'Design not found', 404);
    const f = await designFields(o, req.body || {});
    const cols = Object.keys(f);
    if (!cols.length) return error(res, 'Nothing to update', 400);
    await query(
      `UPDATE client_cert_designs SET ${cols.map((c) => `${c}=?`).join(',')} WHERE id=? AND org_id=?`,
      [...cols.map((c) => f[c]), existing.id, o]);
    await audit(req, 'CERT_DESIGN_UPDATE', 'client_cert_designs', existing.id).catch(() => {});
    const saved = await queryOne(`SELECT ${DESIGN_COLS} FROM client_cert_designs WHERE id=? AND org_id=?`, [existing.id, o]);
    return success(res, designRow(saved), 'Design updated');
  } catch (e) { return error(res, e.message, 400); }
});

// Archive, not delete — §15, and so the name stays taken rather than silently
// reusable while old audit rows still point at it.
router.delete('/designs/:id', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const r = await query('UPDATE client_cert_designs SET is_active=0 WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!r.affectedRows) return error(res, 'Design not found', 404);
    await audit(req, 'CERT_DESIGN_ARCHIVE', 'client_cert_designs', Number(req.params.id)).catch(() => {});
    return success(res, {}, 'Design removed');
  } catch (e) { return error(res, e.message, 500); }
});

// Deactivate, never delete: certificates issued from this artwork keep pointing
// at it, and their stored template_path must stay resolvable (§15).
router.delete('/templates/:id', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const r = await query('UPDATE client_cert_templates SET is_active=0 WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!r.affectedRows) return error(res, 'Template not found', 404);
    await audit(req, 'CERT_TEMPLATE_ARCHIVE', 'client_cert_templates', req.params.id).catch(() => {});
    return success(res, {}, 'Template archived');
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// SIGNATORIES — a scanned signature is an asset, not part of the artwork
// ════════════════════════════════════════════════════════════════════════════
router.post('/signatories', requireAdmin, withUpload(signatureUpload.single('file')), async (req, res) => {
  try {
    const o = req.user.org_id;
    const b = req.body || {};
    const name = str(b.name, 120);
    if (!name) { if (req.file) fs.unlink(req.file.path, () => {}); return error(res, 'Name is required', 400); }
    const r = await query(
      'INSERT INTO client_cert_signatories (org_id, name, designation, signature_path) VALUES (?,?,?,?)',
      [o, name, str(b.designation, 120), req.file ? rel(req.file.path) : null]);
    return success(res, { id: r.insertId, signature_path: req.file ? rel(req.file.path) : null }, 'Signatory added', 201);
  } catch (e) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return error(res, e.message, 500);
  }
});

router.delete('/signatories/:id', requireAdmin, async (req, res) => {
  try {
    const r = await query('UPDATE client_cert_signatories SET is_active=0 WHERE id=? AND org_id=?',
      [req.params.id, req.user.org_id]);
    if (!r.affectedRows) return error(res, 'Signatory not found', 404);
    return success(res, {}, 'Signatory removed');
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// RESERVE — claim the ID + check code, mint the QR
//
// Split from generate on purpose: the QR must be positioned in the editor, and
// the only honest way to do that is to position the REAL one. Reserving first
// means what the admin drags is the code that prints.
// ════════════════════════════════════════════════════════════════════════════
router.post('/reserve', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const b = req.body || {};
    /*
     * A DRAFT MAY NOT HAVE A RECIPIENT YET, and that is the normal case.
     *
     * The editor reserves the moment it opens, because the QR has to be the REAL
     * one while it is being positioned — it is a fixed square that must clear the
     * border and the seal, and a dashed placeholder is not something you can
     * place against. At that moment nobody has typed a name.
     *
     * Requiring one here is what left the canvas with an empty QR box, reported
     * twice. The name is required to ISSUE, which is where the check belongs and
     * where it now lives (see /:id/generate).
     *
     * 🔴 EMPTY STRING, NOT NULL. `recipient_name` is VARCHAR(160) NOT NULL, so
     * dropping the check and letting str() return null made every reservation
     * die on the INSERT — which is worse than the bug it was fixing: the QR went
     * from "late" to "impossible". '' satisfies the column and is still falsy,
     * so the guard in generate() below still refuses to issue a nameless
     * certificate. Do not "tidy" this to null.
     */
    const recipient = str(b.recipient_name, 160) || '';

    const settings = await ensureSettings(o);
    await ensureTypes(o);
    const type = b.type_id
      ? await queryOne('SELECT * FROM client_cert_types WHERE id=? AND org_id=? AND is_active=1', [b.type_id, o])
      : null;
    if (b.type_id && !type) return error(res, 'Certificate type not found', 404);

    const template = b.template_id
      ? await queryOne('SELECT * FROM client_cert_templates WHERE id=? AND org_id=?', [b.template_id, o])
      : null;
    if (b.template_id && !template) return error(res, 'Template not found', 404);

    const org = await queryOne('SELECT name FROM client_organizations WHERE id=?', [o]);
    const issue = dateOrNull(b.issue_date) || istToday();
    const start = dateOrNull(b.start_date);
    const end = dateOrNull(b.end_date);
    if (start && end && end < start) return error(res, 'The end date cannot fall before the start date', 400);

    // Expiry: explicit value wins; otherwise the type's default validity applies.
    let expires = dateOrNull(b.expires_on);
    if (!expires && b.expires_on !== null && type?.default_validity_months) {
      const d = new Date(`${issue}T00:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + Number(type.default_validity_months));
      expires = d.toISOString().slice(0, 10);
    }
    if (expires && expires < issue) return error(res, 'The expiry date cannot fall before the issue date', 400);

    /*
     * Design source: uploaded artwork OR a built-in theme, never both. Whichever
     * it is gets snapshotted on the row, because the certificate is immutable and
     * has to re-render identically in five years.
     */
    const theme = template ? null : (validTheme(b.theme_key) || validTheme(type?.default_theme_key)
      || validTheme(settings.default_theme_key) || 'royal-navy');
    const orientation = template
      ? (template.orientation || 'landscape')
      : validOrientation(b.orientation || settings.default_orientation);

    // Signature list AS PRINTED. Snapshotted for the same reason as the layout:
    // removing a signatory from the org list later must not change a certificate
    // already issued.
    const signatoryIds = b.signatory_ids != null ? b.signatory_ids : b.signatory_id;
    const signatories = await loadSignatories(o, signatoryIds);
    const signatory = signatories[0] || null;
    const showLogo = b.show_logo === undefined ? true : !!b.show_logo;
    const logoPath = showLogo ? await orgLogo(o) : null;

    const year = Number(issue.slice(0, 4));
    const useTypePrefix = !!settings.use_type_prefix && !!type?.code;
    const scope = useTypePrefix ? `${type.code}:${year}` : String(year);

    // One transaction: claim the sequence and write the draft together. If the
    // insert fails the number is released with it, so the series stays gapless.
    const created = await transaction(async (conn) => {
      const exec = (sql, p = []) => conn.execute(sql, p).then(([r]) => r);
      const seq = await nextSequence(exec, o, scope);
      const certificateId = formatId(effectivePattern(settings.id_pattern, useTypePrefix), {
        prefix: settings.id_prefix,
        typeCode: useTypePrefix ? type.code : '',
        seq,
        date: new Date(`${issue}T00:00:00Z`),
      });
      const checkCode = makeCheckCode();
      const verifyUrl = `${appBase()}/verify/${encodeURIComponent(certificateId)}?c=${checkCode}`;
      const layout = b.layout_json
        ? sanitiseLayout(b.layout_json)
        : (template
          ? (parseJson(template.layout_json, null) || defaultLayout(template.width_px, template.height_px))
          // A theme's layout depends on the orientation AND the number of
          // signatories — a row laid out for one leaves three overlapping.
          : themeLayout(theme, orientation, signatories.length || 1));

      const body = str(b.body_text, 4000) ?? type?.default_body ?? null;
      const ins = await exec(
        `INSERT INTO client_cert_issued
          (org_id, certificate_id, check_code, type_id, type_name, template_id, template_path,
           theme_key, orientation,
           recipient_name, recipient_email, recipient_phone, department, title, performance, duration_text,
           start_date, end_date, issue_date, expires_on, organisation_name,
           signatory_name, signatory_role, signatory_id, signatories_json, show_logo, logo_path,
           body_text, layout_json, verification_url, status, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',?)`,
        [o, certificateId, checkCode, type?.id || null, type?.name || str(b.type_name, 80) || 'Certificate',
          template?.id || null, template?.file_path || null,
          theme, orientation,
          recipient, str(b.recipient_email, 190), str(b.recipient_phone, 24),
          str(b.department, 160), str(b.title, 160), str(b.performance, 60),
          str(b.duration_text, 60) || durationText(start, end),
          start, end, issue, expires, org?.name || null,
          signatory?.name || str(b.signatory_name, 120), signatory?.designation || str(b.signatory_role, 120),
          signatory?.id || null,
          JSON.stringify(signatories.map((x) => ({ name: x.name, designation: x.designation, signature_path: x.signature_path }))),
          showLogo ? 1 : 0, logoPath,
          body, JSON.stringify(layout), verifyUrl, req.user.user_id]);

      return { id: ins.insertId, certificateId, checkCode, verifyUrl, layout, template, signatory, theme, orientation };
    });

    // QR encodes ID *and* check code — the whole point of the check code is that
    // it travels only in the QR, never in a guessable public identifier.
    const qrAbs = path.join(DIRS.qr, opaqueName('.png'));
    await QRCode.toFile(qrAbs, created.verifyUrl, {
      margin: 1, width: 900, errorCorrectionLevel: 'M',
      color: { dark: '#16233F', light: '#FFFFFF' },
    });
    const qrPath = rel(qrAbs);
    await query('UPDATE client_cert_issued SET qr_path=? WHERE id=? AND org_id=?', [qrPath, created.id, o]);

    const qrDataUri = `data:image/png;base64,${fs.readFileSync(qrAbs).toString('base64')}`;
    return success(res, {
      id: created.id,
      certificate_id: created.certificateId,
      verification_url: created.verifyUrl,
      qr_path: qrPath,
      qr_data_uri: qrDataUri,
      layout_json: created.layout,
      theme_key: created.theme,
      orientation: created.orientation,
      template: created.template ? {
        id: created.template.id, file_path: created.template.file_path,
        width_px: created.template.width_px, height_px: created.template.height_px,
      } : { id: null, file_path: null, ...A4[created.orientation] && { width_px: A4[created.orientation].w, height_px: A4[created.orientation].h } },
      signatories: signatories.map((x) => ({ name: x.name, designation: x.designation, signature_path: x.signature_path })),
      logo_path: logoPath,
      signature_path: created.signatory?.signature_path || null,
      expires_on: expires,
      duration_text: str(b.duration_text, 60) || durationText(start, end),
    }, 'Certificate reserved', 201);
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * ── BRING A DRAFT UP TO DATE ──────────────────────────────────────────────
 *
 * The number and the QR are claimed the moment the editor opens, because the
 * admin has to be able to POSITION THE REAL QR — a placeholder box is not
 * something you can trust the print against. Every other detail is then typed
 * on the canvas AFTER that reservation, so the row is always older than the
 * screen until this runs.
 *
 * Without it, the printed certificate carried whatever was true at the instant
 * the name was first typed: no department, no dates, no wording. The renderer
 * reads the ROW, deliberately (so the record and the print cannot disagree),
 * which makes updating the row the only correct place to fix it.
 *
 * `status='draft'` is in the UPDATE itself, not only in the caller's check:
 * nothing that has been issued can ever be rewritten (§12), whichever route
 * gets here.
 *
 * Shared by /:id/generate (issue it) and PATCH /:id/draft (save and come back
 * later). One copy on purpose — two would drift, and the difference between
 * what Save wrote and what Generate wrote would be invisible until a printed
 * certificate disagreed with its own record.
 *
 * @returns {Promise<{cert?: object, error?: [string, number]}>}
 */
async function applyDraftEdits(cert, b, o) {
  const has = (k) => Object.prototype.hasOwnProperty.call(b, k);
  const sets = [];
  const p = [];
  const put = (col, val) => { sets.push(`${col}=?`); p.push(val); };

  // '' not null — the column is NOT NULL. See the note in /reserve.
  if (has('recipient_name')) put('recipient_name', str(b.recipient_name, 160) || '');
  if (has('recipient_email')) put('recipient_email', str(b.recipient_email, 190));
  if (has('recipient_phone')) put('recipient_phone', str(b.recipient_phone, 24));
  if (has('department')) put('department', str(b.department, 160));
  if (has('title')) put('title', str(b.title, 160));
  if (has('performance')) put('performance', str(b.performance, 60));
  if (has('body_text')) put('body_text', str(b.body_text, 4000));
  // The layout is part of the draft, not only part of the render: Save has to
  // keep where things were dragged, or reopening resets the sheet.
  if (has('layout_json') && b.layout_json) put('layout_json', JSON.stringify(sanitiseLayout(b.layout_json)));

  const start = has('start_date') ? dateOrNull(b.start_date) : (cert.start_date ? String(cert.start_date).slice(0, 10) : null);
  const end = has('end_date') ? dateOrNull(b.end_date) : (cert.end_date ? String(cert.end_date).slice(0, 10) : null);
  if (start && end && end < start) return { error: ['The end date cannot fall before the start date', 400] };
  if (has('start_date')) put('start_date', start);
  if (has('end_date')) put('end_date', end);
  // Recomputed rather than trusted: the phrase the certificate prints must
  // follow the dates it prints beside it.
  if (has('start_date') || has('end_date')) put('duration_text', str(b.duration_text, 60) || durationText(start, end));

  const issue = has('issue_date') ? (dateOrNull(b.issue_date) || istToday()) : String(cert.issue_date).slice(0, 10);
  if (has('issue_date')) put('issue_date', issue);
  if (has('expires_on')) {
    const exp = dateOrNull(b.expires_on);
    if (exp && exp < issue) return { error: ['The expiry date cannot fall before the issue date', 400] };
    put('expires_on', exp);
  }

  if (has('type_id')) {
    const t = b.type_id
      ? await queryOne('SELECT * FROM client_cert_types WHERE id=? AND org_id=? AND is_active=1', [b.type_id, o])
      : null;
    if (b.type_id && !t) return { error: ['Certificate type not found', 404] };
    put('type_id', t?.id || null);
    put('type_name', t?.name || str(b.type_name, 80) || 'Certificate');
  }

  if (has('signatory_ids') || has('signatory_id')) {
    const list = await loadSignatories(o, has('signatory_ids') ? b.signatory_ids : b.signatory_id);
    put('signatories_json', JSON.stringify(list.map((x) => ({
      name: x.name, designation: x.designation, signature_path: x.signature_path,
    }))));
    put('signatory_id', list[0]?.id || null);
    put('signatory_name', list[0]?.name || null);
    put('signatory_role', list[0]?.designation || null);
  }

  if (has('show_logo')) {
    const show = !!b.show_logo;
    put('show_logo', show ? 1 : 0);
    put('logo_path', show ? await orgLogo(o) : null);
  }

  /*
   * WHAT IT IS DRAWN ON can change after the number is claimed too: the admin
   * goes back to the gallery and picks a different design. The certificate
   * NUMBER is unaffected — it belongs to the record, not to the artwork — so
   * the reservation stands and only the sheet changes here.
   *
   * Without this the row kept whichever theme was current when the name was
   * first typed, and the printed certificate came out in a design nobody had
   * chosen: green Emerald on screen, navy Royal on paper.
   */
  if (has('template_id') || has('theme_key') || has('orientation')) {
    const tpl = b.template_id
      ? await queryOne('SELECT * FROM client_cert_templates WHERE id=? AND org_id=?', [b.template_id, o])
      : null;
    if (b.template_id && !tpl) return { error: ['Template not found', 404] };
    put('template_id', tpl?.id || null);
    put('template_path', tpl?.file_path || null);
    // Artwork and theme are mutually exclusive — the sheet is one or the other.
    put('theme_key', tpl ? null : (validTheme(b.theme_key) || cert.theme_key || 'royal-navy'));
    put('orientation', tpl
      ? (tpl.orientation || 'landscape')
      : validOrientation(b.orientation || cert.orientation));
  }

  if (!sets.length) return { cert };
  p.push(cert.id, o);
  await query(`UPDATE client_cert_issued SET ${sets.join(', ')} WHERE id=? AND org_id=? AND status='draft'`, p);
  // Re-read, because everything downstream renders FROM the row.
  return { cert: await queryOne('SELECT * FROM client_cert_issued WHERE id=? AND org_id=?', [cert.id, o]) };
}

/*
 * SAVE THE DRAFT AND COME BACK LATER.
 *
 * Generating is a commitment — it burns the number into a rendered PNG and PDF
 * and puts the QR into the world. Setting a certificate up is not, and until
 * now the only way to keep the work was to finish it: leave the editor and
 * everything typed since the number was claimed was gone.
 *
 * DRAFTS ONLY, and the 409 says so. An issued certificate is permanent (§12) —
 * this is the same rule the UPDATE above enforces in SQL, stated here so the
 * admin gets a sentence rather than a silent no-op.
 */
router.patch('/:id/draft', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const cert = await queryOne('SELECT * FROM client_cert_issued WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!cert) return error(res, 'Certificate not found', 404);
    if (cert.status !== 'draft') {
      return error(res, 'This certificate has already been issued, and an issued certificate cannot be changed.', 409);
    }
    if (cert.deleted_at) return error(res, 'This draft is in the recycle bin — restore it before editing.', 409);

    const r = await applyDraftEdits(cert, req.body || {}, o);
    if (r.error) return error(res, r.error[0], r.error[1]);
    return success(res, {
      id: r.cert.id,
      certificate_id: r.cert.certificate_id,
      updated_at: r.cert.updated_at || null,
    }, 'Draft saved');
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// GENERATE — render PNG + PDF on the server, then mark the record issued
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/generate', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    let cert = await queryOne('SELECT * FROM client_cert_issued WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!cert) return error(res, 'Certificate not found', 404);
    if (cert.status === 'revoked') return error(res, 'This certificate has been revoked and cannot be regenerated', 409);

    // Bring the row up to date before rendering — see applyDraftEdits.
    if (cert.status === 'draft' && req.body && typeof req.body === 'object') {
      const r = await applyDraftEdits(cert, req.body, o);
      if (r.error) return error(res, r.error[0], r.error[1]);
      cert = r.cert;
    }

    /*
     * THE NAME IS REQUIRED TO ISSUE, not to reserve. A draft is allowed to be
     * incomplete — that is what makes it a draft, and it is why the QR can exist
     * before anybody has typed anything. A certificate without a recipient is
     * not a certificate, so this is the line it cannot cross.
     */
    if (!cert.recipient_name) {
      return error(res, 'Enter the recipient’s name before generating the certificate', 400);
    }

    const layout = req.body?.layout_json ? sanitiseLayout(req.body.layout_json) : parseJson(cert.layout_json, defaultLayout());
    const template = cert.template_id
      ? await queryOne('SELECT * FROM client_cert_templates WHERE id=? AND org_id=?', [cert.template_id, o])
      : null;
    /*
     * Everything the render needs comes from the ROW, not from live joins: the
     * signature list, the logo and the theme were snapshotted at reserve time so
     * a certificate re-renders exactly as it was printed, however the
     * organisation's lists change afterwards.
     */
    const snapshot = parseJson(cert.signatories_json, null);
    const signatories = Array.isArray(snapshot) && snapshot.length
      ? snapshot
      : (cert.signatory_name ? [{ name: cert.signatory_name, designation: cert.signatory_role, signature_path: null }] : []);

    const orientation = cert.orientation === 'portrait' ? 'portrait' : 'landscape';
    const W = Number(template?.width_px) || A4[orientation].w;
    const H = Number(template?.height_px) || A4[orientation].h;

    // Substitution happens here, from the stored row — the printed wording and
    // the database record are the same text by construction.
    const vars = buildVars(cert);
    const renderedBody = substituteBody(cert.body_text || '', vars);
    // `{{body}}` in a layout resolves to the (already substituted) wording.
    const layoutForRender = {
      ...layout,
      elements: layout.elements.map((el) => (el.type === 'text' && /\{\{\s*body\s*\}\}/.test(el.text || '')
        ? { ...el, text: (el.text || '').replace(/\{\{\s*body\s*\}\}/g, renderedBody) }
        : el)),
    };

    const qrDataUri = cert.qr_path
      ? `data:image/png;base64,${fs.readFileSync(path.join(UPLOAD_ROOT, cert.qr_path.replace(/^\/?uploads\//, ''))).toString('base64')}`
      : null;
    const assets = {
      qrDataUri,
      logoDataUri: cert.show_logo && cert.logo_path ? inlineUpload(cert.logo_path) : null,
      signatories: signatories.map((x) => ({
        name: x.name, designation: x.designation,
        dataUri: x.signature_path ? inlineUpload(x.signature_path) : null,
      })),
      // Kept for layouts authored before signatory blocks existed.
      signatureDataUri: signatories[0]?.signature_path ? inlineUpload(signatories[0].signature_path) : null,
    };

    // Two renders of the SAME layout: the screenshot is sized in pixels (so a
    // 3508×2480 master really is 300 DPI) and the PDF in millimetres (so it is
    // one true A4 page). Same fractions, different unit — see certRender.js.
    const sheet = { ...cert, width_px: W, height_px: H, template_path: template?.file_path || cert.template_path };
    const htmlPng = buildHtml(sheet, layoutForRender, assets, 'png');
    const htmlPdf = buildHtml(sheet, layoutForRender, assets, 'pdf');

    let pngBuf; let pdfBuf;
    try {
      pngBuf = await renderPng(htmlPng, W, H);
      pdfBuf = await renderPdf(htmlPdf, W >= H);
    } catch (renderErr) {
      // Chrome missing or crashed. Say so plainly — a half-generated certificate
      // reported as success is the worst possible outcome here.
      logger.error(`certificate render failed (${cert.certificate_id}): ${renderErr.message}`);
      return error(res, 'The certificate could not be rendered. The document engine is unavailable — please try again shortly.', 503);
    }

    // Opaque on disk (/uploads is world-readable); the friendly name is applied
    // by the download route via Content-Disposition.
    const pngAbs = path.join(DIRS.out, opaqueName('.png'));
    const pdfAbs = path.join(DIRS.out, opaqueName('.pdf'));
    fs.writeFileSync(pngAbs, pngBuf);
    fs.writeFileSync(pdfAbs, pdfBuf);

    await query(
      `UPDATE client_cert_issued
          SET generated_png=?, generated_pdf=?, layout_json=?, rendered_text=?, status='issued'
        WHERE id=? AND org_id=?`,
      [rel(pngAbs), rel(pdfAbs), JSON.stringify(layout), renderedBody.slice(0, 60000), cert.id, o]);

    await audit(req, 'CERTIFICATE_ISSUE', 'client_cert_issued', cert.id,
      { new_data: { certificate_id: cert.certificate_id, recipient: cert.recipient_name } }).catch(() => {});

    return success(res, {
      id: cert.id,
      certificate_id: cert.certificate_id,
      png_url: `/api/cert-mgmt/${cert.id}/file/png`,
      pdf_url: `/api/cert-mgmt/${cert.id}/file/pdf`,
      verification_url: cert.verification_url,
    }, 'Certificate generated');
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * PREVIEW — a real server render, not an approximation.
 *
 * The editor's own canvas is a faithful CSS mirror (certLayout.ts), but "faithful
 * mirror" is a claim, and the person about to issue a permanent document deserves
 * to see the actual output first. This runs the SAME renderer that generate() runs
 * and returns the PNG inline. Nothing is stored, no number is consumed, no record
 * is created — an admin can preview twenty times and issue nothing.
 */
router.post('/preview', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const b = req.body || {};
    const settings = await ensureSettings(o);

    const template = b.template_id
      ? await queryOne('SELECT * FROM client_cert_templates WHERE id=? AND org_id=?', [b.template_id, o])
      : null;
    const theme = template ? null : (validTheme(b.theme_key) || validTheme(settings.default_theme_key) || 'royal-navy');
    const orientation = template
      ? (template.orientation || 'landscape')
      : validOrientation(b.orientation || settings.default_orientation);

    const W = Number(template?.width_px) || A4[orientation].w;
    const H = Number(template?.height_px) || A4[orientation].h;

    const signatories = await loadSignatories(o, b.signatory_ids != null ? b.signatory_ids : b.signatory_id);
    const showLogo = b.show_logo === undefined ? true : !!b.show_logo;
    const org = await queryOne('SELECT name, logo_url FROM client_organizations WHERE id=?', [o]);

    const draft = {
      ...b,
      width_px: W, height_px: H,
      template_path: template?.file_path || null,
      theme_key: theme,
      orientation,
      // A placeholder ID, clearly marked. Consuming a real number to look at a
      // preview would burn certificate numbers on drafts that never ship.
      certificate_id: str(b.certificate_id, 48) || 'PREVIEW-000000',
      organisation_name: b.organisation_name || org?.name || null,
      type_name: str(b.type_name, 80) || 'Certificate',
      duration_text: str(b.duration_text, 60) || durationText(dateOrNull(b.start_date), dateOrNull(b.end_date)),
    };

    const layout = b.layout_json
      ? sanitiseLayout(b.layout_json)
      : (template ? (parseJson(template.layout_json, null) || defaultLayout(template.width_px, template.height_px))
        : themeLayout(theme, orientation, signatories.length || 1));

    const vars = buildVars(draft);
    const renderedBody = substituteBody(b.body_text || '', vars);
    const layoutForRender = {
      ...layout,
      elements: layout.elements.map((el) => (el.type === 'text' && /\{\{\s*body\s*\}\}/.test(el.text || '')
        ? { ...el, text: (el.text || '').replace(/\{\{\s*body\s*\}\}/g, renderedBody) } : el)),
    };

    const assets = {
      qrDataUri: typeof b.qr_data_uri === 'string' && b.qr_data_uri.startsWith('data:image/') ? b.qr_data_uri : null,
      logoDataUri: showLogo && org?.logo_url ? inlineUpload(org.logo_url) : null,
      signatories: signatories.map((x) => ({
        name: x.name, designation: x.designation,
        dataUri: x.signature_path ? inlineUpload(x.signature_path) : null,
      })),
    };

    const html = buildHtml(draft, layoutForRender, assets, 'png');
    let buf;
    try {
      // A third of print size: identical layout, a ninth of the pixels, and fast
      // enough that previewing does not feel like a commitment.
      buf = await renderPng(html, W, H, 1 / 3);
    } catch (renderErr) {
      logger.error(`certificate preview failed: ${renderErr.message}`);
      return error(res, 'Preview is unavailable — the document engine is not responding.', 503);
    }
    return success(res, { image: `data:image/png;base64,${buf.toString('base64')}`, orientation, theme_key: theme });
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// LIST · EXPORT · READ  (specific paths BEFORE /:id, or "export.csv" becomes an id)
// ════════════════════════════════════════════════════════════════════════════
function listWhere(req) {
  const where = ['c.org_id=?'];
  const p = [req.user.org_id];
  const q = req.query || {};
  // Soft-deleted drafts are hidden everywhere EXCEPT the explicit "trashed" view,
  // so the main list and every stat count exclude them by default.
  if (q.status === 'trashed') where.push('c.deleted_at IS NOT NULL');
  else where.push('c.deleted_at IS NULL');
  if (q.type_id) { where.push('c.type_id=?'); p.push(q.type_id); }
  if (q.search) {
    where.push('(c.recipient_name LIKE ? OR c.certificate_id LIKE ? OR c.department LIKE ?)');
    const s = `%${String(q.search).slice(0, 80)}%`;
    p.push(s, s, s);
  }
  if (q.from) { where.push('c.issue_date>=?'); p.push(dateOrNull(q.from) || '1970-01-01'); }
  if (q.to) { where.push('c.issue_date<=?'); p.push(dateOrNull(q.to) || '2999-12-31'); }
  if (q.delivery) { where.push('c.delivery_state=?'); p.push(['none', 'sent', 'failed'].includes(q.delivery) ? q.delivery : 'none'); }
  // Status filters translate the DERIVED view back into SQL, so the filter and
  // the badge shown in the table can never disagree.
  const today = istToday();
  if (q.status === 'valid') { where.push("c.status='issued' AND (c.expires_on IS NULL OR c.expires_on>=?)"); p.push(today); }
  else if (q.status === 'expired') { where.push("c.status='issued' AND c.expires_on IS NOT NULL AND c.expires_on<?"); p.push(today); }
  else if (q.status === 'revoked') { where.push("c.status='revoked'"); }
  else if (q.status === 'draft') { where.push("c.status='draft'"); }
  else if (q.status === 'expiring') {
    const in30 = new Date(Date.now() + 30 * 86400e3 + 5.5 * 3600e3).toISOString().slice(0, 10);
    where.push("c.status='issued' AND c.expires_on IS NOT NULL AND c.expires_on>=? AND c.expires_on<=?");
    p.push(today, in30);
  }
  return { where: where.join(' AND '), params: p };
}

const LIST_COLS = `c.id, c.certificate_id, c.recipient_name, c.recipient_email, c.recipient_phone, c.deleted_at,
  c.department, c.title, c.type_name, c.issue_date, c.expires_on, c.status, c.delivery_state,
  c.verify_count, c.last_verified_at, c.verification_url, c.generated_pdf, c.generated_png`;

router.get('/', requireStaff, async (req, res) => {
  try {
    const { where, params } = listWhere(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const [{ total }] = await query(`SELECT COUNT(*) AS total FROM client_cert_issued c WHERE ${where}`, params);
    const rows = await query(
      `SELECT ${LIST_COLS} FROM client_cert_issued c WHERE ${where}
        ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]);
    const today = istToday();
    const stats = await queryOne(
      `SELECT
         SUM(status='issued') AS issued,
         SUM(status='issued' AND delivery_state='sent') AS delivered,
         SUM(status='issued' AND expires_on IS NOT NULL AND expires_on>=? AND expires_on<=?) AS expiring,
         COALESCE(SUM(verify_count),0) AS scans
       FROM client_cert_issued WHERE org_id=?`,
      [today, new Date(Date.now() + 30 * 86400e3 + 5.5 * 3600e3).toISOString().slice(0, 10), req.user.org_id]);
    return success(res, {
      certificates: rows.map((r) => ({ ...r, validity: validityOf(r, today) })),
      stats: {
        issued: Number(stats?.issued || 0),
        delivered: Number(stats?.delivered || 0),
        expiring: Number(stats?.expiring || 0),
        scans: Number(stats?.scans || 0),
      },
      pagination: { total: Number(total), page, limit, pages: Math.ceil(Number(total) / limit) || 1 },
    });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/export.csv', requireStaff, async (req, res) => {
  try {
    const { where, params } = listWhere(req);
    const rows = await query(
      `SELECT ${LIST_COLS} FROM client_cert_issued c WHERE ${where} ORDER BY c.created_at DESC LIMIT 5000`, params);
    const today = istToday();
    const head = ['Certificate ID', 'Recipient', 'Department', 'Title', 'Type', 'Issued On', 'Valid until', 'Status', 'Delivery', 'Verifications', 'Verification URL'];
    // Prefix cells that begin with a formula character — a spreadsheet would
    // otherwise execute a name like "=cmd|…" on open (CSV injection).
    const cell = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [head.map(cell).join(','), ...rows.map((r) => [
      r.certificate_id, r.recipient_name, r.department, r.title, r.type_name,
      fmtDate(r.issue_date), r.expires_on ? fmtDate(r.expires_on) : 'No expiry',
      validityOf(r, today), r.delivery_state, r.verify_count, r.verification_url,
    ].map(cell).join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="certificates-${today}.csv"`);
    return res.send('﻿' + csv);   // BOM so Excel reads UTF-8 names correctly
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/:id', requireStaff, async (req, res) => {
  try {
    const o = req.user.org_id;
    const cert = await queryOne('SELECT * FROM client_cert_issued WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!cert) return error(res, 'Certificate not found', 404);
    const deliveries = await query(
      'SELECT channel, destination, status, error_text, created_at FROM client_cert_deliveries WHERE cert_id=? AND org_id=? ORDER BY created_at DESC LIMIT 20',
      [cert.id, o]);
    /*
     * A DRAFT COMES BACK WITH ITS REAL QR, because a draft is reopened to be
     * finished — and the editor's entire claim is that the code being positioned
     * is the code that prints. Sending only `qr_path` would put the admin back
     * in front of a placeholder box on a certificate whose number was claimed
     * days ago. Drafts only: an issued certificate is not editable, so nothing
     * downstream needs it and the payload stays small.
     */
    const qrDataUri = cert.status === 'draft' ? inlineUpload(cert.qr_path) : null;
    return success(res, {
      certificate: {
        ...cert,
        check_code: undefined,
        layout_json: parseJson(cert.layout_json),
        // Parsed here rather than left as text: the only caller that wants it is
        // the draft editor, and a JSON column arrives as a string on MariaDB.
        signatories_json: parseJson(cert.signatories_json, []) || [],
        qr_data_uri: qrDataUri,
        validity: validityOf(cert),
      },
      deliveries,
    });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Download. Files live under opaque names, so this route is the ONLY way to
 * reach one by certificate — which means the org check actually holds. It also
 * restores the friendly filename the recipient expects.
 */
router.get('/:id/file/:kind', requireStaff, async (req, res) => {
  try {
    const cert = await queryOne(
      'SELECT certificate_id, recipient_name, generated_png, generated_pdf FROM client_cert_issued WHERE id=? AND org_id=?',
      [req.params.id, req.user.org_id]);
    if (!cert) return error(res, 'Certificate not found', 404);
    const stored = req.params.kind === 'pdf' ? cert.generated_pdf : cert.generated_png;
    if (!stored) return error(res, 'This certificate has not been generated yet', 404);
    const abs = path.resolve(UPLOAD_ROOT, stored.replace(/^\/?uploads\//, ''));
    if (!abs.startsWith(path.resolve(UPLOAD_ROOT) + path.sep) || !fs.existsSync(abs)) {
      return error(res, 'The generated file is missing — regenerate the certificate', 404);
    }
    const safe = `Certificate_${String(cert.recipient_name).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}.${req.params.kind}`;
    res.setHeader('Content-Type', req.params.kind === 'pdf' ? 'application/pdf' : 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
    return fs.createReadStream(abs).pipe(res);
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// DELIVER — email / WhatsApp. Every attempt is recorded, failures included.
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/deliver', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const channel = ['email', 'whatsapp'].includes(req.body?.channel) ? req.body.channel : null;
    if (!channel) return error(res, 'Choose a delivery channel — email or WhatsApp', 400);

    const cert = await queryOne('SELECT * FROM client_cert_issued WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!cert) return error(res, 'Certificate not found', 404);
    if (cert.status !== 'issued') return error(res, 'Generate the certificate before sending it', 400);

    const to = channel === 'email'
      ? (str(req.body.to, 190) || cert.recipient_email)
      : (str(req.body.to, 24) || cert.recipient_phone);
    if (!to) {
      return error(res, channel === 'email'
        ? 'No email address on this certificate — add one first'
        : 'No mobile number on this certificate — add one first', 400);
    }
    // Validate the address BEFORE attempting to send. Handing "notanemail" to
    // the mail server produced a delivery failure logged as if the send had been
    // attempted, when the request was simply wrong.
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
      return error(res, `"${to}" is not a valid email address.`, 400);
    }
    if (channel === 'whatsapp' && !/^[+]?[\d\s()-]{7,20}$/.test(to)) {
      return error(res, `"${to}" is not a valid mobile number.`, 400);
    }

    const record = async (status, errText) => {
      await query(
        'INSERT INTO client_cert_deliveries (org_id, cert_id, channel, destination, status, error_text, sent_by) VALUES (?,?,?,?,?,?,?)',
        [o, cert.id, channel, to, status, errText ? String(errText).slice(0, 300) : null, req.user.user_id]);
      await query('UPDATE client_cert_issued SET delivery_state=? WHERE id=? AND org_id=?',
        [status === 'sent' ? 'sent' : 'failed', cert.id, o]);
    };

    try {
      if (channel === 'email') {
        const { sendCertificate } = require('../../utils/email');
        if (typeof sendCertificate !== 'function') throw new Error('Email delivery is not configured on this server');
        const pdfAbs = cert.generated_pdf
          ? path.resolve(UPLOAD_ROOT, cert.generated_pdf.replace(/^\/?uploads\//, ''))
          : null;
        const r = await sendCertificate({
          to,
          orgName: cert.organisation_name || 'WisWits',
          recipientName: cert.recipient_name,
          typeName: cert.type_name,
          certificateId: cert.certificate_id,
          verificationUrl: cert.verification_url,
          attachmentPath: pdfAbs && fs.existsSync(pdfAbs) ? pdfAbs : null,
          attachmentName: `Certificate_${String(cert.recipient_name).replace(/[^A-Za-z0-9]+/g, '_')}.pdf`,
        });
        if (!r?.success) throw new Error(r?.error || 'The mail server rejected the message');
      } else {
        const wa = require('../../services/whatsapp');
        const body = `${cert.organisation_name || 'We'} have issued your ${cert.type_name} certificate.\n\n`
          + `Certificate ID: ${cert.certificate_id}\n`
          + `Verify it here: ${cert.verification_url}`;
        const r = await wa.sendText(o, { phone: to, body, recipient_name: cert.recipient_name, sent_by: req.user.user_id });
        if (r && r.success === false) throw new Error(r.error || 'WhatsApp delivery failed');
      }
    } catch (sendErr) {
      await record('failed', sendErr.message);
      /*
       * 422, NOT 5xx.
       *
       * A delivery that the mail or WhatsApp provider refuses is not a server
       * fault, and labelling it one had two costs: nginx has
       * proxy_intercept_errors on, so it replaced the JSON body with its own
       * plain "error code: 502" page and the admin never saw the reason; and a
       * 5xx invites the client to treat a perfectly healthy API as broken.
       * The caller is still told plainly that it did NOT send, and why.
       */
      return error(res, `Could not send: ${sendErr.message}`, 422);
    }

    await record('sent', null);
    await audit(req, 'CERTIFICATE_DELIVER', 'client_cert_issued', cert.id, { new_data: { channel, to } }).catch(() => {});
    return success(res, {}, channel === 'email' ? 'Certificate emailed' : 'Certificate sent on WhatsApp');
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// REVOKE — withdraw, never delete (§12 immutable · §15 mark→migrate→remove)
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/revoke', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const cert = await queryOne('SELECT id, status FROM client_cert_issued WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!cert) return error(res, 'Certificate not found', 404);
    if (cert.status === 'revoked') return success(res, {}, 'This certificate was already revoked');
    await query(
      "UPDATE client_cert_issued SET status='revoked', revoke_reason=?, revoked_by=?, revoked_at=NOW() WHERE id=? AND org_id=?",
      [str(req.body?.reason, 300), req.user.user_id, cert.id, o]);
    await audit(req, 'CERTIFICATE_REVOKE', 'client_cert_issued', cert.id,
      { new_data: { reason: str(req.body?.reason, 300) } }).catch(() => {});
    return success(res, {}, 'Certificate revoked');
  } catch (e) { return error(res, e.message, 500); }
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE / RESTORE — soft-delete, DRAFTS ONLY (issued/revoked revoke, never delete)
//
// The one place in this module where a row can actually leave the database — and
// it is fenced hard. A draft was never issued, never delivered, has no QR in the
// world, so removing it breaks nothing. An issued or revoked certificate is the
// opposite: its QR may be printed and in someone's hands, and hard-deleting it
// would turn a genuine certificate into "No record found". Those revoke.
//
// Delete is SOFT: deleted_at is stamped, the row hides from every list and stat,
// and a 48-hour cron (services/cron/certificateCron) does the actual removal.
// Restore within that window undoes it from the UI — no shell command.
// ════════════════════════════════════════════════════════════════════════════
const { RECOVERY_HOURS } = require('../../services/cron/certificateCron');

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const cert = await queryOne('SELECT id, status, deleted_at FROM client_cert_issued WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!cert) return error(res, 'Certificate not found', 404);
    if (cert.status !== 'draft') {
      // The refusal names the alternative, so the admin is never left stuck.
      return error(res, 'Only drafts can be deleted. This certificate has been issued — revoke it instead, so anyone verifying it is told it was withdrawn.', 400);
    }
    if (cert.deleted_at) return success(res, { recovery_hours: RECOVERY_HOURS }, 'Draft already in the recycle bin');
    await query('UPDATE client_cert_issued SET deleted_at=NOW() WHERE id=? AND org_id=? AND status=\'draft\'', [cert.id, o]);
    await audit(req, 'CERTIFICATE_DRAFT_DELETE', 'client_cert_issued', cert.id).catch(() => {});
    return success(res, { recovery_hours: RECOVERY_HOURS }, `Draft deleted — recoverable for ${RECOVERY_HOURS} hours`);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const o = req.user.org_id;
    const cert = await queryOne('SELECT id, deleted_at FROM client_cert_issued WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!cert) return error(res, 'Certificate not found', 404);
    if (!cert.deleted_at) return success(res, {}, 'This draft is not deleted');
    await query('UPDATE client_cert_issued SET deleted_at=NULL WHERE id=? AND org_id=?', [cert.id, o]);
    await audit(req, 'CERTIFICATE_DRAFT_RESTORE', 'client_cert_issued', cert.id).catch(() => {});
    return success(res, {}, 'Draft restored');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
