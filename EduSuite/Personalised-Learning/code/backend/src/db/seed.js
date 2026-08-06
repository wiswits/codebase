'use strict';

/**
 * Self-contained demo seed for the PL module.
 *
 * ⚠️ Writes ONLY to `client_pl_*` tables, all scoped to PL_DEMO_ORG_ID (9001),
 *    a dedicated demo tenant. Shared platform tables (client_students,
 *    client_users, …) are NEVER touched. Fully reversible:
 *      node src/db/seed.js --clean
 *
 * Produces a coherent WISWITS Loop dataset:
 *   • 500 students × 6 tests (T1..T6), rising scores (61% → 81% story)
 *   • ~60k responses with time/behaviour telemetry
 *   • topic scores, weak areas (+ root cause), recovery cycles (~72% closed),
 *     learning profiles, benchmarks — so every analytics endpoint returns real
 *     numbers that match the principal hero screen.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { TOPICS, DIFFICULTIES, BLOOMS, DISTRACTORS, rng } = require('./fixtures');
const { detectFromTopics } = require('../algorithms/weakAreaDetector');
const { findRootCauses } = require('../algorithms/rootCause');

const ORG = Number(process.env.PL_DEMO_ORG_ID || 9001);
const SUBJECT = 9001; // demo Maths subject
const N_STUDENTS = Number(process.env.SEED_STUDENTS || 500);
const STUDENT_BASE = 900000;
const SECTIONS = ['10-A', '10-B', '10-C', '9-A', '9-B'];
const TEST_MEANS = [61, 64, 69, 73, 77, 81]; // class avg per test (the proof curve)
const NOW = new Date('2026-07-16T00:00:00Z');

const PL_TABLES = [
  'client_pl_response', 'client_pl_attempt', 'client_pl_test_question', 'client_pl_question_map',
  'client_pl_test', 'client_pl_assignment_student', 'client_pl_assignment',
  'client_pl_topic_score', 'client_pl_bloom_score', 'client_pl_skill_score',
  'client_pl_weak_area', 'client_pl_profile', 'client_pl_worksheet',
  'client_pl_recovery_cycle', 'client_pl_practice_card', 'client_pl_question_stat',
  'client_pl_class_insight', 'client_pl_alert', 'client_pl_digest', 'client_pl_benchmark',
];

function daysAgo(n) {
  return new Date(NOW.getTime() - n * 86400000).toISOString().slice(0, 19).replace('T', ' ');
}
function clampPct(x) {
  return Math.max(2, Math.min(99, Math.round(x)));
}

async function main() {
  const clean = process.argv.includes('--clean');
  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, connectionLimit: 5,
  });

  console.log(`→ cleaning demo org ${ORG} ...`);
  for (const t of PL_TABLES) await pool.query(`DELETE FROM ${t} WHERE org_id = ?`, [ORG]);
  if (clean) {
    console.log('✓ cleaned. (--clean) exiting without reseeding.');
    await pool.end();
    return;
  }

  // ─── Tests + test questions (6 tests × 20 Q) ────────────────
  console.log('→ tests + questions ...');
  const testIds = [];
  const tqByTest = {}; // test_id → [{id, wiswits_id, difficulty, bloom, est}]
  for (let ti = 0; ti < 6; ti++) {
    const [res] = await pool.query(
      `INSERT INTO client_pl_test (org_id, title, subject_id, class_no, type, source, mode,
         total_marks, total_questions, duration_min, status, created_by, created_at)
       VALUES (?, ?, ?, 10, 'unit', 'offline', 'offline', 40, 20, 60, 'closed', 1, ?)`,
      [ORG, `Unit Test ${ti + 1}`, SUBJECT, daysAgo((6 - ti) * 20)]
    );
    const testId = res.insertId;
    testIds.push(testId);
    tqByTest[testId] = [];
    const rows = [];
    for (let q = 0; q < 20; q++) {
      const topic = TOPICS[q % TOPICS.length];
      const difficulty = DIFFICULTIES[q % 3];
      const bloom = BLOOMS[q % 4];
      const est = { easy: 60, medium: 90, hard: 150 }[difficulty];
      rows.push([ORG, testId, q + 1, 1000 + ti * 20 + q, topic.id, bloom, difficulty, est, 2,
        JSON.stringify({ stem: `${topic.name} Q${q + 1}`, correct: 'A' })]);
    }
    await pool.query(
      `INSERT INTO client_pl_test_question (org_id, test_id, seq, question_id, wiswits_id, bloom, difficulty, est_time_sec, marks, question_snapshot_json)
       VALUES ?`, [rows]
    );
    const [tqs] = await pool.query(
      `SELECT id, seq, question_id, wiswits_id, bloom, difficulty, est_time_sec FROM client_pl_test_question WHERE test_id = ? ORDER BY seq`, [testId]);
    tqByTest[testId] = tqs;
  }

  // ─── Attempts + responses ───────────────────────────────────
  console.log(`→ ${N_STUDENTS} students × 6 tests: attempts + responses ...`);
  let respBuf = [];
  let respCount = 0;
  async function flush() {
    if (!respBuf.length) return;
    await pool.query(
      `INSERT INTO client_pl_response (org_id, attempt_id, test_question_id, question_id, wiswits_id, bloom, difficulty,
         answer_json, is_correct, marks_awarded, time_sec, time_ratio, visits, changed_count, first_answer, final_answer, marked_review, answered_at)
       VALUES ?`, [respBuf]
    );
    respCount += respBuf.length;
    respBuf = [];
  }

  for (let s = 0; s < N_STUDENTS; s++) {
    const studentId = STUDENT_BASE + s + 1;
    const rand = rng(studentId);
    // each student has a baseline ability + a per-test improvement
    const ability = 0.35 + rand() * 0.5; // 0.35..0.85
    const archetype = ['rusher', 'overthinker', 'balanced', 'gives_up', 'balanced'][s % 5];

    for (let ti = 0; ti < 6; ti++) {
      const testId = testIds[ti];
      const drift = (TEST_MEANS[ti] - 61) / 100; // class-wide lift over time
      const pCorrect = Math.max(0.1, Math.min(0.97, ability + drift + (rand() - 0.5) * 0.15));

      const tqs = tqByTest[testId];
      let correct = 0, wrong = 0, skipped = 0, score = 0, timeTaken = 0;
      const respRows = [];
      for (const tq of tqs) {
        const isCorrect = rand() < pCorrect ? 1 : 0;
        // behaviour-flavoured timing
        let ratio;
        if (archetype === 'rusher') ratio = 0.3 + rand() * 0.4;
        else if (archetype === 'overthinker') ratio = 1.1 + rand() * 1.2;
        else ratio = 0.6 + rand() * 0.9;
        const timeSec = Math.round(tq.est_time_sec * ratio);
        const changed = archetype === 'overthinker' ? Math.floor(rand() * 4) : Math.floor(rand() * 2);
        const first = isCorrect && archetype === 'overthinker' && rand() < 0.4 ? 'A' : (isCorrect ? 'A' : 'B');
        const finalAns = isCorrect ? 'A' : ['B', 'C', 'D'][Math.floor(rand() * 3)];
        if (isCorrect) { correct++; score += 2; } else { wrong++; }
        timeTaken += timeSec;
        respRows.push({ tq, isCorrect, timeSec, ratio, changed, first, finalAns });
      }

      const pct = clampPct((score / 40) * 100);
      const [ares] = await pool.query(
        `INSERT INTO client_pl_attempt (org_id, test_id, student_id, attempt_no, started_at, submitted_at, evaluated_at,
           score, max_score, percentage, correct_count, wrong_count, skipped_count, time_taken_sec, time_efficiency,
           status, is_offline_entry, entered_by, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, 40, ?, ?, ?, ?, ?, ?, 'evaluated', 1, 1, ?)`,
        [ORG, testId, studentId, daysAgo((6 - ti) * 20), daysAgo((6 - ti) * 20), daysAgo((6 - ti) * 20),
         score, pct, correct, wrong, skipped, timeTaken, (timeTaken / (20 * 90)).toFixed(2), daysAgo((6 - ti) * 20)]
      );
      const attemptId = ares.insertId;

      for (const r of respRows) {
        respBuf.push([ORG, attemptId, r.tq.id, r.tq.question_id, r.tq.wiswits_id, r.tq.bloom, r.tq.difficulty,
          JSON.stringify({ selected: r.finalAns }), r.isCorrect, r.isCorrect ? 2 : 0, r.timeSec, r.ratio.toFixed(3),
          1 + Math.floor(r.changed / 2), r.changed, r.first, r.finalAns, 0, daysAgo((6 - ti) * 20)]);
      }
      if (respBuf.length >= 2000) await flush();
    }
  }
  await flush();
  console.log(`  ${respCount} responses inserted.`);

  // ─── Topic scores → weak areas (+ root cause) → cycles ──────
  // ⚠️ Derived from the REAL response rows just inserted (not a separate
  //    random pass) so the Evidence API ("why weak?") always has matching
  //    proof — client_pl_response rows for this student+topic that back the
  //    accuracy number shown.
  console.log('→ aggregating real response data into topic scores ...');
  const { mean: meanOf, variance: varianceOf } = require('../algorithms/util');
  const [allResp] = await pool.query(
    `SELECT a.student_id, r.wiswits_id, r.difficulty, r.is_correct, r.time_sec, a.submitted_at
     FROM client_pl_response r JOIN client_pl_attempt a ON a.id = r.attempt_id
     WHERE r.org_id = ? AND a.is_offline_entry = 1`, [ORG]);

  const byStudentTopic = {}; // student_id -> wiswits_id -> [{is_correct,difficulty,time_sec,submitted_at}]
  for (const r of allResp) {
    const s = (byStudentTopic[r.student_id] ||= {});
    (s[r.wiswits_id] ||= []).push(r);
  }

  console.log('→ topic scores, weak areas, recovery cycles, profiles ...');
  let gapsDetected = 0, gapsClosed = 0;
  const graph = require('../external/mockAdapters').curriculumApi;
  const prereq = await graph.getPrerequisiteGraph();

  for (let s = 0; s < N_STUDENTS; s++) {
    const studentId = STUDENT_BASE + s + 1;
    const rand = rng(studentId * 7);
    const section = SECTIONS[s % SECTIONS.length];
    const topicMap = byStudentTopic[studentId] || {};

    // per-topic accuracy computed FROM the real responses for this student
    const topicRows = [];
    const tScores = [];
    for (const topic of TOPICS) {
      const rows = topicMap[topic.id] || [];
      const attempted = rows.length || 1;
      const correct = rows.reduce((a, r) => a + r.is_correct, 0);
      const acc = clampPct((correct / attempted) * 100);
      const byDiff = (d) => {
        const dr = rows.filter((r) => r.difficulty === d);
        return dr.length ? clampPct((dr.reduce((a, r) => a + r.is_correct, 0) / dr.length) * 100) : acc;
      };
      const avgTime = rows.length ? meanOf(rows.map((r) => r.time_sec || 0)) : 90;
      const varAcc = rows.length > 1 ? varianceOf(rows.map((r) => r.is_correct * 100)) / 100 : 8; // scaled to algorithm's expected 0..40 range
      const lastAt = rows.length ? rows.reduce((a, r) => (r.submitted_at > a ? r.submitted_at : a), rows[0].submitted_at) : daysAgo(2);

      topicRows.push([ORG, studentId, topic.id, SUBJECT, attempted, correct, 0, acc,
        avgTime.toFixed(2), 1.0, byDiff('easy'), byDiff('medium'), byDiff('hard'), varAcc.toFixed(3),
        daysAgo(120), lastAt, attempted, acc > 70 ? 'improving' : 'stable']);
      tScores.push({ wiswits_id: topic.id, subject_id: SUBJECT, accuracy: acc, attempted,
        last_attempt_at: lastAt, variance: varAcc, easy_acc: byDiff('easy'), medium_acc: byDiff('medium'), hard_acc: byDiff('hard') });
    }
    await pool.query(
      `INSERT INTO client_pl_topic_score (org_id, student_id, wiswits_id, subject_id, attempted, correct, skipped,
         accuracy, avg_time_sec, avg_time_ratio, easy_acc, medium_acc, hard_acc, variance, first_attempt_at, last_attempt_at, sample_size, trend)
       VALUES ?`, [topicRows]);

    // weak detection + root cause
    const { candidates } = detectFromTopics(tScores, NOW);
    const weak = findRootCauses(candidates, prereq);

    for (const wa of weak) {
      const [wres] = await pool.query(
        `INSERT INTO client_pl_weak_area (org_id, student_id, wiswits_id, subject_id, severity, accuracy, sample_size,
           confidence, is_root_cause, root_wiswits_id, depth_from_root, dominant_error_type, dominant_bloom_gap, detected_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'apply', ?, 'open')`,
        [ORG, studentId, wa.wiswits_id, SUBJECT, wa.severity, wa.accuracy, wa.sample_size, wa.confidence,
         wa.is_root_cause ? 1 : 0, wa.root_wiswits_id, wa.depth_from_root,
         DISTRACTORS[Math.floor(rand() * DISTRACTORS.length)], daysAgo(30)]
      );
      const weakAreaId = wres.insertId;
      gapsDetected++;

      // recovery cycle: ~72% closed, ~15% improved, ~9% no_change, ~4% worsened
      const roll = rand();
      const before = wa.accuracy;
      let outcome, after, cycles, closedStatus;
      if (roll < 0.72) { outcome = 'closed'; after = clampPct(70 + rand() * 20); cycles = 1 + Math.floor(rand() * 3); closedStatus = 'closed'; gapsClosed++; }
      else if (roll < 0.87) { outcome = 'improved'; after = clampPct(before + 15 + rand() * 10); cycles = 2; closedStatus = 'in_recovery'; }
      else if (roll < 0.96) { outcome = 'no_change'; after = clampPct(before + rand() * 5); cycles = 2; closedStatus = 'in_recovery'; }
      else { outcome = 'worsened'; after = clampPct(before - 5 - rand() * 8); cycles = 3; closedStatus = 'escalated'; }

      const delta = after - before;
      const days = 8 + Math.floor(rand() * 20);
      await pool.query(
        `INSERT INTO client_pl_recovery_cycle (org_id, student_id, weak_area_id, wiswits_id, cycle_no, detected_at,
           detected_accuracy, retest_accuracy, retest_at, delta, outcome, days_to_close, closed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ORG, studentId, weakAreaId, wa.wiswits_id, cycles, daysAgo(30), before, after, daysAgo(30 - days),
         delta, outcome, outcome === 'closed' ? days : null, outcome === 'closed' ? daysAgo(30 - days) : null, daysAgo(30)]
      );
      await pool.query(`UPDATE client_pl_weak_area SET status = ?, closed_at = ? WHERE id = ?`,
        [closedStatus, outcome === 'closed' ? daysAgo(30 - days) : null, weakAreaId]);
    }

    // learning profile
    const archetype = ['rusher', 'overthinker', 'balanced', 'gives_up', 'balanced'][s % 5];
    await pool.query(
      `INSERT INTO client_pl_profile (org_id, student_id, subject_id, pace, behaviour, consistency_score, improvement_trend,
         silly_mistake_rate, concept_gap_rate, guess_rate, revision_rate, error_signature_json, coaching_note, computed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ORG, studentId, SUBJECT, archetype === 'rusher' ? 'fast' : archetype === 'overthinker' ? 'needs_time' : 'moderate',
       archetype, 70 + rand() * 25, (TEST_MEANS[5] - TEST_MEANS[0]) / 6,
       archetype === 'rusher' ? 44 : 18, archetype === 'gives_up' ? 40 : 28, archetype === 'gives_up' ? 30 : 8, 20,
       JSON.stringify({ sign_error: 34, arithmetic_slip: 22, incomplete_procedure: 18 }),
       archetype === 'rusher' ? 'Jaldbaazi ki galtiyan. Accuracy pe kaam karao.' : 'Concept gaps pe seedha kaam.', daysAgo(1)]
    );
  }

  // ─── Benchmarks (per test, class scope) ─────────────────────
  console.log('→ benchmarks ...');
  for (let ti = 0; ti < 6; ti++) {
    await pool.query(
      `INSERT INTO client_pl_benchmark (org_id, scope, scope_id, subject_id, test_id, avg_accuracy, median_accuracy,
         topper_accuracy, p90, p75, p50, p25, sample_size)
       VALUES (?, 'class', '10', ?, ?, ?, ?, 94, ?, ?, ?, ?, ?)`,
      [ORG, SUBJECT, testIds[ti], TEST_MEANS[ti], TEST_MEANS[ti] + 2, TEST_MEANS[ti] + 20, TEST_MEANS[ti] + 12,
       TEST_MEANS[ti] + 2, TEST_MEANS[ti] - 15, N_STUDENTS]
    );
  }

  console.log('');
  console.log(`✓ SEED COMPLETE (org ${ORG})`);
  console.log(`  students: ${N_STUDENTS} · responses: ${respCount}`);
  console.log(`  gaps detected: ${gapsDetected} · closed: ${gapsClosed} (${Math.round((gapsClosed / gapsDetected) * 100)}%)`);
  console.log(`  → GET /api/pl/cycles/stats will now return real numbers.`);
  await pool.end();
}

main().catch((e) => {
  console.error('✗ seed failed:', e);
  process.exit(1);
});
