'use strict';
/**
 * "This smells like one we already know."
 *
 * PLATFORM_STANDARDS §30 holds a table of QA-hardening primitives, RC-1…RC-9.
 * Each row names a BANNED PATTERN and the primitive that replaces it — raw hex
 * colours, buttons with no handler, ad-hoc filter state, fetch-then-hope saves,
 * `window.print()` as an export. That table is, in effect, a registry of the bug
 * classes this platform has already had and already fixed once.
 *
 * A ticket that says "the receipt does not download" is almost certainly an
 * instance of the class RC-6 exists to prevent. Saying so on the ticket saves
 * whoever picks it up from deriving that from scratch, every time.
 *
 * ── WHAT THIS IS NOT ───────────────────────────────────────────────────────
 * It is a SUGGESTION, and a weak one. It reads the words a school typed; it has
 * not seen the code, cannot reproduce anything, and is wrong whenever a report
 * uses the vocabulary of one class to describe another. The triage UI labels it
 * "likely", nothing branches on it, and it stays NULL far more often than not
 * — an ambiguous match is left blank rather than guessed, because a confident
 * wrong pointer costs more than an empty field.
 *
 * ── WHY NO AI ──────────────────────────────────────────────────────────────
 * Same objection as the ideas grouping engine it borrows from: an inference
 * call per ticket is a bill forever for a job a keyword pass does adequately.
 * This is deterministic, runs offline, costs one pass over a short string, and
 * gives the same answer every time.
 */
const { tokens } = require('./ideas.service');

/**
 * The bug class each primitive exists to prevent, in the words a SCHOOL would
 * use for it — not the words we would.
 *
 * ── KEYWORDS ARE POST-CANONICAL, AND THAT IS A FOOTGUN ─────────────────────
 * Matching happens AFTER the ideas engine's normaliser, which folds synonyms
 * and one-letter typos. So `tokens()` never emits "download" — it emits
 * "print". It never emits "invoice", "bill" or "receipts" — all three arrive as
 * "receipt", and "calender" arrives as "calendar".
 *
 * Every keyword below must therefore be written in its CANONICAL form. A
 * keyword like "download" is not merely redundant, it is unreachable: it can
 * never match anything, and it looks like coverage while providing none. When
 * adding one, check it against `canonical()` in ideas.service.js first —
 * `tests/helpdesk-rc.test.js` fails the build if any keyword here is a word the
 * normaliser would have rewritten.
 *
 * RC-8 is deliberately absent: it is referenced in prose in §30.1 but has no row
 * in the §30 table, so there is no banned pattern to match against.
 */
const PATTERNS = [
  { code: 'RC-1', about: 'colour / contrast tokens',
    keywords: ['colour', 'color', 'contrast', 'invisible', 'unreadable', 'faded', 'dark', 'theme', 'white'] },
  { code: 'RC-2', about: 'button with no handler',
    // "working" is deliberately absent: "not working" is in nearly every report
    // ever filed, so it would make this pattern match everything.
    keywords: ['button', 'click', 'clicked', 'clicking', 'press', 'pressed', 'pressing',
               'tap', 'nothing', 'happens', 'dead', 'unresponsive'] },
  { code: 'RC-3', about: 'ad-hoc filter / search state',
    keywords: ['filter', 'search', 'dropdown', 'result', 'results', 'empty', 'blank', 'list', 'showing'] },
  { code: 'RC-4', about: 'save without invalidation',
    keywords: ['save', 'saved', 'saving', 'update', 'updated', 'refresh', 'reload', 'old', 'stale', 'revert'] },
  { code: 'RC-5', about: 'role-namespaced link',
    keywords: ['link', 'redirect', 'wrong', 'page', 'opens', 'navigate', 'menu', 'sidebar'] },
  // "download" would be dead here — the normaliser rewrites it to "print".
  { code: 'RC-6', about: 'export / print / PDF',
    keywords: ['print', 'pdf', 'export', 'receipt'] },
  { code: 'RC-7', about: 'chart / media without states',
    keywords: ['chart', 'graph', 'image', 'photo', 'video', 'loading', 'blank'] },
  // "calender" is covered — the normaliser corrects it to "calendar".
  { code: 'RC-9', about: 'native date input',
    keywords: ['date', 'calendar', 'picker', 'birth', 'dob', 'month'] },
];

// Two independent words in common. One is noise — "blank" alone appears in
// reports about charts, filters and colours alike, and picking any of the three
// on that basis is a coin toss wearing a label.
const MIN_MATCHES = 2;

/**
 * Best-matching RC code for a ticket, or null.
 *
 * Reads the reporter's WORDS only. The area path is deliberately not consulted:
 * it says which screen, and every screen carries several of these classes at
 * once, so it would add confidence without adding evidence.
 *
 * @param {object} t  { title, description, kind }
 * @returns {string|null}
 */
function suggestRc(t) {
  const text = `${t?.title || ''} ${t?.description || ''}`.trim();
  if (!text) return null;

  // A wish is not a defect, and the primitives table is a defect registry.
  // Matching "I would like to print receipts" onto RC-6 files a feature request
  // as a known bug class.
  if (t?.kind === 'request' || t?.kind === 'question') return null;

  const words = new Set(tokens(text));
  if (!words.size) return null;

  const scored = PATTERNS
    .map((p) => ({ code: p.code, hits: p.keywords.filter((k) => words.has(k)).length }))
    .filter((s) => s.hits >= MIN_MATCHES)
    .sort((a, b) => b.hits - a.hits);

  if (!scored.length) return null;
  // A tie means the words fit two classes equally well, which is not a match —
  // it is a report that has not said enough to tell them apart.
  if (scored.length > 1 && scored[0].hits === scored[1].hits) return null;
  return scored[0].code;
}

module.exports = { suggestRc, PATTERNS, MIN_MATCHES };
