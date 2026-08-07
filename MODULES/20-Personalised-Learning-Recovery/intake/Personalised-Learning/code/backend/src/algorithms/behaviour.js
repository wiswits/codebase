'use strict';

/**
 * ALGORITHM 3 — BEHAVIOUR ANALYSIS (pure core) ⭐⭐
 *
 * "Galat" ek jawab hai. "Kyun galat" ek diagnosis hai.
 * Two students, same wrong answer — completely different treatment.
 */

const { T } = require('./constants');
const { mean, variance, pct, sum } = require('./util');

/**
 * Classify a single response into a behavioural bucket using time + edits.
 * Requires: time_sec, est_time_sec, difficulty, is_correct,
 *           changed_count, visits, first_answer/final_answer/first_correct.
 */
function classifyResponse(r) {
  const est = r.est_time_sec || 1;
  const ratio = (r.time_sec || 0) / est;
  const easy = r.difficulty === 'easy';
  const hard = r.difficulty === 'hard' || r.difficulty === 'extreme';

  // ─── CORRECT ANSWERS ───────────────────────────────────────
  if (r.is_correct) {
    if (ratio < T.VERY_FAST && hard) return 'lucky_guess';
    if (ratio < T.FAST) return 'mastered';
    if (ratio > T.VERY_SLOW) return 'laboured';
    return 'solid';
  }

  // ─── WRONG ANSWERS — the real diagnosis ────────────────────
  if (ratio < T.VERY_FAST) {
    if ((r.changed_count || 0) === 0 && (r.visits || 0) <= 1) return 'guess';
    return 'rushed';
  }

  if (easy && ratio < T.NORMAL_HI) {
    return 'silly_mistake'; // aata hai, dhyan nahi diya
  }

  if (ratio > T.VERY_SLOW && (r.changed_count || 0) >= 2) {
    return 'confused'; // mehnat ki, par bharam hai
  }

  if (ratio > T.SLOW) {
    return 'concept_gap'; // mehnat ki, par aata nahi
  }

  if (
    r.first_answer &&
    r.final_answer &&
    r.first_answer !== r.final_answer &&
    r.first_correct
  ) {
    return 'overthinking'; // pehla sahi tha, badal ke galat kar diya
  }

  return 'concept_gap';
}

function coachingNote(behaviour, silly, concept) {
  const notes = {
    rusher: `${silly}% galtiyan sirf jaldbaazi ki hain. Concept aata hai. Speed nahi, accuracy pe kaam karao. Har question ke baad 5 second ruk ke check karne ki aadat daalo.`,
    overthinker: `Pehla jawab aksar sahi hota hai, phir badal ke galat kar deta hai. Apne instinct pe bharosa karna sikhao. "Change only if you find a definite error" rule lagao.`,
    gives_up: `${concept}% questions me try hi nahi kar raha — guess maar raha hai. Ye confidence ka issue hai, gyaan ka nahi. Easy questions se shuru karo, jeet ka ehsaas do.`,
    erratic: `Performance bahut oopar-neeche hai. Kabhi 80%, kabhi 30%. Ye focus ya routine ka issue ho sakta hai. Teacher se baat karo.`,
    balanced: `Achhi aadatein hain. Jo galtiyan hain wo asli concept gaps hain — un pe seedha kaam kar sakte hain.`,
  };
  return notes[behaviour];
}

/**
 * Build a behaviour profile from a window of responses.
 * Pure: caller supplies the responses (already recency-filtered).
 */
function buildBehaviourProfile(responses) {
  const tally = {};
  for (const r of responses) {
    const c = classifyResponse(r);
    tally[c] = (tally[c] || 0) + 1;
  }

  const total = responses.length;
  const wrong = responses.filter((r) => !r.is_correct).length;

  const sillyRate = pct(tally.silly_mistake, wrong);
  const conceptRate = pct((tally.concept_gap || 0) + (tally.confused || 0), wrong);
  const guessRate = pct(tally.guess, total);
  const overthinkRate = pct(tally.overthinking, wrong);
  const rushRate = pct(tally.rushed, wrong);

  // spread of correctness across the window (0/100 per response)
  const accByResp = responses.map((r) => (r.is_correct ? 100 : 0));
  const accSpread = Math.sqrt(variance(accByResp)); // std dev, 0..50

  // ─── ARCHETYPE ─────────────────────────────────────────────
  let behaviour;
  if (sillyRate > 40 || rushRate > 35) behaviour = 'rusher';
  else if (overthinkRate > 25) behaviour = 'overthinker';
  else if (guessRate > 25) behaviour = 'gives_up';
  else if (accSpread > 35) behaviour = 'erratic';
  else behaviour = 'balanced';

  // ─── PACE ──────────────────────────────────────────────────
  const avgRatio = mean(
    responses.map((r) => (r.time_sec || 0) / (r.est_time_sec || 1))
  );
  const pace = avgRatio < 0.7 ? 'fast' : avgRatio > 1.3 ? 'needs_time' : 'moderate';

  return {
    behaviour,
    pace,
    avg_time_ratio: Number(avgRatio.toFixed(3)),
    silly_mistake_rate: sillyRate,
    concept_gap_rate: conceptRate,
    guess_rate: guessRate,
    overthink_rate: overthinkRate,
    rush_rate: rushRate,
    revision_rate: pct(sum(responses.map((r) => r.changed_count || 0)), total),
    tally,
    coaching_note: coachingNote(behaviour, sillyRate, conceptRate),
  };
}

/**
 * Error signature: distribution of distractor_reason across wrong responses,
 * as sorted [{reason, count, pct}] plus a {reason: pct} map.
 */
function errorSignature(responses) {
  const wrong = responses.filter((r) => !r.is_correct);
  const counts = {};
  for (const r of wrong) {
    const reason = r.distractor_reason || 'unknown';
    counts[reason] = (counts[reason] || 0) + 1;
  }
  const list = Object.entries(counts)
    .map(([reason, count]) => ({ reason, count, pct: pct(count, wrong.length) }))
    .sort((a, b) => b.count - a.count);

  const map = {};
  for (const item of list) map[item.reason] = item.pct;
  return { list, map, wrong_total: wrong.length };
}

module.exports = {
  classifyResponse,
  buildBehaviourProfile,
  coachingNote,
  errorSignature,
};
