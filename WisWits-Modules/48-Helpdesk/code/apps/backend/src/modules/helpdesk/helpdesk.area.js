'use strict';
/**
 * WHERE the problem is — five levels, none of them typed by a person.
 *
 *   App → Module → Page → Section → Component
 *   e.g.  fees.collect.payment_summary.receipt_button
 *
 * A ticket has always carried `module_slug` + `section`, both derived from the
 * ROUTE. That names the page. It does not name the region of the page, the
 * component that rendered it, or the control that was pressed — so the first
 * thing anyone did with a ticket was go and find the right file by hand.
 *
 * ── THE FALLBACK IS THE WHOLE ROLLOUT STRATEGY ─────────────────────────────
 * Nothing here requires a single component to be tagged. With zero
 * `data-ww-area` attributes in the codebase, `areaPath()` still returns
 * `fees.collect_fees` — built from the module and section every ticket already
 * has. Tagging a component adds a level; not tagging it costs nothing. That is
 * why this can ship on its own, before any tagging work, and improve as tags
 * land rather than waiting on a sweep that would never be finished.
 *
 * ── EVERYTHING HERE IS PLATFORM-ONLY ───────────────────────────────────────
 * area_path and source_file_hint are stripped from every non-platform response
 * alongside `context_json` and `module_slug` (helpdesk.routes.js). A school is
 * never shown a source path — §1, "never expose technical implementation".
 *
 * ── AND IT IS ALL A GUESS ──────────────────────────────────────────────────
 * The nearest tagged ancestor of whatever a person last clicked is a strong
 * hint, not a fact: they may have clicked one thing and been failed by another.
 * The triage UI says "likely", never asserts. Nothing downstream may treat
 * these fields as authoritative.
 */
const MAP = require('./areaSourceMap.json');

// A path segment is lowercase, alphanumeric, underscore-separated.
//
// Anything else is REDUCED to that shape rather than rejected: a tag written
// `data-ww-area="Payment Summary"` should become `payment_summary`, not
// disappear and silently cost a level of precision. What matters is that the
// output is drawn from this alphabet and nothing else — the string ends up in a
// LIKE prefix filter, so a surviving `%`, `_` or quote would change which rows
// a filter returns. A segment that reduces to nothing at all is dropped.
const SEG = /^[a-z0-9_]{1,60}$/;

// Five levels is the contract (App is implicit, so four are stored). A deeper
// path is a tagging mistake, not a more precise answer.
const MAX_SEGMENTS = 4;
const MAX_PATH = 300;

/** One human label → one path segment. "Collect Fees" → "collect_fees". */
function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

/**
 * The route-only answer, used when the page carries no tags at all.
 *
 * `section` arrives as the breadcrumb the widget built from the path —
 * "Fees › Collect Fees" — so its parts ARE the module and page levels. The
 * leading part is dropped when it just repeats the module, so a path reads
 * `fees.collect_fees` and not `fees.fees.collect_fees`.
 */
function fallbackAreaPath(moduleSlug, section) {
  const mod = slug(moduleSlug) || 'app';
  const parts = String(section || '')
    .split('›')
    .map(slug)
    .filter(Boolean);
  const rest = parts[0] === mod ? parts.slice(1) : parts;
  return [mod, ...rest].slice(0, MAX_SEGMENTS).join('.');
}

/**
 * The stored path: what the browser inferred from the DOM when it could,
 * the route-derived fallback when it could not.
 *
 * The client value is never trusted as-is. It is re-segmented, re-validated,
 * capped, and forced to start with the module the server itself derived — so a
 * broken or hostile client cannot file a ticket that hides under another
 * module's prefix in the inbox, and `WHERE area_path LIKE 'fees.%'` stays a
 * truthful filter.
 */
function areaPath(rawClientPath, moduleSlug, section) {
  const mod = slug(moduleSlug) || 'app';
  const segs = String(rawClientPath || '')
    .split('.')
    .map((s) => slug(s))
    .filter((s) => s && SEG.test(s));

  if (!segs.length) return fallbackAreaPath(moduleSlug, section).slice(0, MAX_PATH);

  // The module level is the server's to decide, not the browser's.
  if (segs[0] !== mod) segs.unshift(mod);
  return segs.slice(0, MAX_SEGMENTS).join('.').slice(0, MAX_PATH);
}

/**
 * The control the reporter last touched. Free text from the DOM — a label, an
 * aria-label or the trimmed text of a button — so it is bounded and stripped of
 * anything that would make a log line unreadable.
 *
 * It can contain a person's name (a row action reading "Delete Priya Sharma"),
 * which is exactly why it is platform-only and never returned to the school.
 */
function nearestElement(raw) {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || null;
}

/**
 * area_path → the file most likely to hold it.
 *
 * Longest-prefix match against a hand-maintained manifest: the deepest entry
 * that the path starts with wins, so `fees.collect.payment_summary` falls back
 * to `fees.collect`, then to `fees`, then to nothing. No entry, no hint — the
 * ticket is unaffected.
 *
 * Deliberately a static file and not a runtime scan: a guess computed by
 * walking the source tree on every ticket would be slower, would drift with
 * refactors in ways nobody notices, and would read as authoritative. A manifest
 * is wrong in a way a person can see and fix.
 */
function sourceFileHint(path) {
  if (!path) return null;
  let best = null;
  for (const key of Object.keys(MAP)) {
    // Prefix match on SEGMENT boundaries: 'fee' must not match 'fees.collect'.
    if (path !== key && !path.startsWith(`${key}.`)) continue;
    if (!best || key.length > best.length) best = key;
  }
  return best ? String(MAP[best]).slice(0, 300) : null;
}

module.exports = { slug, areaPath, fallbackAreaPath, nearestElement, sourceFileHint, MAX_SEGMENTS };
