'use strict';

/**
 * Pure numeric / collection helpers shared across the algorithm cores.
 * No I/O, no dates-from-now beyond what's injected — keep this testable.
 */

function sum(arr) {
  return arr.reduce((a, b) => a + (Number(b) || 0), 0);
}

function mean(arr) {
  if (!arr.length) return 0;
  return sum(arr) / arr.length;
}

function variance(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return mean(arr.map((x) => (x - m) ** 2));
}

function stdDev(arr) {
  return Math.sqrt(variance(arr));
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function percentileOf(sortedAsc, value) {
  if (!sortedAsc.length) return 0;
  const below = sortedAsc.filter((v) => v < value).length;
  return Math.round((below / sortedAsc.length) * 100);
}

function quantile(sortedAsc, q) {
  if (!sortedAsc.length) return null;
  const pos = (sortedAsc.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedAsc[base + 1] !== undefined) {
    return sortedAsc[base] + rest * (sortedAsc[base + 1] - sortedAsc[base]);
  }
  return sortedAsc[base];
}

/** % of `part` out of `whole`, guarded against divide-by-zero. */
function pct(part, whole) {
  if (!whole) return 0;
  return Math.round(((part || 0) / whole) * 100);
}

/** Key with the highest count in a {key: count} tally (null if empty). */
function topKey(counts) {
  let best = null;
  let bestN = -Infinity;
  for (const [k, n] of Object.entries(counts)) {
    if (n > bestN) {
      bestN = n;
      best = k;
    }
  }
  return best;
}

/**
 * Normalized Shannon entropy (0..1) of a distribution of counts.
 * 1 = perfectly spread across all options, 0 = all in one option.
 */
function entropy(counts) {
  const total = sum(counts);
  if (total === 0) return 0;
  const k = counts.filter((c) => c > 0).length;
  if (k <= 1) return 0;
  let h = 0;
  for (const c of counts) {
    if (c <= 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  return h / Math.log2(k);
}

function maxBy(arr, key) {
  if (!arr.length) return null;
  return arr.reduce((best, x) => (x[key] > best[key] ? x : best), arr[0]);
}

function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / MS);
}

/** Days between `from` and `now` (now injectable for deterministic tests). */
function daysSince(from, now = new Date()) {
  return daysBetween(from, now);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

module.exports = {
  sum,
  mean,
  variance,
  stdDev,
  median,
  percentileOf,
  quantile,
  pct,
  topKey,
  entropy,
  maxBy,
  daysBetween,
  daysSince,
  addDays,
  clamp,
};
