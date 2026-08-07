'use strict';

/**
 * /api/pl/analyze/* — live, DB-free endpoints that run the algorithm brain on
 * posted data. These make the module demoable with curl and double as the
 * integration surface tested in analyze.test.js.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const {
  weakAreaDetector,
  rootCause,
  behaviour,
  distractor,
  worksheet,
  benchmark,
  sm2,
} = require('../algorithms');
const external = require('../external');

// ─── Behaviour: silly vs concept on a set of responses ────────
router.post('/analyze/behaviour', requirePermission('teacher', 'principal'), (req, res) => {
  const responses = req.body.responses || [];
  const profile = behaviour.buildBehaviourProfile(responses);
  const perResponse = responses.map((r) => ({
    wiswits_id: r.wiswits_id,
    class: behaviour.classifyResponse(r),
  }));
  res.json({ profile, per_response: perResponse });
});

// ─── Distractor / misconception analysis for one question ─────
router.post('/analyze/distractor', requirePermission('teacher', 'principal'), (req, res) => {
  const { question, responses, discrimination_index = null } = req.body;
  const out = distractor.analyzeQuestion(question, responses || [], discrimination_index);
  res.json(out);
});

// ─── Weak-area detection + root cause over topic scores ───────
router.post('/analyze/weak-areas', requirePermission('teacher', 'principal'), async (req, res) => {
  const topics = req.body.topics || [];
  const now = req.body.now ? new Date(req.body.now) : new Date();
  const { candidates, toDecay, toClose } = weakAreaDetector.detectFromTopics(topics, now);
  const graph = await external.curriculumApi.getPrerequisiteGraph();
  const withRoots = rootCause.findRootCauses(candidates, graph);
  res.json({ weak_areas: withRoots, decayed: toDecay, closed: toClose });
});

// ─── Worksheet plan (root-first, ladder, behaviour override) ──
router.post('/analyze/worksheet-plan', requirePermission('teacher', 'principal'), (req, res) => {
  const { weak_areas = [], profile = {}, opts = {} } = req.body;
  const plan = worksheet.planWorksheet(weak_areas, profile, opts);
  res.json(plan || { message: 'no open weak areas' });
});

// ─── Comparison narrative (dignity-safe, no rank) ─────────────
router.post('/analyze/comparison', requirePermission('teacher', 'principal', 'parent', 'student'), (req, res) => {
  res.json(benchmark.buildComparison(req.body));
});

// ─── SM-2 next scheduling for a practice card ─────────────────
router.post('/analyze/sm2', requirePermission('teacher', 'student'), (req, res) => {
  const { card, response } = req.body;
  const quality = sm2.responseToQuality(response);
  res.json({ quality, next: sm2.sm2(card, quality) });
});

module.exports = router;
