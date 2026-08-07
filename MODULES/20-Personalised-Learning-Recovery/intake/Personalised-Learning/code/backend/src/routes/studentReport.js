'use strict';

/**
 * GET /api/pl/analytics/student/:id/report — ⭐⭐⭐ THE FULL PROGRESS REPORT (spec 8.3).
 *
 * Assembles: journey (score over tests), root-cause tree, recovery history,
 * learning profile (behaviour + Bloom radar + error signature), dignity-safe
 * comparison (benchmark.buildComparison — no rank, ever), and next steps.
 *
 * All numbers are computed live from the seeded DB — nothing here is mocked.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { buildComparison } = require('../algorithms/benchmark');
const { percentileOf } = require('../algorithms/util');
const { TOPICS, CHAPTER_NAME, nameFor } = require('../db/fixtures');

const NAME_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, `Ch${t.ch} · ${CHAPTER_NAME[t.ch]}`]));
const topicLabel = (id) => NAME_BY_ID[id] || id;

router.get('/analytics/student/:id/report', requirePermission('student', 'teacher', 'parent', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);
  const subject_id = Number(req.query.subject_id || 9001);

  try {
    // ─── Journey: score per test, in order ───────────────────
    const journeyRows = await db.query(
      `SELECT t.id AS test_id, t.title, a.percentage, a.submitted_at
       FROM client_pl_attempt a JOIN client_pl_test t ON t.id = a.test_id
       WHERE a.org_id = :org_id AND a.student_id = :student_id AND a.status = 'evaluated' AND a.is_offline_entry = 1
       ORDER BY a.submitted_at ASC`,
      { org_id, student_id }
    );
    const journey = journeyRows.map((r) => ({ test: r.title, date: r.submitted_at, acc: Number(r.percentage) }));
    const latest = journey.at(-1);
    const first = journey[0];

    // ─── Profile ──────────────────────────────────────────────
    const [profile] = await db.query(
      `SELECT * FROM client_pl_profile WHERE org_id=:org_id AND student_id=:student_id AND subject_id=:subject_id`,
      { org_id, student_id, subject_id }
    );

    // ─── Bloom radar — computed live from actual responses ───
    const bloomRows = await db.query(
      `SELECT r.bloom, ROUND(SUM(r.is_correct)/COUNT(*)*100) AS accuracy, COUNT(*) AS n
       FROM client_pl_response r JOIN client_pl_attempt a ON a.id = r.attempt_id
       WHERE a.org_id=:org_id AND a.student_id=:student_id AND r.bloom IS NOT NULL
       GROUP BY r.bloom`,
      { org_id, student_id }
    );
    const bloom = Object.fromEntries(bloomRows.map((b) => [b.bloom, Number(b.accuracy)]));

    // ─── Strengths / gaps from topic scores ──────────────────
    const strengths = await db.query(
      `SELECT wiswits_id, accuracy FROM client_pl_topic_score WHERE org_id=:org_id AND student_id=:student_id ORDER BY accuracy DESC LIMIT 3`,
      { org_id, student_id }
    );
    const gaps = await db.query(
      `SELECT wiswits_id, accuracy FROM client_pl_topic_score WHERE org_id=:org_id AND student_id=:student_id ORDER BY accuracy ASC LIMIT 3`,
      { org_id, student_id }
    );

    // ─── Error signature — proxy via weak_area dominant_error_type ─
    const errorRows = await db.query(
      `SELECT dominant_error_type AS reason, COUNT(*) AS n FROM client_pl_weak_area
       WHERE org_id=:org_id AND student_id=:student_id AND dominant_error_type IS NOT NULL
       GROUP BY dominant_error_type ORDER BY n DESC`,
      { org_id, student_id }
    );
    const errTotal = errorRows.reduce((a, r) => a + r.n, 0) || 1;
    const errorSignature = errorRows.map((r) => ({ reason: r.reason, pct: Math.round((r.n / errTotal) * 100) }));

    // ─── Weak areas → root cause tree ────────────────────────
    const weakAreas = await db.query(
      `SELECT wiswits_id, severity, accuracy, is_root_cause, root_wiswits_id, depth_from_root, status, sample_size, confidence
       FROM client_pl_weak_area WHERE org_id=:org_id AND student_id=:student_id
       ORDER BY depth_from_root ASC`,
      { org_id, student_id }
    );
    // group by root, pick the deepest/largest chain as the featured tree
    const byRoot = {};
    for (const w of weakAreas) (byRoot[w.root_wiswits_id] ||= []).push(w);
    const featuredRootId = Object.entries(byRoot).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || null;
    const tree = featuredRootId
      ? byRoot[featuredRootId].sort((a, b) => a.depth_from_root - b.depth_from_root).map((w) => ({
          wiswits_id: w.wiswits_id, label: topicLabel(w.wiswits_id), accuracy: Number(w.accuracy),
          is_root_cause: !!w.is_root_cause, depth_from_root: w.depth_from_root, severity: w.severity, status: w.status,
        }))
      : [];

    // ─── Recovery history ─────────────────────────────────────
    const cycles = await db.query(
      `SELECT wiswits_id, cycle_no, detected_accuracy, retest_accuracy, outcome, days_to_close, closed_at
       FROM client_pl_recovery_cycle WHERE org_id=:org_id AND student_id=:student_id ORDER BY detected_at DESC LIMIT 8`,
      { org_id, student_id }
    );
    const recovery_history = cycles.map((c) => ({
      wiswits_id: c.wiswits_id, label: topicLabel(c.wiswits_id),
      from: Number(c.detected_accuracy), to: c.retest_accuracy != null ? Number(c.retest_accuracy) : null,
      outcome: c.outcome, cycles: c.cycle_no, days: c.days_to_close,
    }));
    const gapsClosedCount = cycles.filter((c) => c.outcome === 'closed').length;

    // ─── Comparison (dignity-safe) ────────────────────────────
    let comparison = null;
    if (latest) {
      const [bench] = await db.query(
        `SELECT b.avg_accuracy, b.topper_accuracy, b.p90, b.p75, b.p50, b.p25, b.median_accuracy
         FROM client_pl_benchmark b WHERE b.org_id=:org_id AND b.scope='class'
         ORDER BY b.test_id DESC LIMIT 1`,
        { org_id }
      );
      const distRows = await db.query(
        `SELECT a.percentage FROM client_pl_attempt a
         WHERE a.org_id=:org_id AND a.test_id = (SELECT test_id FROM client_pl_attempt WHERE org_id=:org_id AND student_id=:student_id AND is_offline_entry=1 ORDER BY submitted_at DESC LIMIT 1)
           AND a.status='evaluated'`,
        { org_id, student_id }
      );
      const sorted = distRows.map((d) => Number(d.percentage)).sort((a, b) => a - b);
      const percentile = percentileOf(sorted, latest.acc);

      comparison = buildComparison({
        my: { accuracy: latest.acc, score: null, max_score: null },
        peers: bench ? {
          class_avg: Number(bench.avg_accuracy), class_median: Number(bench.median_accuracy),
          topper_accuracy: Number(bench.topper_accuracy), p90: Number(bench.p90), p75: Number(bench.p75),
          p50: Number(bench.p50), p25: Number(bench.p25),
        } : null,
        history: [...journey].reverse().map((j) => ({ accuracy: j.acc, test_title: j.test })),
        percentile,
      });
    }

    // ─── Next steps ────────────────────────────────────────────
    const nextSteps = [];
    const rootOpen = tree.find((t) => t.is_root_cause && t.status !== 'closed');
    if (rootOpen) {
      nextSteps.push({ icon: '📝', text: `${rootOpen.label} worksheet — root cause hai. Isse dependents bhi sudhrenge.`, action: 'generate_worksheet', wiswits_id: rootOpen.wiswits_id });
    }
    if (profile?.coaching_note) {
      nextSteps.push({ icon: '⏱', text: profile.coaching_note, action: 'coaching' });
    }
    if (strengths[0]) {
      nextSteps.push({ icon: '🧠', text: `${topicLabel(strengths[0].wiswits_id)} me strong ho (${strengths[0].accuracy}%) — application practice se aur upar jao.`, action: 'stretch' });
    }

    res.json({
      student: { id: student_id, name: nameFor(student_id) },
      headline: {
        current_avg: latest ? latest.acc : null,
        since_first_delta: latest && first ? Math.round(latest.acc - first.acc) : null,
        gaps_found: weakAreas.length,
        gaps_closed: gapsClosedCount,
        percentile: comparison?.position?.percentile ?? null,
      },
      journey,
      root_cause: { root_wiswits_id: featuredRootId, tree },
      recovery_history,
      profile: profile ? {
        pace: profile.pace, behaviour: profile.behaviour,
        silly_mistake_rate: profile.silly_mistake_rate, concept_gap_rate: profile.concept_gap_rate,
        guess_rate: profile.guess_rate, revision_rate: profile.revision_rate,
        coaching_note: profile.coaching_note,
        bloom,
        error_signature: errorSignature,
        strengths: strengths.map((s) => ({ wiswits_id: s.wiswits_id, label: topicLabel(s.wiswits_id), accuracy: Number(s.accuracy) })),
        gaps: gaps.map((g) => ({ wiswits_id: g.wiswits_id, label: topicLabel(g.wiswits_id), accuracy: Number(g.accuracy) })),
      } : null,
      comparison,
      next_steps: nextSteps,
    });
  } catch (err) {
    res.status(503).json({ error: 'database_unavailable', hint: 'run migrate + seed', detail: err.message });
  }
});

module.exports = router;
