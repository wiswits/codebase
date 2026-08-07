'use strict';

/**
 * /api/pl/profile/* — ALGORITHM 3 service layer (learning profile persistence).
 *
 * "Galat" ek jawab hai. "Kyun galat" ek diagnosis hai.
 * The pure core (buildBehaviourProfile, errorSignature) lives in
 * algorithms/behaviour.js; this file pulls responses from the DB, calls it,
 * and upserts client_pl_profile.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { emit } = require('../lib/events');
const behaviour = require('../algorithms/behaviour');

const NINETY_DAYS_MS = 90 * 86400000;

// ─── GET /profile/student/:id ───────────────────────────────────
router.get('/profile/student/:id', requirePermission('teacher', 'principal', 'student', 'parent'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);
  const subject_id = Number(req.query.subject_id || 9001);

  const [profile] = await db.query(
    `SELECT * FROM client_pl_profile WHERE org_id=:org_id AND student_id=:student_id AND subject_id=:subject_id`,
    { org_id, student_id, subject_id }
  );
  if (!profile) {
    return res.status(404).json({
      error: 'profile_not_found',
      hint: 'No learning profile yet for this student/subject — call POST /api/pl/profile/recompute first.',
      student_id, subject_id,
    });
  }
  res.json(profile);
});

// ─── POST /profile/recompute ────────────────────────────────────
router.post('/profile/recompute', requirePermission('teacher', 'principal'), async (req, res) => {
  const org_id = req.ctx.org_id;
  const { student_id, subject_id = 9001 } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id_required' });

  // Pull graded responses (join attempt for recency + test_question for est_time/snapshot).
  const rows = await db.query(
    `SELECT r.wiswits_id, r.difficulty, r.is_correct, r.time_sec, r.changed_count, r.visits,
            r.first_answer, r.final_answer, tq.est_time_sec, tq.question_snapshot_json, a.submitted_at
     FROM client_pl_response r
     JOIN client_pl_attempt a ON a.id = r.attempt_id
     JOIN client_pl_test_question tq ON tq.id = r.test_question_id
     WHERE a.org_id=:org_id AND a.student_id=:student_id AND r.is_correct IS NOT NULL
     ORDER BY a.submitted_at DESC LIMIT 2000`,
    { org_id, student_id }
  );
  if (!rows.length) {
    return res.status(400).json({ error: 'no_responses', hint: 'Student has no graded responses yet — nothing to compute a profile from.' });
  }

  // Prefer the last ~90 days; fall back to all available if too sparse (demo data spans months).
  const now = Date.now();
  let windowed = rows.filter((r) => r.submitted_at && (now - new Date(r.submitted_at).getTime()) <= NINETY_DAYS_MS);
  if (windowed.length < 10) windowed = rows;

  const responses = windowed.map((r) => {
    let correctKey = null;
    let distractor_reason = null;
    try {
      const snap = typeof r.question_snapshot_json === 'string' ? JSON.parse(r.question_snapshot_json) : r.question_snapshot_json;
      correctKey = snap?.correct || null;
      if (!r.is_correct && Array.isArray(snap?.options)) {
        const opt = snap.options.find((o) => o.key === r.final_answer);
        distractor_reason = opt?.distractor_reason || null;
      }
    } catch (_) { /* snapshot missing/unparseable — best effort */ }

    return {
      is_correct: !!r.is_correct,
      time_sec: r.time_sec || 0,
      est_time_sec: r.est_time_sec || 90,
      difficulty: r.difficulty,
      changed_count: r.changed_count || 0,
      visits: r.visits || 0,
      first_answer: r.first_answer,
      final_answer: r.final_answer,
      first_correct: correctKey ? r.first_answer === correctKey : false,
      distractor_reason,
    };
  });

  const behaviourProfile = behaviour.buildBehaviourProfile(responses);
  const signature = behaviour.errorSignature(responses);

  await db.query(
    `INSERT INTO client_pl_profile
       (org_id, student_id, subject_id, pace, behaviour, silly_mistake_rate, concept_gap_rate,
        guess_rate, revision_rate, error_signature_json, coaching_note, computed_at)
     VALUES (:org_id, :student_id, :subject_id, :pace, :behaviour, :silly, :concept,
        :guess, :revision, :sig, :note, NOW())
     ON DUPLICATE KEY UPDATE
       pace=:pace, behaviour=:behaviour, silly_mistake_rate=:silly, concept_gap_rate=:concept,
       guess_rate=:guess, revision_rate=:revision, error_signature_json=:sig, coaching_note=:note, computed_at=NOW()`,
    {
      org_id, student_id, subject_id,
      pace: behaviourProfile.pace,
      behaviour: behaviourProfile.behaviour,
      silly: behaviourProfile.silly_mistake_rate,
      concept: behaviourProfile.concept_gap_rate,
      guess: behaviourProfile.guess_rate,
      revision: behaviourProfile.revision_rate,
      sig: JSON.stringify(signature),
      note: behaviourProfile.coaching_note,
    }
  );

  emit('pl.profile_updated', { org_id, student_id, subject_id, behaviour: behaviourProfile.behaviour, pace: behaviourProfile.pace });

  const [updated] = await db.query(
    `SELECT * FROM client_pl_profile WHERE org_id=:org_id AND student_id=:student_id AND subject_id=:subject_id`,
    { org_id, student_id, subject_id }
  );
  res.json(updated);
});

module.exports = router;
