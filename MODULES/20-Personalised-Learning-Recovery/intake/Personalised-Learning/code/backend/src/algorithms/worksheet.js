'use strict';

/**
 * ALGORITHM 5 — ADAPTIVE WORKSHEET GENERATOR (planning core) ⭐⭐⭐
 *
 * "Ek worksheet jo sirf is bachche ke liye bani hai."
 *
 * This core decides the PLAN — strategy, targets, ladder, behaviour override,
 * ordering, generation reason. Actual question fetching (QBank) + PDF render
 * live in the service.
 */

const { W, LADDERS } = require('./constants');
const { severityRank } = require('./rootCause');

function bySeverityThenConfidence(a, b) {
  const d = severityRank(a.severity) - severityRank(b.severity);
  if (d !== 0) return d;
  return (b.confidence || 0) - (a.confidence || 0);
}

/** Pick a generation strategy from weak areas + learning profile. */
function pickStrategy(weakAreas, profile) {
  const hasRoots = weakAreas.some((w) => w.is_root_cause);
  const allMastered = weakAreas.every((w) => w.severity === 'mastered');
  if (allMastered) return 'challenge';
  if (hasRoots) return 'root_first';
  if (profile && profile.behaviour === 'gives_up') return 'confidence_build';
  return 'mixed';
}

/**
 * BEHAVIOUR OVERRIDE — a rusher who knows the concept doesn't need a worksheet,
 * they need coaching. Returns a coaching directive, or null if not applicable.
 */
function behaviourOverride(profile) {
  if (
    profile &&
    profile.behaviour === 'rusher' &&
    (profile.silly_mistake_rate || 0) > 40
  ) {
    return {
      type: 'coaching_note',
      skip_worksheet: true,
      message: profile.coaching_note,
      suggested_action: 'accuracy_drill',
    };
  }
  return null;
}

/**
 * Choose up to MAX_TARGETS. Root-cause-first when strategy asks for it.
 */
function selectTargets(weakAreas, strategy) {
  const roots = weakAreas.filter((w) => w.is_root_cause);
  const pool =
    strategy === 'root_first' && roots.length > 0 ? roots : weakAreas.slice();
  return pool.sort(bySeverityThenConfidence).slice(0, W.MAX_TARGETS);
}

/** Ladder for a target given the active strategy. */
function ladderFor(target, strategy) {
  if (strategy === 'revision') return LADDERS.revision;
  if (strategy === 'challenge') return LADDERS.challenge;
  return LADDERS[target.severity] || LADDERS.weak;
}

/** Order questions easy → medium → hard (confidence curve). */
function orderByLadder(questions, rng = Math.random) {
  const rank = { easy: 0, medium: 1, hard: 2, extreme: 3 };
  return [...questions].sort((a, b) => {
    const d = (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1);
    return d !== 0 ? d : rng() - 0.5;
  });
}

function countByDifficulty(questions) {
  const out = {};
  for (const q of questions) out[q.difficulty] = (out[q.difficulty] || 0) + 1;
  return out;
}

function buildReason(targets, strategy) {
  const t = targets[0];
  if (!t) return 'No open weak areas to target.';
  if (strategy === 'root_first' && t.is_root_cause) {
    return (
      `Root cause targeted: ${t.wiswits_id} (${Number(t.accuracy).toFixed(0)}%). ` +
      `Fixing this should also improve dependent topics.`
    );
  }
  return (
    `Targeting ${targets.map((x) => x.wiswits_id).join(', ')} ` +
    `based on ${t.sample_size} attempts at ${Number(t.accuracy).toFixed(0)}% accuracy.`
  );
}

/**
 * Produce a worksheet PLAN (no I/O). The service uses this to fetch questions.
 * Returns either a coaching directive (skip_worksheet) or a plan object.
 */
function planWorksheet(weakAreas, profile, opts = {}) {
  if (!weakAreas || weakAreas.length === 0) return null;

  const strategy = opts.strategy || pickStrategy(weakAreas, profile);

  const override = behaviourOverride(profile);
  if (override) return override;

  const targets = opts.targets
    ? opts.targets.slice(0, W.MAX_TARGETS)
    : selectTargets(weakAreas, strategy);

  const plan = targets.map((target) => ({
    wiswits_id: target.wiswits_id,
    root_wiswits_id: target.root_wiswits_id || target.wiswits_id,
    severity: target.severity,
    dominant_bloom_gap: target.dominant_bloom_gap || null,
    ladder: ladderFor(target, strategy),
  }));

  return {
    strategy,
    targets: targets.map((t) => t.wiswits_id),
    plan,
    limits: { min: W.MIN_QUESTIONS, max: W.MAX_QUESTIONS, no_repeat_days: W.NO_REPEAT_DAYS },
    generation_reason: buildReason(targets, strategy),
  };
}

module.exports = {
  pickStrategy,
  behaviourOverride,
  selectTargets,
  ladderFor,
  orderByLadder,
  countByDifficulty,
  buildReason,
  planWorksheet,
  bySeverityThenConfidence,
};
