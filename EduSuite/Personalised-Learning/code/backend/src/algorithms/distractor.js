'use strict';

/**
 * ALGORITHM 4 — DISTRACTOR / MISCONCEPTION ANALYSIS (pure core) ⭐⭐⭐
 *
 * "24 bachchon ne option B chuna" ek number hai.
 * "24 bachchon ko sign error ka bharam hai" ek insight hai.
 *
 * The service fetches per-question responses + option metadata; this core turns
 * them into insights, quality flags, and misconception clusters.
 */

const { D } = require('./constants');
const { entropy, mean, pct } = require('./util');

/** Discrimination index = (topCorrect − bottomCorrect) / n, top/bottom 27%. */
function discriminationIndex(sortedByScoreDesc, isCorrectForQuestion) {
  const n = Math.floor(sortedByScoreDesc.length * 0.27);
  if (n < 3) return null;
  const top = sortedByScoreDesc.slice(0, n);
  const bottom = sortedByScoreDesc.slice(-n);
  const topCorrect = top.filter(isCorrectForQuestion).length;
  const bottomCorrect = bottom.filter(isCorrectForQuestion).length;
  return (topCorrect - bottomCorrect) / n;
}

/**
 * Analyze one question's responses.
 *   q: { question_id, wiswits_id, seq, correct_option,
 *        optionMeta: { [key]: { text, distractor_reason, misconception, remediation_hint } } }
 *   responses: [{ answer_json:{selected}, is_correct, student_id }]
 *   di: precomputed discrimination index (or null)
 *
 * Returns { insight, flags } — either may be null/empty.
 */
function analyzeQuestion(q, responses, di = null) {
  const total = responses.length;
  if (total < D.MIN_SAMPLE) return { insight: null, flags: [] };

  const correct = responses.filter((r) => r.is_correct).length;
  const accuracy = (correct / total) * 100;

  // distribution across chosen options
  const dist = {};
  for (const r of responses) {
    const opt = (r.answer_json && r.answer_json.selected) ?? 'skipped';
    dist[opt] = (dist[opt] || 0) + 1;
  }

  // rank wrong options (excluding the key and skips)
  const wrongDist = Object.entries(dist)
    .filter(([opt]) => opt !== q.correct_option && opt !== 'skipped')
    .sort((a, b) => b[1] - a[1]);

  const flags = [];
  let insight = null;

  if (wrongDist.length === 0) return { insight, flags, accuracy, dist };

  const [topWrong, count] = wrongDist[0];
  const topWrongPct = (count / total) * 100;

  // FLAG 1 — answer key error?
  if (accuracy < D.QUESTION_SUSPECT_ACC && topWrongPct >= D.KEY_ERROR_PCT) {
    flags.push({
      question_id: q.question_id,
      flag: 'key_error',
      severity: 'critical',
      reason: `Only ${accuracy.toFixed(0)}% chose the marked-correct option, but ${topWrongPct.toFixed(0)}% chose "${topWrong}". Verify the answer key.`,
    });
    return { insight, flags, accuracy, dist }; // don't also emit misconception
  }

  // FLAG 2 — ambiguous?
  if (accuracy < D.QUESTION_SUSPECT_ACC) {
    const spread = entropy(Object.values(dist));
    if (spread > D.AMBIGUOUS_ENTROPY) {
      flags.push({
        question_id: q.question_id,
        flag: 'ambiguous',
        severity: 'high',
        reason: `${accuracy.toFixed(0)}% correct with answers spread evenly across all options. Question wording may be unclear.`,
      });
    }
  }

  // FLAG 3 — non-discriminating?
  if (di != null && di < D.DI_NON_DISCRIMINATING && accuracy > 30 && accuracy < 80) {
    flags.push({
      question_id: q.question_id,
      flag: 'non_discriminating',
      severity: 'medium',
      reason: `Toppers and strugglers perform equally (DI=${di.toFixed(2)}). This question isn't measuring anything.`,
    });
  }

  // THE INSIGHT — a real, actionable misconception
  if (accuracy < 60 && topWrongPct >= D.MISCONCEPTION_PCT) {
    const meta = (q.optionMeta && q.optionMeta[topWrong]) || {};
    const classWide = topWrongPct >= D.STRONG_MISCONCEPTION;
    insight = {
      question_id: q.question_id,
      wiswits_id: q.wiswits_id,
      seq: q.seq,
      accuracy,
      distribution: dist,
      misconception: {
        option: topWrong,
        option_text: meta.text || null,
        count,
        pct: Math.round(topWrongPct),
        reason: meta.distractor_reason || 'unknown',
        explanation: meta.misconception || null,
        remediation_hint: meta.remediation_hint || null,
      },
      strength: classWide ? 'class_wide' : 'significant',
      headline: classWide
        ? '🚨 Poori class ek hi bharam me hai'
        : `⚠️ ${count} bachchon me common misconception`,
      affected_students: responses
        .filter((r) => r.answer_json && r.answer_json.selected === topWrong)
        .map((r) => r.student_id),
    };
  }

  return { insight, flags, accuracy, dist };
}

/** Cluster insights that share a distractor_reason across 2+ questions. */
function clusterMisconceptions(insights) {
  const byReason = {};
  for (const i of insights) {
    const r = i.misconception.reason;
    (byReason[r] ||= []).push(i);
  }
  return Object.entries(byReason)
    .filter(([, list]) => list.length >= 2)
    .map(([reason, list]) => ({
      reason,
      question_count: list.length,
      questions: list.map((i) => i.seq),
      avg_pct: Math.round(mean(list.map((i) => i.misconception.pct))),
      headline: `${list.length} questions me wahi galti — "${reason}". Ye ek systemic gap hai, random nahi.`,
    }));
}

module.exports = {
  discriminationIndex,
  analyzeQuestion,
  clusterMisconceptions,
};
