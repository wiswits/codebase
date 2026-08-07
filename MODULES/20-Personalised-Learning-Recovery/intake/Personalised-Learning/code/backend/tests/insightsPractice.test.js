'use strict';

/**
 * Supertest coverage for alerts.js, insights.js, digest.js, practice.js —
 * mounted directly on a throwaway app (not app.js — per task instructions).
 * Uses real data from the seeded demo org 9001.
 */

require('dotenv').config();

const express = require('express');
const request = require('supertest');

const { context } = require('../src/middleware/context');
const alerts = require('../src/routes/alerts');
const insights = require('../src/routes/insights');
const digest = require('../src/routes/digest');
const practice = require('../src/routes/practice');
const db = require('../src/config/db');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(context);
  const api = express.Router();
  api.use(alerts);
  api.use(insights);
  api.use(digest);
  api.use(practice);
  app.use('/api/pl', api);
  return app;
}

const app = buildApp();
const ORG = '9001';
const asTeacher = (r) => r.set('x-role', 'teacher').set('x-org-id', ORG);
const asStudent = (r) => r.set('x-role', 'student').set('x-org-id', ORG);

let escalatedStudentId;
let anyTestId;
let anyStudentId;
let weakAreaStudentId; // has an open/in_recovery weak area, no practice cards yet

beforeAll(async () => {
  const [wa] = await db.query(
    `SELECT student_id FROM client_pl_weak_area WHERE org_id=9001
       AND (status='escalated' OR (status IN ('open','in_recovery') AND severity='critical')) LIMIT 1`
  );
  if (!wa) throw new Error('No escalated/critical weak area found for org 9001 — run npm run seed first.');
  escalatedStudentId = wa.student_id;

  const [t] = await db.query(
    `SELECT DISTINCT test_id FROM client_pl_attempt WHERE org_id=9001 AND status='evaluated' LIMIT 1`
  );
  anyTestId = t.test_id;

  const [s] = await db.query(`SELECT DISTINCT student_id FROM client_pl_attempt WHERE org_id=9001 LIMIT 1`);
  anyStudentId = s.student_id;

  const [w2] = await db.query(
    `SELECT student_id FROM client_pl_weak_area WHERE org_id=9001 AND status IN ('open','in_recovery') LIMIT 1`
  );
  weakAreaStudentId = w2 ? w2.student_id : anyStudentId;
});

afterAll(async () => {
  await db.close();
});

describe('GET /insights/attention', () => {
  it('returns real escalated / critical students', async () => {
    const res = await asTeacher(request(app).get('/api/pl/insights/attention'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(res.body.students.length).toBeGreaterThan(0);
    const found = res.body.students.find((s) => s.student_id === escalatedStudentId);
    expect(found).toBeTruthy();
    expect(found).toHaveProperty('name');
    expect(found).toHaveProperty('wiswits_id');
    expect(found).toHaveProperty('severity');
    expect(found).toHaveProperty('accuracy');
    expect(found).toHaveProperty('cycles_run');
  });
});

describe('GET /insights/reteach', () => {
  it('does not error against a real test, even with no class-wide misconception', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/insights/reteach?test_id=${anyTestId}`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reteach)).toBe(true);
  });

  it('400s without test_id', async () => {
    const res = await asTeacher(request(app).get('/api/pl/insights/reteach'));
    expect(res.status).toBe(400);
  });
});

describe('GET /insights/question-quality and /insights/qbank-gaps', () => {
  it('question-quality does not error (likely empty seed table)', async () => {
    const res = await asTeacher(request(app).get('/api/pl/insights/question-quality'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.flags)).toBe(true);
  });

  it('qbank-gaps does not error and returns a gaps array', async () => {
    const res = await asTeacher(request(app).get('/api/pl/insights/qbank-gaps?count=5'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.gaps)).toBe(true);
  }, 20000);
});

describe('GET /alerts', () => {
  it('lists alerts without erroring (reteach may or may not have inserted one)', async () => {
    const res = await asTeacher(request(app).get('/api/pl/alerts'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });
});

describe('GET /digest/student/:id — dignity rule', () => {
  it('preview payload has no rank/position language', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/digest/student/${anyStudentId}`));
    expect(res.status).toBe(200);
    const payload = res.body.preview;
    expect(payload).not.toHaveProperty('rank');
    expect(payload).not.toHaveProperty('position');
    const json = JSON.stringify(payload).toLowerCase();
    expect(json).not.toContain('rank');
    expect(json).not.toContain('leaderboard');
    expect(typeof payload.encouraging_line).toBe('string');
  });
});

describe('POST /digest/send + GET /digest/history/:student_id', () => {
  it('records a digest and it shows up in history', async () => {
    const send = await asTeacher(request(app).post('/api/pl/digest/send')).send({
      student_id: anyStudentId,
      parent_id: null,
      period_start: '2026-07-01',
      period_end: '2026-07-16',
      channel: 'app',
    });
    expect(send.status).toBe(201);
    expect(send.body).toHaveProperty('id');

    const hist = await asTeacher(request(app).get(`/api/pl/digest/history/${anyStudentId}`));
    expect(hist.status).toBe(200);
    expect(hist.body.digests.some((d) => d.id === send.body.id)).toBe(true);
  });
});

describe('GET /practice/next', () => {
  it('returns a question with a reason', async () => {
    const res = await asStudent(request(app).get(`/api/pl/practice/next?student_id=${weakAreaStudentId}`));
    expect(res.status).toBe(200);
    expect(res.body.question).toBeTruthy();
    expect(['spaced_repetition', 'weak_area', 'challenge']).toContain(res.body.reason);
    expect(res.body.target_wiswits_id).toBeTruthy();
  });
});

describe('POST /practice/response', () => {
  const questionId = 555000111; // synthetic, isolated from real qbank ids
  const wiswitsId = 'MATH10C01T02';

  // This suite writes directly to the live demo DB with no teardown (matching
  // the rest of this file); without resetting this specific synthetic card
  // first, re-running the suite accumulates repetitions across runs and
  // breaks the "first call → repetitions=1" assertion below.
  beforeAll(async () => {
    await db.query(
      `DELETE FROM client_pl_practice_card WHERE org_id=9001 AND student_id=? AND question_id=?`,
      [weakAreaStudentId, questionId]
    );
  });

  it('creates a practice_card on first call', async () => {
    const res = await asStudent(request(app).post('/api/pl/practice/response')).send({
      student_id: weakAreaStudentId, question_id: questionId, wiswits_id: wiswitsId,
      is_correct: true, time_sec: 40, est_time_sec: 90,
    });
    expect(res.status).toBe(200);
    expect(res.body.card).toBeTruthy();
    expect(res.body.card.repetitions).toBe(1);
  });

  it('updates the SAME card (no duplicate row) on a second response', async () => {
    const res = await asStudent(request(app).post('/api/pl/practice/response')).send({
      student_id: weakAreaStudentId, question_id: questionId, wiswits_id: wiswitsId,
      is_correct: true, time_sec: 30, est_time_sec: 90,
    });
    expect(res.status).toBe(200);
    expect(res.body.card.repetitions).toBe(2);

    const rows = await db.query(
      `SELECT COUNT(*) AS c FROM client_pl_practice_card WHERE org_id=9001 AND student_id=? AND question_id=?`,
      [weakAreaStudentId, questionId]
    );
    expect(rows[0].c).toBe(1);
  });

  it('shows up in /practice/due once due_at has passed (force due_at into the past)', async () => {
    await db.query(
      `UPDATE client_pl_practice_card SET due_at = DATE_SUB(NOW(), INTERVAL 1 DAY)
       WHERE org_id=9001 AND student_id=? AND question_id=?`,
      [weakAreaStudentId, questionId]
    );
    const res = await asStudent(request(app).get(`/api/pl/practice/due?student_id=${weakAreaStudentId}`));
    expect(res.status).toBe(200);
    expect(res.body.due.some((c) => c.question_id === questionId)).toBe(true);
  });
});

describe('GET /practice/stats and /practice/streak', () => {
  it('stats does not error and has the expected shape', async () => {
    const res = await asStudent(request(app).get(`/api/pl/practice/stats?student_id=${weakAreaStudentId}`));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cards_total');
    expect(res.body).toHaveProperty('cards_due');
    expect(res.body).toHaveProperty('cards_mastered');
    expect(res.body).toHaveProperty('avg_ease_factor');
  });

  it('streak does not error and has the expected shape', async () => {
    const res = await asStudent(request(app).get(`/api/pl/practice/streak?student_id=${weakAreaStudentId}`));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current_streak');
    expect(res.body).toHaveProperty('longest_streak_seen');
  });
});

describe('permission gate', () => {
  it('student blocked from teacher-only /insights/attention', async () => {
    const res = await request(app)
      .get('/api/pl/insights/attention')
      .set('x-role', 'student')
      .set('x-org-id', ORG);
    expect(res.status).toBe(403);
  });
});
