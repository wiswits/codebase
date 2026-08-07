'use strict';
/*
 * subjectKey — how a school's own words find the right board tree.
 *
 * A school writes "Maths" in client_subjects. The curriculum tree says
 * subject_key = 'mathematics'. Nothing in the database connects those two, and
 * we are deliberately NOT editing the school's data to make them match
 * (CLAUDE.md: the school's tree is theirs; CIE sits beside it).
 *
 * So the join happens here, in two steps:
 *
 *   1. normalise()  — lowercase, strip everything that is not a letter or a
 *                     digit. "Social Science" → "socialscience", "Maths-II" →
 *                     "mathsii". This is a pure function and it is the ONLY
 *                     writer of cie_subject_aliases.alias, so the stored keys
 *                     and the lookup keys can never drift apart.
 *
 *   2. resolveSubjectKey() — look the normalised form up in
 *                     cie_subject_aliases. A miss returns the normalised form
 *                     itself, which is the right fallback: a school teaching
 *                     "Sanskrit" with no alias row still matches a tree authored
 *                     under subject_key 'sanskrit'.
 *
 * Why an alias TABLE and not a constant in this file: the first time a school's
 * wording misses, the content team must be able to fix it from the console in a
 * minute. A constant would need a deploy. The table is seeded by migration 055
 * with the wordings schools actually use, including transliterated and Devanagari
 * Hindi.
 *
 * Roman-numeral and stream suffixes are stripped BEFORE the alias lookup, not
 * aliased individually — otherwise every subject needs four rows ("mathsi",
 * "mathsii", "mathspart1", …). "Mathematics Part II" and "Maths-1" both reach
 * 'mathematics'.
 */

// Suffixes schools append that never change WHICH subject it is — only which
// half of it. Order matters: longer patterns first, so "part2" is consumed
// before a bare "2" would be.
const SPLIT_SUFFIX = /(part[0-9ivx]+|paper[0-9ivx]+|[0-9]+|i{1,3}|iv|v)$/;

/**
 * Fold a human subject name into a stable lookup key.
 * Pure, synchronous, and safe on null/undefined.
 */
function normalise(name) {
  if (name == null) return '';
  let s = String(name)
    .toLowerCase()
    .normalize('NFC')            // so composed and decomposed Devanagari agree
    .replace(/[^\p{L}\p{N}]+/gu, '');
  if (!s) return '';
  // Strip a trailing part/paper marker, but never strip the whole string — a
  // subject literally named "II" is a data-entry error, not a match to nothing.
  const trimmed = s.replace(SPLIT_SUFFIX, '');
  if (trimmed.length >= 3) s = trimmed;
  return s;
}

/**
 * Resolve a school's subject name to a curriculum-tree subject_key.
 *
 * @param {Function} query  the db query helper (injected so this stays testable
 *                          without a live connection)
 * @param {string}   name   whatever the school typed
 * @returns {Promise<{ key: string, alias: string, matched: boolean }>}
 *          `matched` is false when we fell back to the normalised form. The
 *          caller surfaces that as "we could not find a curriculum for this
 *          subject" rather than silently returning an empty list, because an
 *          empty list reads to a teacher as "the platform has nothing".
 */
async function resolveSubjectKey(query, name) {
  const alias = normalise(name);
  if (!alias) return { key: '', alias: '', matched: false };
  const rows = await query(
    'SELECT subject_key FROM cie_subject_aliases WHERE alias=? LIMIT 1', [alias]);
  if (rows.length) return { key: rows[0].subject_key, alias, matched: true };
  return { key: alias, alias, matched: false };
}

module.exports = { normalise, resolveSubjectKey };
