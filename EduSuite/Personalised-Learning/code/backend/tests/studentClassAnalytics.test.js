'use strict';

/**
 * Supertest coverage for studentAnalyticsExtra.js + classSchoolAnalytics.js,
 * mounted directly on a throwaway app (not app.js — per task instructions).
 * Uses real student ids pulled live from the seeded demo org 9001.
 */

require('dotenv').config();

const express = require('express');
const request = require('supertest');

const { context } = require('../src/middleware/context');
const studentAnalyticsExtra = require('../src/routes/studentAnalyticsExtra');
const classSchoolAnalytics = require('../src/routes/classSchoolAnalytics');
const db = require('../src/config/db');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(context);
  const api = express.Router();
  api.use(studentAnalyticsExtra);
  api.use(classSchoolAnalytics);
  app.use('/api/pl', api);
  return app;
}

const app = buildApp();
const asTeacher = (r) => r.set('x-role', 'teacher').set('x-org-id', '9001');

let student_id;

beforeAll(async () => {
  const [s] = await db.query(
    `SELECT student_id FROM client_pl_topic_score WHERE org_id=9001 LIMIT 1`
  );
  if (!s) throw new Error('No topic scores found for org 9001 — run npm run seed first.');
  student_id = s.student_id;
});

afterAll(async () => {
  await db.close();
});

describe('GET /analytics/student/:id — overview', () => {
  it('returns topics, weak area count, latest attempt', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/student/${student_id}`));
    expect(res.status).toBe(200);
    expect(res.body.student.id).toBe(student_id);
    expect(Array.isArray(res.body.topics)).toBe(true);
    expect(typeof res.body.open_weak_area_count).toBe('number');
  });
});

describe('GET /analytics/student/:id/progress', () => {
  it('returns a journey array', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/student/${student_id}/progress`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.journey)).toBe(true);
  });
});

describe('GET /analytics/student/:id/topics', () => {
  it('returns real topic mastery rows for the seeded student', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/student/${student_id}/topics`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.topics)).toBe(true);
    expect(res.body.topics.length).toBeGreaterThan(0);
    const t = res.body.topics[0];
    expect(typeof t.accuracy).toBe('number');
    expect(t.difficulty_breakdown).toBeDefined();
  });
});

describe('GET /analytics/student/:id/bloom', () => {
  it('returns live bloom accuracy data', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/student/${student_id}/bloom`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bloom)).toBe(true);
    expect(res.body.bloom.length).toBeGreaterThan(0);
    expect(typeof res.body.bloom[0].accuracy).toBe('number');
  });
});

describe('GET /analytics/student/:id/errors', () => {
  it('returns error signature data', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/student/${student_id}/errors`));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.error_signature)).toBe(true);
  });
});

describe('GET /analytics/student/:id/behaviour', () => {
  it('returns profile fields, or 404 with a recompute hint if none yet', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/student/${student_id}/behaviour`));
    expect([200, 404]).toContain(res.status);
    if (res.status === 404) {
      expect(res.body.hint).toMatch(/recompute/);
    } else {
      expect(res.body).toHaveProperty('pace');
    }
  });
});

describe('GET /analytics/student/:id/comparison — dignity-safe', () => {
  it('has no rank key anywhere in the JSON', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/analytics/student/${student_id}/comparison`));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/"rank"/i);
  });
});

describe('student self-access only', () => {
  it('403s a different student id', async () => {
    const res = await request(app)
      .get(`/api/pl/analytics/student/${student_id}`)
      .set('x-role', 'student').set('x-org-id', '9001').set('x-user-id', String(student_id + 1));
    expect(res.status).toBe(403);
  });
  it('200s the owning student', async () => {
    const res = await request(app)
      .get(`/api/pl/analytics/student/${student_id}`)
      .set('x-role', 'student').set('x-org-id', '9001').set('x-user-id', String(student_id));
    expect(res.status).toBe(200);
  });
});

describe('class analytics', () => {
  it('GET /analytics/class/:id returns a non-error health payload', async () => {
    const res = await asTeacher(request(app).get('/api/pl/analytics/class/10'));
    expect(res.status).toBe(200);
    expect(typeof res.body.student_count).toBe('number');
  });

  it('GET /analytics/class/:id/heatmap returns a students x topics grid', async () => {
    const res = await asTeacher(request(app).get('/api/pl/analytics/class/10/heatmap'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(Array.isArray(res.body.topics)).toBe(true);
    expect(Array.isArray(res.body.cells)).toBe(true);
  });

  it('GET /analytics/class/:id/trend returns a points curve', async () => {
    const res = await asTeacher(request(app).get('/api/pl/analytics/class/10/trend'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.points)).toBe(true);
  });
});

describe('school analytics', () => {
  it('GET /analytics/school returns a non-error summary', async () => {
    const res = await asTeacher(request(app).get('/api/pl/analytics/school'));
    expect(res.status).toBe(200);
    expect(typeof res.body.total_students).toBe('number');
  });

  it('GET /analytics/school/subjects returns a one-entry array (single-subject seed)', async () => {
    const res = await asTeacher(request(app).get('/api/pl/analytics/school/subjects'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.subjects)).toBe(true);
    expect(res.body.subjects.length).toBeGreaterThan(0);
    expect(res.body.subjects[0]).toHaveProperty('avg_accuracy');
    expect(res.body.subjects[0]).toHaveProperty('close_rate');
  });
});
