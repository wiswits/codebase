'use strict';

/**
 * Supertest coverage for widgetsExtra.js — mounted directly on a throwaway
 * app (not app.js, per task instructions). Uses real seeded student ids
 * from org 9001.
 */

require('dotenv').config();

const express = require('express');
const request = require('supertest');

const { context } = require('../src/middleware/context');
const widgetsExtra = require('../src/routes/widgetsExtra');
const db = require('../src/config/db');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(context);
  const api = express.Router();
  api.use(widgetsExtra);
  app.use('/api/pl', api);
  return app;
}

const app = buildApp();
const asRole = (r, role) => r.set('x-role', role).set('x-org-id', '9001');

let studentWithWeakArea; // has open/in_recovery weak areas + practice cards + escalated
let studentWithWorksheet; // has a pending worksheet

beforeAll(async () => {
  const [wa] = await db.query(
    `SELECT student_id FROM client_pl_weak_area WHERE org_id=9001 AND status IN ('open','in_recovery') GROUP BY student_id LIMIT 1`
  );
  if (!wa) throw new Error('No student with open weak areas — run npm run seed first.');
  studentWithWeakArea = wa.student_id;

  const [ws] = await db.query(
    `SELECT student_id FROM client_pl_worksheet WHERE org_id=9001 AND status IN ('generated','assigned') LIMIT 1`
  );
  studentWithWorksheet = ws ? ws.student_id : studentWithWeakArea;
});

afterAll(async () => {
  await db.close();
});

describe('GET /widgets/my-weak-areas', () => {
  it('returns top weak areas for a student', async () => {
    const res = await asRole(request(app).get(`/api/pl/widgets/my-weak-areas?student_id=${studentWithWeakArea}`), 'student');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.weak_areas)).toBe(true);
    expect(res.body.weak_areas.length).toBeGreaterThan(0);
    const w = res.body.weak_areas[0];
    expect(w).toHaveProperty('wiswits_id');
    expect(w).toHaveProperty('label');
    expect(w).toHaveProperty('severity');
    expect(w).toHaveProperty('accuracy');
    expect(w).toHaveProperty('is_root_cause');
  });

  it('400s without student_id', async () => {
    const res = await asRole(request(app).get('/api/pl/widgets/my-weak-areas'), 'student');
    expect(res.status).toBe(400);
  });
});

describe('GET /widgets/my-progress', () => {
  it('returns compact progress summary', async () => {
    const res = await asRole(request(app).get(`/api/pl/widgets/my-progress?student_id=${studentWithWeakArea}`), 'student');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current_avg');
    expect(res.body).toHaveProperty('delta_since_first');
    expect(res.body).toHaveProperty('trend');
  });
});

describe('GET /widgets/practice-streak', () => {
  it('returns streak + due count', async () => {
    const res = await asRole(request(app).get(`/api/pl/widgets/practice-streak?student_id=${studentWithWeakArea}`), 'student');
    expect(res.status).toBe(200);
    expect(typeof res.body.current_streak).toBe('number');
    expect(typeof res.body.cards_due).toBe('number');
  });
});

describe('GET /widgets/next-worksheet', () => {
  it('returns a worksheet or the fallback message', async () => {
    const res = await asRole(request(app).get(`/api/pl/widgets/next-worksheet?student_id=${studentWithWorksheet}`), 'student');
    expect(res.status).toBe(200);
    if (res.body.worksheet) {
      expect(res.body.worksheet).toHaveProperty('id');
      expect(res.body.worksheet).toHaveProperty('strategy');
      expect(Array.isArray(res.body.worksheet.targets)).toBe(true);
    } else {
      expect(res.body.worksheet).toBeNull();
      expect(typeof res.body.message).toBe('string');
    }
  });
});

describe('GET /widgets/reteach-alerts', () => {
  it('returns count + preview for teacher', async () => {
    const res = await asRole(request(app).get('/api/pl/widgets/reteach-alerts'), 'teacher');
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    expect(Array.isArray(res.body.preview)).toBe(true);
  });
});

describe('GET /widgets/class-health', () => {
  it('returns org-wide health snapshot', async () => {
    const res = await asRole(request(app).get('/api/pl/widgets/class-health'), 'teacher');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('avg_accuracy');
    expect(res.body).toHaveProperty('weak_area_count');
    expect(res.body).toHaveProperty('students_escalated');
  });
});

describe('GET /widgets/attention-needed', () => {
  it('returns count + top escalated students', async () => {
    const res = await asRole(request(app).get('/api/pl/widgets/attention-needed'), 'teacher');
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    expect(Array.isArray(res.body.students)).toBe(true);
    if (res.body.students.length) {
      const s = res.body.students[0];
      expect(s).toHaveProperty('student_id');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('wiswits_id');
      expect(s).toHaveProperty('severity');
    }
  });
});

describe('GET /widgets/pending-evaluation', () => {
  it('returns pending attempt + offline unmarked counts', async () => {
    const res = await asRole(request(app).get('/api/pl/widgets/pending-evaluation'), 'teacher');
    expect(res.status).toBe(200);
    expect(typeof res.body.pending_attempts).toBe('number');
    expect(typeof res.body.offline_unmarked).toBe('number');
  });
});

describe('GET /widgets/child-progress', () => {
  it('returns progress + a narrative sentence for a parent', async () => {
    const res = await asRole(request(app).get(`/api/pl/widgets/child-progress?student_id=${studentWithWeakArea}`), 'parent');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current_avg');
    expect(res.body).toHaveProperty('trend');
    expect(typeof res.body.narrative).toBe('string');
    expect(res.body.narrative.length).toBeGreaterThan(0);
  });
});

describe('GET /widgets/subject-health', () => {
  it('returns a one-entry array for the single seeded subject', async () => {
    const res = await asRole(request(app).get('/api/pl/widgets/subject-health'), 'principal');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    const s = res.body[0];
    expect(s).toHaveProperty('subject_id');
    expect(s).toHaveProperty('name');
    expect(s).toHaveProperty('avg_accuracy');
    expect(s).toHaveProperty('gaps');
    expect(s).toHaveProperty('closed');
    expect(s).toHaveProperty('close_rate');
  });
});
