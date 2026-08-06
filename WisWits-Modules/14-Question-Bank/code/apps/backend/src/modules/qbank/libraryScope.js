'use strict';
/**
 * libraryScope — THE one answer to "whose questions may this request read?"
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The 9,336-question bank mirrored out of IOMAD lives on ONE org (WisWits HQ).
 * Every school that is switched on reads that same copy — it is not duplicated
 * per tenant. Two reasons that shape was chosen over copying:
 *
 *   - a correction to a question is made once, not chased across every tenant
 *     holding a stale copy;
 *   - 9,336 rows × every school is a table nobody wants to migrate later.
 *
 * The cost is that a question-bank read is the ONLY query in this codebase
 * permitted to name an org other than the caller's. §6 and §17 say every tenant
 * query is scoped by org_id, and this is the one sanctioned exception — so it
 * exists exactly once, in one function, with its own test file, instead of as a
 * widened WHERE clause copy-pasted across a dozen routes. A second copy would
 * drift, and the drift would be one school reading another school's questions.
 *
 * THE RULE
 * --------
 *   read  → caller's org, PLUS the platform org when the org has been switched on
 *   write → caller's org ONLY, always, no exception
 *
 * `readScope` is deliberately pure: it takes the flag as an argument rather than
 * looking it up. That is what lets the guarantee ("no third org, ever") be
 * asserted exhaustively in tests/qbank-library-scope.test.js instead of sampled
 * against a database.
 *
 * WHAT THIS FILE DOES NOT DO
 * --------------------------
 * It grants READ. A school can find a platform question, filter it, and put it
 * in a test. It cannot edit or delete one: the write routes keep their unchanged
 * `org_id = req.user.org_id` filter, so a platform row simply does not match and
 * the route 404s. That is enforced by the routes, not here, and is covered by
 * tests/qbank-library-writes.test.js.
 */
const { queryOne } = require('../../config/db');

/**
 * WisWits HQ — the tenant that owns the master bank. Same env var planGate.js
 * reads, so the platform org has ONE definition across the codebase rather than
 * a literal `1` in each place that needs it.
 */
const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);

/**
 * Per-org opt-in, in the existing `client_feature_flags` table — no new table
 * and no new toggle mechanism. Namespaced because that table is shared: an
 * unprefixed `library` would collide with the next module that wants the word.
 */
const LIBRARY_FLAG = 'qbank.platform_library';

/**
 * Build the org filter for a READ.
 *
 * @param {number}  orgId    the caller's org (from the JWT, never from input)
 * @param {boolean} enabled  has this org been switched on for the library?
 * @param {string}  alias    table alias the column belongs to
 * @returns {{sql: string, params: number[]}}
 */
/**
 * @param {object} [opts]
 * @param {boolean} [opts.privacy=true]
 *   Whether the LIBRARY half should exclude drafts (`is_private = 0`).
 *
 *   Defaults to TRUE, and the direction of that default is the point. Only
 *   client_qb_questions has an is_private column; the three taxonomy tables do
 *   not. So a caller who forgets to pass `privacy: false` for a taxonomy read
 *   gets `Unknown column 's.is_private'` — a crash, on the first request, in
 *   plain sight. A caller reading QUESTIONS cannot forget at all, because safe
 *   is what happens when they say nothing.
 *
 *   The alternative default would reverse both: taxonomy would work silently
 *   and a forgotten questions read would publish WisWits' unfinished drafts to
 *   every granted school with nothing to show for it.
 */
function readScope(orgId, enabled, alias = 'q', opts = {}) {
  const privacy = opts.privacy !== false;
  // Coerced because req.user.org_id has arrived as a string before now, and
  // `'1' !== 1` would make the platform org fail its own identity check below
  // and ask for its rows twice.
  const org = parseInt(orgId, 10);
  const col = `${alias}.org_id`;

  // The platform org reads its own rows through the caller clause; adding the
  // library clause too would just be `org_id = 1 OR org_id = 1`.
  if (!enabled || org === PLATFORM_ORG_ID) {
    return { sql: `(${col} = ?)`, params: [org] };
  }

  // ALWAYS parenthesised. Callers append this with AND:
  //   WHERE is_active = 1 AND <scope>
  // Without the parens that binds as `(is_active AND caller) OR platform`, and
  // the entire platform bank comes back to a caller whose other filters did not
  // match. The parens are not cosmetic; they are the safety.
  //
  // `is_private = 0` on the LIBRARY half only. WisWits writes its questions in
  // the same bank it lends out, and is_private is the only thing holding an
  // unfinished one back — there is no separate draft state. The two doors into
  // this bank disagreed about that: /api/qbank/questions never filtered
  // is_private, quiz-portal's did. So widening the read without carrying the
  // privacy rule along would have published every WisWits draft to every
  // granted school through one door while hiding it in the other.
  //
  // Deliberately NOT applied to the caller's own half. Whether a school's
  // teachers can see each other's private questions is a separate question with
  // a separate answer per door, and this feature does not get to change it.
  //
  // Only the questions table HAS an is_private column — see `privacy` above for
  // why forgetting that is a crash rather than a leak.
  const libraryHalf = privacy
    ? `(${col} = ? AND ${alias}.is_private = 0)`
    : `${col} = ?`;
  return { sql: `(${col} = ? OR ${libraryHalf})`, params: [org, PLATFORM_ORG_ID] };
}

// ── flag lookup ────────────────────────────────────────────────────────────
// Cached for 30s, matching planGate.js. The bank's list route runs this on every
// request; a per-request round trip to read one boolean is not worth it. A
// toggle therefore takes up to 30s to bite, which is the same contract every
// other feature flag in this codebase already has.
const TTL = 30 * 1000;
const cache = new Map(); // org_id → { at, value }
const _cacheClear = () => cache.clear();

/**
 * Is this org switched on for the platform library? DEFAULT OFF — a school sees
 * nothing new until it is explicitly enabled. A missing row is off, not on.
 */
async function libraryEnabled(orgId) {
  const org = parseInt(orgId, 10);
  // The platform org owns the bank; it does not need permission to read it.
  if (org === PLATFORM_ORG_ID) return true;

  const hit = cache.get(org);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const row = await queryOne(
    'SELECT is_enabled FROM client_feature_flags WHERE org_id=? AND feature_key=? LIMIT 1',
    [org, LIBRARY_FLAG]
  );
  const value = !!(row && row.is_enabled);
  cache.set(org, { at: Date.now(), value });
  return value;
}

/** Convenience: the lookup and the clause together, for a route that needs both. */
async function readScopeFor(orgId, alias = 'q', opts = {}) {
  return readScope(orgId, await libraryEnabled(orgId), alias, opts);
}

/**
 * The three taxonomy tables have no is_private column. Named rather than left
 * as a bare `{ privacy: false }` at six call sites, so the reason travels with
 * the option instead of living in a comment somebody has to find.
 */
const TAXONOMY = { privacy: false };

module.exports = { readScope, readScopeFor, libraryEnabled, TAXONOMY, PLATFORM_ORG_ID, LIBRARY_FLAG, _cacheClear };
