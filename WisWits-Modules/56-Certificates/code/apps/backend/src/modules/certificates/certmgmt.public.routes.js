'use strict';
/*
 * PUBLIC certificate verification — the only unauthenticated surface in this module.
 *
 * A recruiter scans the QR on a printed certificate. There is no account, no
 * session and no organisation context: the certificate ID is the whole request.
 * So this router is mounted SEPARATELY from certmgmt.routes.js, which begins with
 * `router.use(authenticate)`. Adding these paths there would have required an
 * exception inside an authenticated router — the kind of exception that quietly
 * stops applying after a later refactor.
 *
 * WHAT IT DELIBERATELY DOES NOT DO:
 *   • Does not serve the PNG or PDF. Verification answers "is this genuine?",
 *     not "give me a copy". Serving files here would let anyone holding an ID
 *     pull the artwork.
 *   • Does not accept an ID alone. IDs are sequential and printed; without the
 *     check code, counting from 000001 would enumerate every recipient's name
 *     and department. A wrong or missing code answers exactly like a missing
 *     record — no oracle for "this ID exists, keep guessing".
 *   • Does not reveal email, phone, internal ids, the revocation reason, or any
 *     field the issuing organisation has switched off in its settings.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');

const path = require('path');

const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { checkCodeMatches } = require('./certIds');
const { fontFaceCss, FONT_DIR } = require('./certFonts');

/*
 * ── Certificate typefaces, for the EDITOR ─────────────────────────────────
 *
 * The render inlines its fonts (certFonts.js); the browser cannot — a data-URI
 * stylesheet of every face would be megabytes on a page that typically uses two.
 * So the editor gets a normal stylesheet of url() references and the browser
 * downloads only the subsets the text actually needs.
 *
 * PUBLIC ON PURPOSE, and mounted here rather than in the admin router:
 *   • These are open-licence font files, not tenant data. There is nothing to
 *     authorise and no org_id to scope by.
 *   • A stylesheet loaded via <link> and the font files it names are fetched by
 *     the browser WITHOUT the Authorization header — a font request cannot carry
 *     one. Behind `authenticate` they would 401, and a 401'd @font-face does not
 *     error: it silently substitutes, which is the one failure this whole font
 *     system exists to prevent.
 */
const FONT_CACHE = 'public, max-age=31536000, immutable';   // content is versioned by filename

router.get('/fonts.css', (req, res) => {
  /*
   * RELATIVE font URLs — `url('fonts/x.woff2')`, resolved against this
   * stylesheet's own address. Never an absolute one built from req.protocol /
   * req.get('host').
   *
   * The app's CSP is `style-src 'self'` and `font-src 'self' data:`. A
   * stylesheet or a font file named on the API's own origin is CROSS-ORIGIN to
   * the app and is blocked outright — the sheet never loads, the faces never
   * arrive, and every certificate quietly draws in a fallback. Relative URLs
   * inherit whichever origin actually served the sheet, so loading it through
   * the app's `/api` proxy keeps both it and its fonts same-origin, and loading
   * it straight from the API host still works unchanged. It also sidesteps
   * req.protocol reporting `http` behind a TLS-terminating proxy, which would
   * have made every font a mixed-content block instead.
   */
  res.type('text/css');
  res.set('Cache-Control', 'public, max-age=86400');   // the list itself can change
  res.set('Access-Control-Allow-Origin', '*');
  res.send(fontFaceCss(null, { inline: false, base: 'fonts' }));
});

router.get('/fonts/:file', (req, res) => {
  const file = path.basename(String(req.params.file || ''));
  // Only ever a woff2 out of the fonts directory — basename() plus this test
  // leaves no way to name a path, an extension or a directory of our choosing.
  if (!/^[a-z0-9-]+\.woff2$/i.test(file)) return res.status(404).end();
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Cache-Control', FONT_CACHE);
  res.type('font/woff2');
  return res.sendFile(path.join(FONT_DIR, file), (err) => {
    if (err && !res.headersSent) res.status(404).end();
  });
});

/*
 * Its own limiter, NOT the platform's general one.
 *
 * The general limiter keys on the authenticated user and falls back to IP —
 * fine for the app, wrong here, where every request is anonymous. More
 * importantly, one organisation's certificates going viral must not consume a
 * shared budget and start 429-ing the login page (see the incident recorded in
 * middleware/rateLimits.js). A generous per-IP ceiling: a careers office
 * checking a stack of CVs stays comfortably under it, an enumeration script
 * does not — and it has to guess a 6-character code per attempt anyway.
 */
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many verification requests. Please wait a moment and try again.' },
});

const istToday = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

router.get('/verify/:certificateId', verifyLimiter, async (req, res) => {
  try {
    const id = String(req.params.certificateId || '').trim().slice(0, 48);
    const code = String(req.query.c || req.query.code || '').trim().slice(0, 12);

    // ONE response shape for every failure. Distinguishing "no such certificate"
    // from "wrong code" would confirm which IDs exist — the exact leak the check
    // code is there to prevent.
    const notFound = () => success(res, { found: false }, 'No certificate matches this reference');

    if (!id || !code) return notFound();

    const cert = await queryOne(
      `SELECT c.id, c.org_id, c.certificate_id, c.check_code, c.type_name, c.recipient_name,
              c.department, c.title, c.duration_text, c.start_date, c.end_date,
              c.issue_date, c.expires_on, c.status, c.organisation_name,
              c.signatory_name, c.signatory_role,
              o.name AS org_name, o.logo_url AS org_logo
         FROM client_cert_issued c
         LEFT JOIN client_organizations o ON o.id = c.org_id
        WHERE c.certificate_id = ? AND c.status <> 'draft'`,
      [id]);

    if (!cert || !checkCodeMatches(code, cert.check_code)) return notFound();

    const today = istToday();
    const expired = cert.expires_on && String(cert.expires_on).slice(0, 10) < today;
    const outcome = cert.status === 'revoked' ? 'revoked' : (expired ? 'expired' : 'valid');

    // Per-org display settings. Absent row → defaults on (ensureSettings has not
    // run for this org yet, which is not the verifier's problem).
    const s = await queryOne(
      'SELECT verify_show_department, verify_show_period, verify_show_signatory, support_email FROM client_cert_settings WHERE org_id=?',
      [cert.org_id]);
    const show = (k) => (s ? !!s[k] : true);

    // Record the scan. Best-effort: a logging failure must never stop a genuine
    // certificate from verifying.
    query('UPDATE client_cert_issued SET verify_count = verify_count + 1, last_verified_at = NOW() WHERE id=?', [cert.id])
      .catch(() => {});
    query(
      'INSERT INTO client_cert_verifications (cert_id, ip_address, user_agent, outcome) VALUES (?,?,?,?)',
      [cert.id,
        String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim().slice(0, 64) || null,
        String(req.headers['user-agent'] || '').slice(0, 255) || null,
        outcome]
    ).catch(() => {});

    return success(res, {
      found: true,
      outcome,                                   // valid | expired | revoked
      certificate_id: cert.certificate_id,
      recipient_name: cert.recipient_name,
      type_name: cert.type_name,
      title: cert.title || null,
      department: show('verify_show_department') ? (cert.department || null) : null,
      duration: show('verify_show_period') ? (cert.duration_text || null) : null,
      start_date: show('verify_show_period') ? fmtDate(cert.start_date) : null,
      end_date: show('verify_show_period') ? fmtDate(cert.end_date) : null,
      issue_date: fmtDate(cert.issue_date),
      expires_on: cert.expires_on ? fmtDate(cert.expires_on) : null,
      signatory_name: show('verify_show_signatory') ? (cert.signatory_name || null) : null,
      signatory_role: show('verify_show_signatory') ? (cert.signatory_role || null) : null,
      // The issuing ORGANISATION's identity, never the platform's — a school's
      // certificate must verify under the school's name (white-label, §11).
      issuer: {
        name: cert.organisation_name || cert.org_name || null,
        logo_url: cert.org_logo || null,
        support_email: s?.support_email || null,
      },
      checked_on: fmtDate(today),
    });
  } catch (e) {
    // Never leak internals to an anonymous caller.
    return error(res, 'Verification is temporarily unavailable. Please try again shortly.', 500, e.message);
  }
});

module.exports = router;
