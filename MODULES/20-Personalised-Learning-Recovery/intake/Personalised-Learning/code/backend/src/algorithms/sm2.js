'use strict';

/**
 * ALGORITHM 8 — SPACED REPETITION (SM-2) (pure core)
 *
 * "Mastered topic bhi bhool jaata hai. Sahi waqt pe yaad dilao."
 */

const { addDays } = require('./util');

/**
 * SM-2 update.
 *   card:    { ease_factor, interval_days, repetitions }
 *   quality: 0..5 (0 = blackout, 5 = perfect recall)
 *   now:     clock (injectable for deterministic tests)
 */
function sm2(card, quality, now = new Date()) {
  let ef = card.ease_factor ?? 2.5;
  let iv = card.interval_days ?? 0;
  let rep = card.repetitions ?? 0;

  if (quality < 3) {
    // wrong → restart the ladder
    rep = 0;
    iv = 1;
  } else {
    rep += 1;
    if (rep === 1) iv = 1;
    else if (rep === 2) iv = 6;
    else iv = Math.round(iv * ef);
  }

  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef);

  return {
    ease_factor: Number(ef.toFixed(3)),
    interval_days: iv,
    repetitions: rep,
    due_at: addDays(now, iv),
  };
}

/** Map a graded response to an SM-2 quality score. */
function responseToQuality(r) {
  const ratio = r.time_ratio ?? (r.time_sec || 0) / (r.est_time_sec || 1);
  if (!r.is_correct) {
    return ratio > 1.5 ? 1 : 0; // thought about it but wrong = 1, guess = 0
  }
  if (ratio < 0.6) return 5; // fast + right = perfect
  if (ratio < 1.0) return 4;
  return 3; // slow but right
}

/**
 * Choose the difficulty for the next adaptive question from recent accuracy.
 */
function nextDifficulty(recentAccuracy) {
  if (recentAccuracy >= 80) return 'hard';
  if (recentAccuracy >= 50) return 'medium';
  return 'easy';
}

module.exports = { sm2, responseToQuality, nextDifficulty };
