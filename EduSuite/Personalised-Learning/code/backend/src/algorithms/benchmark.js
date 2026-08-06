'use strict';

/**
 * ALGORITHM 7 — BENCHMARKING & COMPARISON (pure core) ⭐⭐
 *
 * "78% aaye" bekaar hai.
 * "78%, class avg 61%, topper 94%, pichla 64%" — ye kaam ka hai.
 *
 * ⚠️ DIGNITY RULES (non-negotiable, enforced here):
 *   ❌ rank            — never. Not even computed.
 *   ❌ leaderboard     — never.
 *   ❌ topper name     — never. Score only.
 *   ✅ percentile, self-comparison first, class average for context.
 */

const { maxBy } = require('./util');

function percentileBand(p) {
  if (p >= 90) return 'top_10';
  if (p >= 75) return 'top_25';
  if (p >= 25) return 'middle_50';
  return 'needs_support'; // never "bottom 25%"
}

function computeTrend(history) {
  // history: newest-first list of { accuracy }
  if (!history || history.length < 2) return 'stable';
  const recent = history[0].accuracy;
  const prior = history[history.length - 1].accuracy;
  const d = recent - prior;
  if (d >= 5) return 'improving';
  if (d <= -5) return 'declining';
  return 'stable';
}

/** Self-improvement first, peer comparison second and gently worded. */
function buildNarrative({ my, classAvg, previous, best, topper }) {
  const lines = [];

  if (previous != null) {
    const d = my.accuracy - previous;
    if (d >= 10) lines.push(`📈 Pichli baar se ${d.toFixed(0)}% behtar. Shaandaar improvement!`);
    else if (d >= 3) lines.push(`📈 Pichli baar se ${d.toFixed(0)}% behtar. Aage badh rahe ho.`);
    else if (d > -3) lines.push(`➡️ Pichli baar jaisa hi. Sthir ho.`);
    else lines.push(`📉 Pichli baar se ${Math.abs(d).toFixed(0)}% kam. Dekhte hain kya hua.`);
  }

  if (best != null && my.accuracy > best) {
    lines.push(`🏆 Ye tumhara ab tak ka best hai!`);
  }

  if (classAvg != null) {
    const vsClass = my.accuracy - classAvg;
    if (vsClass >= 15) lines.push(`Class average se kaafi aage (${classAvg.toFixed(0)}%).`);
    else if (vsClass >= 5) lines.push(`Class average se aage (${classAvg.toFixed(0)}%).`);
    else if (vsClass >= -5) lines.push(`Class average ke aas-paas (${classAvg.toFixed(0)}%).`);
    else lines.push(`Class average ${classAvg.toFixed(0)}% hai. Thoda kaam chahiye.`);
  }

  if (topper != null) {
    const toTopper = topper - my.accuracy;
    if (toTopper > 0 && toTopper <= 15) {
      lines.push(`Topper se sirf ${toTopper.toFixed(0)}% peeche. Bahut kareeb ho.`);
    }
  }

  return lines;
}

/**
 * Assemble a full comparison payload. All inputs are plain values/rows —
 * no I/O. Note: NO rank field exists anywhere in the output.
 */
function buildComparison({ my, peers, history, percentile }) {
  const previous = history && history[1] ? history[1] : null;
  const best = history && history.length ? maxBy(history, 'accuracy') : null;
  const topper = peers ? peers.topper_accuracy : null;

  return {
    my: {
      accuracy: my.accuracy,
      score: my.score,
      max: my.max_score,
      time_ratio: my.time_ratio ?? null,
    },
    peers: {
      section_avg: peers?.section_avg ?? null,
      class_avg: peers?.class_avg ?? null,
      class_median: peers?.class_median ?? null,
      school_avg: peers?.school_avg ?? null,
      topper: topper ?? null, // score only — NEVER a name
      p90: peers?.p90 ?? null,
      p75: peers?.p75 ?? null,
      p50: peers?.p50 ?? null,
      p25: peers?.p25 ?? null,
    },
    self: {
      previous: previous ? previous.accuracy : null,
      best: best ? best.accuracy : null,
      trend: computeTrend(history || []),
      history: (history || []).map((h) => ({
        test: h.test_title,
        date: h.date,
        acc: h.accuracy,
      })),
    },
    position: {
      percentile,
      band: percentileBand(percentile),
      // ⚠️ rank: intentionally absent.
    },
    gaps: {
      to_class_avg: peers?.class_avg != null ? my.accuracy - peers.class_avg : null,
      to_topper: topper != null ? my.accuracy - topper : null,
      to_previous: previous ? my.accuracy - previous.accuracy : null,
      to_best: best ? my.accuracy - best.accuracy : null,
    },
    narrative: buildNarrative({
      my,
      classAvg: peers?.class_avg ?? null,
      previous: previous ? previous.accuracy : null,
      best: best ? best.accuracy : null,
      topper,
    }),
  };
}

module.exports = { percentileBand, computeTrend, buildNarrative, buildComparison };
