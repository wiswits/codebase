'use strict';

/**
 * Supertest coverage for attemptAnalytics.js + testQuality.js, mounted
 * directly on a throwaway app (not app.js — per task instructions).
 * Uses real attempt_id / test_id pulled live from the seeded demo org 9001.
 */

require('dotenv').config();

const express = require('express');
const request = require('supertest');

const { context } = require('../src/middleware/context');
const attemptAnalytics = require('../src/routes/attemptAnalytics');
const testQuality = require('../src/routes/testQuality');
const db = require('../src/config/db');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(context);
  const api = express.Router();
  api.use(attemptAnalytics);
  api.use(testQuality);
  app.use('/api/pl', api);
  return app;
}

const app = buildApp();
const asTeacher = (r) => r.set('x-role', 'teacher').set('x-org-id', '9001');

let attempt_id;
let test_id;
let student_id;

beforeAll(async () => {
  const [a] = await db.query(
    `SELECT id, test_id, student_id FROM client_pl_attempt WHERE org_id=9001 AND status='evaluated' LIMIT 1`
  );
  if (!a) throw new Error('No evaluated attempt found for org 9001 — run npm run seed first.');
  attempt_id = a.id;
  test_id = a.test_id;
  student_id = a.student_id;
});

afterAll(async () => {
  await db.close();
});

describe('GET /analytics/attempt/:id/time', () => {
  it('returns behaviour tallies + a plain-language insight', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/attempt/${attempt_id}/time`));
    expect(res.status).toBe(200);
    expect(res.body.tally).toBeInstanceOf(Object);
    expect(Object.keys(res.body.tally).length).toBeGreaterThan(0);
    expect(typeof res.body.insight).toBe('string');
    expect(Array.isArray(res.body.per_question)).toBe(true);
  });
});

describe('GET /analytics/attempt/:id/behaviour', () => {
  it('returns tally, dominant_pattern, coaching_hint', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/attempt/${attempt_id}/behaviour`));
    expect(res.status).toBe(200);
    expect(res.body.tally).toBeInstanceOf(Object);
    expect(typeof res.body.dominant_pattern).toBe('string');
    expect(typeof res.body.coaching_hint).toBe('string');
  });
});

describe('GET /analytics/attempt/:id/comparison — dignity-safe', () => {
  it('has no rank key anywhere in the JSON', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/attempt/${attempt_id}/comparison`));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/"rank"/i);
    expect(res.body.position).toBeDefined();
    expect(res.body.position.percentile).toBeDefined();
  });
});

describe('GET /analytics/attempt/:id — 404 for foreign attempt', () => {
  it('returns 404 when attempt does not belong to org', async () => {
    const res = await request(app)
      .get(`/api/pl/analytics/attempt/999999999/questions`)
      .set('x-role', 'teacher').set('x-org-id', '9001');
    expect(res.status).toBe(404);
  });
});

describe('student can only see their own attempt', () => {
  it('403s a different student', async () => {
    const res = await request(app)
      .get(`/api/pl/analytics/attempt/${attempt_id}`)
      .set('x-role', 'student').set('x-org-id', '9001').set('x-user-id', String(student_id + 1));
    expect(res.status).toBe(403);
  });
  it('200s the owning student', async () => {
    const res = await request(app)
      .get(`/api/pl/analytics/attempt/${attempt_id}`)
      .set('x-role', 'student').set('x-org-id', '9001').set('x-user-id', String(student_id));
    expect(res.status).toBe(200);
  });
});

describe('GET /analytics/test/:id/quality', () => {
  it('returns a flags array', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/test/${test_id}/quality`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.flags)).toBe(true);
  });
});

describe('GET /analytics/test/:id/distractors + /clusters', () => {
  it('returns insights array', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/test/${test_id}/distractors`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.insights)).toBe(true);
  });
  it('returns clusters array', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/test/${test_id}/clusters`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clusters)).toBe(true);
  });
});

describe('GET /analytics/test/:id/distribution', () => {
  it('returns 10-point bins summing to attempted_count', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/test/${test_id}/distribution`));
    expect(res.status).toBe(200);
    expect(res.body.bins.length).toBe(10);
    const sum = res.body.bins.reduce((a, b) => a + b.count, 0);
    expect(sum).toBe(res.body.attempted_count);
  });
});

describe('GET /analytics/test/:id/toppers — dignity-safe', () => {
  it('has no name/student_id keys, score only', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/test/${test_id}/toppers?limit=5`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.scores)).toBe(true);
    expect(res.body.scores.length).toBeLessThanOrEqual(5);
    expect(JSON.stringify(res.body)).not.toMatch(/name|student_id/i);
  });
});

describe('GET /weak-areas/heatmap', () => {
  it('returns a topic x severity-band matrix', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/weak-areas/heatmap?scope=class`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.matrix)).toBe(true);
    expect(res.body.bands).toEqual(
      expect.arrayContaining(['critical', 'weak', 'borderline', 'strong', 'mastered'])
    );
  });
});

describe('POST /weak-areas/recompute', () => {
  it('processes a demo batch and reports counts', async () => {
    const res = await asTeacher(request(app).post('/api/pl/weak-areas/recompute')).send({ student_id });
    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(1);
    expect(typeof res.body.candidates_found).toBe('number');
  });
});
