'use strict';
/*
 * purpose — the 19 content types, folded into the 4 steps a person recognises.
 *
 * ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
 * The builder offers 19 content types because that is what the content team
 * actually produces: a DPP is not a practice set is not a PYQ. But 19 chips is
 * not a learning experience, and a teacher does not think in 19 categories
 * either.
 *
 * The design mockup answered this without saying so: its four content TABS
 * (Video / Notes / DPP / Quiz) and its four student PATH steps
 * (Watch → Read → Practise → Test) are the same four things. So one mapping
 * serves both surfaces — the teacher's tab strip and the student's ordered path
 * are two renderings of this table.
 *
 * ── THE ORDER IS THE LOCK ──────────────────────────────────────────────────
 * `STEPS` is ordered, and that order IS the student's unlock rule: practise
 * opens when watching and reading are done, the test opens when practise is
 * done. No unlock table, no per-item prerequisite to author — the sequence falls
 * out of what kind of thing each object is.
 *
 * That is a deliberate trade. It cannot express "watch video 2 before video 1",
 * and it should not try: per-item ordering is a Learning Path feature and this
 * is the free version of it that works on content nobody sequenced by hand.
 *
 * ── ONE COPY, TWO RUNTIMES ─────────────────────────────────────────────────
 * The frontend needs the identical mapping. It is duplicated in
 * apps/web/src/lib/contentPurpose.ts rather than shared through a package
 * because the backend is CommonJS, the web app is an ESM/TS bundle, and this
 * repo has no shared runtime package between them. The two files carry the same
 * table and a test asserts they agree — see tests/cie-purpose.test.js, which
 * reads the TS file as text so a drift fails CI rather than shipping a student
 * path that disagrees with the teacher's tabs.
 */

// Ordered. Index = the step's position in the student's path.
const STEPS = [
  { key: 'watch',    label: 'Watch',    plural: 'Video Lectures' },
  { key: 'read',     label: 'Read',     plural: 'Notes' },
  { key: 'practise', label: 'Practise', plural: 'Practice' },
  { key: 'test',     label: 'Test',     plural: 'Quiz' },
];

const STEP_KEYS = STEPS.map((s) => s.key);

// Every type the builder offers must appear here. A type that is missing would
// silently vanish from both the teacher's tabs and the student's path — the
// "dead feature that reads as no data" failure mode — so `purposeOf` falls back
// to 'read' rather than to nothing, and a test asserts the builder's list and
// this map cover each other exactly.
const PURPOSE_OF_TYPE = {
  // Watch
  video_lecture: 'watch',
  recorded_class: 'watch',
  simulation: 'watch',
  audio: 'watch',

  // Read
  lecture_notes: 'read',
  revision_notes: 'read',
  chapter_summary: 'read',
  ncert_solutions: 'read',
  pdf: 'read',
  presentation: 'read',
  mind_map: 'read',
  formula_sheet: 'read',
  infographic: 'read',
  flashcards: 'read',

  // Practise
  worksheet: 'practise',
  dpp: 'practise',
  practice_set: 'practise',
  lab_activity: 'practise',

  // Test
  pyq: 'test',
  quiz: 'test',
};

/** The step a content type belongs to. Unknown types read as 'read' — visible,
 *  never dropped. */
function purposeOf(type) {
  return PURPOSE_OF_TYPE[String(type || '').toLowerCase()] || 'read';
}

/**
 * Group content into the four steps, in order, and decide what is unlocked.
 *
 * A step is COMPLETE when it has items and every item is done. A step is LOCKED
 * when any earlier step that HAS items is incomplete — a step with no items is
 * transparent, so a topic with no notes does not block practice forever.
 *
 * @param {Array} items  resolved content rows; each may carry `progress`
 * @returns {Array} one entry per step, ordered, with items/locked/complete
 */
function groupByPurpose(items = []) {
  const buckets = new Map(STEP_KEYS.map((k) => [k, []]));
  for (const it of items) {
    buckets.get(purposeOf(it.type)).push(it);
  }

  const out = [];
  let blocked = false;
  for (const step of STEPS) {
    const list = buckets.get(step.key);
    const done = list.filter((i) => i.progress?.status === 'done').length;
    const complete = list.length > 0 && done === list.length;

    out.push({
      ...step,
      items: list,
      count: list.length,
      done,
      complete,
      // Locked only if something earlier is genuinely outstanding. Evaluated
      // BEFORE this step updates `blocked`, so a step never locks itself.
      locked: blocked && list.length > 0,
    });

    if (list.length > 0 && !complete) blocked = true;
  }
  return out;
}

module.exports = { STEPS, STEP_KEYS, PURPOSE_OF_TYPE, purposeOf, groupByPurpose };
