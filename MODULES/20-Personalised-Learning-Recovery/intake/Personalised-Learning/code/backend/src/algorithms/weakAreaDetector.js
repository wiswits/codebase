'use strict';

/**
 * ALGORITHM 1 — WEAK AREA DETECTOR (pure core)
 * The brain of the module. Get this wrong = module worthless.
 *
 * The 4 gates (sample → recency → severity → confidence) are what make the
 * module trustworthy. One false positive and the teacher goes back to Excel.
 *
 * This file is pure: it takes topic-score rows + a `now` clock and returns a
 * classification. Persistence and root-cause enrichment live in the service.
 */

const { RULES, SEVERITY_BANDS } = require('./constants');
const { daysSince, clamp, topKey } = require('./util');

function classify(accuracy) {
  for (const [sev, [lo, hi]] of Object.entries(SEVERITY_BANDS)) {
    if (accuracy >= lo && accuracy < hi) return sev;
  }
  return 'mastered';
}

/**
 * Confidence 0..1 that a weak-area call is real.
 * Blends sample size (45%), recency (35%), and consistency (20%).
 */
function computeConfidence(t, now = new Date()) {
  const sampleWeight = Math.min((t.attempted || 0) / 10, 1);

  const d = daysSince(t.last_attempt_at, now);
  const recencyWeight = d <= 7 ? 1.0 : d <= 30 ? 0.8 : d <= 60 ? 0.5 : 0.3;

  const consistencyWeight =
    t.variance != null ? 1 - Math.min(t.variance / 40, 0.5) : 0.7;

  return clamp(
    sampleWeight * 0.45 + recencyWeight * 0.35 + consistencyWeight * 0.2,
    0,
    1
  );
}

/**
 * Decide what to do with a single topic score.
 * Returns one of:
 *   { action: 'skip' }                          — below evidence/confidence bar
 *   { action: 'decay' }                         — stale, mark decayed
 *   { action: 'close', reason }                 — now strong/mastered, close if open
 *   { action: 'candidate', candidate }          — a real weak-area candidate
 */
function evaluateTopic(t, now = new Date()) {
  // GATE 1 — Evidence threshold
  if ((t.attempted || 0) < RULES.MIN_SAMPLE) return { action: 'skip', gate: 'sample' };

  // GATE 2 — Recency
  if (daysSince(t.last_attempt_at, now) > RULES.RECENCY_DAYS) {
    return { action: 'decay', gate: 'recency' };
  }

  // GATE 3 — Severity (strong/mastered → not weak)
  const severity = classify(t.accuracy);
  if (severity === 'strong' || severity === 'mastered') {
    return { action: 'close', reason: 'improved_naturally', gate: 'severity', severity };
  }

  // GATE 4 — Confidence
  const confidence = computeConfidence(t, now);
  if (confidence < RULES.MIN_CONFIDENCE) return { action: 'skip', gate: 'confidence', confidence };

  return {
    action: 'candidate',
    candidate: {
      wiswits_id: t.wiswits_id,
      subject_id: t.subject_id,
      severity,
      accuracy: t.accuracy,
      sample_size: t.attempted,
      confidence,
      easy_acc: t.easy_acc,
      medium_acc: t.medium_acc,
      hard_acc: t.hard_acc,
    },
  };
}

/**
 * Run the gates across a list of topic scores.
 * Returns { candidates, toDecay, toClose } — the service persists each bucket.
 */
function detectFromTopics(topics, now = new Date()) {
  const candidates = [];
  const toDecay = [];
  const toClose = [];

  for (const t of topics) {
    const res = evaluateTopic(t, now);
    if (res.action === 'candidate') candidates.push(res.candidate);
    else if (res.action === 'decay') toDecay.push(t.wiswits_id);
    else if (res.action === 'close') toClose.push({ wiswits_id: t.wiswits_id, reason: res.reason });
  }

  return { candidates, toDecay, toClose };
}

/**
 * Reduce a set of wrong responses into an error signature:
 *   dominantError  — most common distractor_reason
 *   weakestBloom   — Bloom level with the most failures
 */
function analyzeErrorPattern(wrongResponses) {
  const errorCounts = {};
  const bloomFails = {};

  for (const r of wrongResponses) {
    const reason = r.distractor_reason || 'unknown';
    errorCounts[reason] = (errorCounts[reason] || 0) + 1;
    if (r.bloom) bloomFails[r.bloom] = (bloomFails[r.bloom] || 0) + 1;
  }

  return {
    dominantError: topKey(errorCounts),
    weakestBloom: topKey(bloomFails),
    errorCounts,
    bloomFails,
  };
}

module.exports = {
  classify,
  computeConfidence,
  evaluateTopic,
  detectFromTopics,
  analyzeErrorPattern,
};
