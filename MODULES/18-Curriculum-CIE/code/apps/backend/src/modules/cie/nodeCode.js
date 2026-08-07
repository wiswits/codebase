'use strict';
/*
 * nodeCode — the ONE place curriculum identities are minted.
 *
 * `node_code` and `concept_code` are IMMUTABLE once created (051/052 say so, and
 * the PATCH routes reject them): every mapping row in cie_node_concepts and
 * cie_content_concepts hangs off them. Two implementations of an immutable
 * identity generator is therefore not duplication, it is a future collision —
 * the builder minting `CBSE-2026-27-10-MATHEM-CH01` while an importer mints
 * `CBSE-2026-27-10-MATH-CH01` would produce two trees for one class-subject and
 * nobody would notice until a school saw its chapters twice.
 *
 * So the builder route and the CMS importer both call these functions, and there
 * is no second copy anywhere.
 *
 * ── ON READING IDENTITY OUT OF A CODE: DON'T ────────────────────────────────
 * The intern content export uses asset codes like `MATH06C01` and `SCI09C01`.
 * They look like one grammar and are two:
 *
 *     MATH06C01   MATH + class 06 + Chapter 01
 *     SCI09C01    SCI  + class 09 + CHEMISTRY   + chapter 01 within that stream
 *     SCI09P01    SCI  + class 09 + PHYSICS     + chapter 01 within that stream
 *
 * `C` means "chapter" in one and "Chemistry" in the other, and the number after
 * it restarts at 1 per stream — Class 9 Science has four chapters numbered 1.
 * This is the same ambiguity ADR-013 recorded from the Question Bank work
 * (`SCI10C1` vs `Sci10C01`), and it is why nothing here parses an incoming code
 * to work out what a node is. Codes we receive are stored as `official_code` for
 * traceability and never interpreted; ordering comes from an explicit sequence
 * the source states, never from digits scraped out of a string.
 */

const { normalise } = require('./subjectKey');

/** Fold a name to an uppercase alphanumeric fragment of at most n characters. */
const abbr = (s, n) => normalise(s).toUpperCase().slice(0, n);

/**
 * Mint a node code.
 *
 * Readable on purpose — `CBSE-2026-27-10-MATHEM-CH02-T03` is greppable in a log
 * and recognisable in a URL. The subject fragment is capped at 6 characters so
 * the whole code stays inside VARCHAR(64) even for "computerscience" at class 12
 * with a two-level path beneath it.
 *
 * A child's code is built from its PARENT's code, so the tree is legible from
 * any single identifier: given a topic code you can see its chapter.
 */
function nodeCodeFor({ board, session, classNo, subjectKey, nodeType, seq, parentCode }) {
  const head = parentCode || `${board}-${session}-${classNo}-${abbr(subjectKey, 6)}`;
  const tag = { unit: 'U', chapter: 'CH', topic: 'T', subtopic: 'ST' }[nodeType] || 'T';
  return `${head}-${tag}${String(seq).padStart(2, '0')}`;
}

/**
 * The next concept code in a domain: `CN-MATHEMATICS-0043`.
 *
 * The serial is derived from the current maximum inside the same request as the
 * insert, so two concurrent creates in one domain can race. The PRIMARY KEY on
 * concept_code turns that race into a 1062 rather than a duplicate concept, and
 * the caller retries. A dedicated sequence table would be airtight and is not
 * worth a table for an internal, low-concurrency console.
 *
 * @param {Function} query  the db query helper (injected so this is testable)
 */
async function nextConceptCode(query, domain) {
  const d = abbr(domain, 20) || 'GENERAL';
  const rows = await query(
    `SELECT concept_code FROM cie_concepts
      WHERE concept_code LIKE ? ORDER BY concept_code DESC LIMIT 1`, [`CN-${d}-%`]);
  const last = rows.length ? parseInt(String(rows[0].concept_code).split('-').pop(), 10) : 0;
  return `CN-${d}-${String((Number.isFinite(last) ? last : 0) + 1).padStart(4, '0')}`;
}

// Domain is a property of the SUBJECT, never of the class — a concept has no
// class (051). Physics, chemistry and biology all fold into 'science' so that a
// Class 10 science chapter and a Class 11 physics chapter can share a concept,
// which is exactly the cross-class link the prerequisite graph needs.
const DOMAIN_OF = {
  mathematics: 'mathematics',
  science: 'science', physics: 'science', chemistry: 'science', biology: 'science',
  english: 'language', hindi: 'language', sanskrit: 'language',
  socialscience: 'socialscience', history: 'socialscience',
  geography: 'socialscience', civics: 'socialscience', economics: 'socialscience',
  computerscience: 'computing',
};

const domainFor = (subjectKey) =>
  DOMAIN_OF[normalise(subjectKey)] || normalise(subjectKey) || 'general';

module.exports = { abbr, nodeCodeFor, nextConceptCode, DOMAIN_OF, domainFor };
