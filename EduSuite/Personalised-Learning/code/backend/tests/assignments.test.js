'use strict';

require('dotenv').config();

const express = require('express');
const request = require('supertest');

const { context } = require('../src/middleware/context');
const assignmentsRouter = require('../src/routes/assignments');
const myTestsRouter = require('../src/routes/myTests');
const offlineTestsRouter = require('../src/routes/offlineTests');
const db = require('../src/config/db');

// Throwaway app mounting only the routers under test (app.js untouched).
const app = express();
app.use(express.json());
app.use(context);
const api = express.Router();
api.use(assignmentsRouter);
api.use(myTestsRouter);
api.use(offlineTestsRouter);
app.use('/api/pl', api);

const ORG_ID = 9001; // demo org, already seeded
const SUBJECT_ID = 9001;
const STUDENT_ID = 900001;

const asTeacher = (r) => r.set('x-role', 'teacher').set('x-org-id', String(ORG_ID)).set('x-user-id', '1');

afterAll(async () => {
  await db.close();
});

describe('Assignments + auto-group + my/tests API', () => {
  it('POST /assignments/preview-group returns a sane matched list (read-only)', async () => {
    const res = await asTeacher(request(app).post('/api/pl/assignments/preview-group')).send({
      subject_id: SUBJECT_ID,
      rule: { weak_in: 'MATH10C01T01', severity: ['weak', 'critical', 'borderline'], status: ['open', 'in_recovery'] },
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    expect(Array.isArray(res.body.students)).toBe(true);
    if (res.body.students.length) {
      expect(res.body.students[0]).toHaveProperty('id');
      expect(res.body.students[0]).toHaveProperty('name');
      expect(res.body.students[0]).toHaveProperty('severity');
      expect(res.body.students[0]).toHaveProperty('accuracy');
    }
  });

  it('POST /assignments/auto-group creates an assignment + assignment_student rows', async () => {
    // build a small offline test to assign
    const testRes = await asTeacher(request(app).post('/api/pl/tests/offline')).send({
      title: 'Auto-group Recovery Test', subject_id: SUBJECT_ID, class_no: 10,
      total_questions: 5, marks_per_q: 2, duration_min: 30,
    });
    expect(testRes.status).toBe(201);
    const test_id = testRes.body.id;

    const res = await asTeacher(request(app).post('/api/pl/assignments/auto-group')).send({
      test_id, subject_id: SUBJECT_ID,
      rule: { weak_in: 'MATH10C01T01', severity: ['weak', 'critical', 'borderline'], status: ['open', 'in_recovery'] },
      opens_at: null, closes_at: null, attempts_allowed: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.target_type).toBe('auto_group');
    expect(typeof res.body.matched_count).toBe('number');

    const assignmentId = res.body.id;

    // status reflects the materialized rows
    const statusRes = await asTeacher(request(app).get(`/api/pl/assignments/${assignmentId}/status`));
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.total).toBe(res.body.matched_count);
    expect(statusRes.body.assigned + statusRes.body.started + statusRes.body.submitted
      + statusRes.body.evaluated + statusRes.body.absent + statusRes.body.excused).toBe(statusRes.body.total);
    expect(Array.isArray(statusRes.body.students)).toBe(true);
  });

  it('POST /assignments creates a students-targeted assignment directly', async () => {
    const testRes = await asTeacher(request(app).post('/api/pl/tests/offline')).send({
      title: 'Direct Student Assignment Test', subject_id: SUBJECT_ID, class_no: 10,
      total_questions: 3, marks_per_q: 2, duration_min: 20,
    });
    const test_id = testRes.body.id;

    const res = await asTeacher(request(app).post('/api/pl/assignments')).send({
      test_id, target_type: 'students', target_json: { student_ids: [900001, 900002, 900003] },
      attempts_allowed: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.student_count).toBe(3);
    expect(res.body.student_ids.sort()).toEqual([900001, 900002, 900003]);
  });

  it('PATCH /assignments/:id updates mutable fields, extend pushes closes_at out', async () => {
    const testRes = await asTeacher(request(app).post('/api/pl/tests/offline')).send({
      title: 'Patch Test', subject_id: SUBJECT_ID, class_no: 10, total_questions: 2, marks_per_q: 2, duration_min: 10,
    });
    const createRes = await asTeacher(request(app).post('/api/pl/assignments')).send({
      test_id: testRes.body.id, target_type: 'students', target_json: { student_ids: [900010] },
      closes_at: '2026-08-01 10:00:00',
    });
    const id = createRes.body.id;

    const patchRes = await asTeacher(request(app).patch(`/api/pl/assignments/${id}`)).send({ attempts_allowed: 3 });
    expect(patchRes.status).toBe(200);

    const extendRes = await asTeacher(request(app).post(`/api/pl/assignments/${id}/extend`)).send({ closes_at: '2026-09-01 10:00:00' });
    expect(extendRes.status).toBe(200);
    expect(extendRes.body.closes_at).toBe('2026-09-01 10:00:00');

    const badExtend = await asTeacher(request(app).post(`/api/pl/assignments/${id}/extend`)).send({ closes_at: '2020-01-01 00:00:00' });
    expect(badExtend.status).toBe(400);

    const closeRes = await asTeacher(request(app).post(`/api/pl/assignments/${id}/close`));
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.status).toBe('closed');
  });

  it('GET /my/tests returns a submitted/evaluated entry for a student with a marks-entry attempt', async () => {
    // Build + map + grade a small offline test for STUDENT_ID via marks-entry.
    const testRes = await asTeacher(request(app).post('/api/pl/tests/offline')).send({
      title: 'MyTests Done Fixture', subject_id: SUBJECT_ID, class_no: 10,
      total_questions: 2, marks_per_q: 2, duration_min: 15,
    });
    const test_id = testRes.body.id;

    await asTeacher(request(app).post(`/api/pl/tests/${test_id}/question-map`)).send({
      map: [
        { paper_q_no: 1, wiswits_id: 'MATH10C01T01', bloom: 'remember', difficulty: 'easy', marks: 2 },
        { paper_q_no: 2, wiswits_id: 'MATH10C01T02', bloom: 'apply', difficulty: 'easy', marks: 2 },
      ],
    });

    const marksRes = await asTeacher(request(app).post(`/api/pl/tests/${test_id}/marks-entry`)).send({
      students: [{ student_id: STUDENT_ID, roll: 1, name: 'Test Student', marks: [2, 0] }],
    });
    expect(marksRes.status).toBe(200);

    const myRes = await asTeacher(request(app).get('/api/pl/my/tests')).query({ student_id: STUDENT_ID });
    expect(myRes.status).toBe(200);
    expect(Array.isArray(myRes.body.done)).toBe(true);
    expect(myRes.body.done.some((d) => d.test_id === test_id)).toBe(true);
    const entry = myRes.body.done.find((d) => d.test_id === test_id);
    expect(entry.score).toBe(2);
    expect(entry.max_score).toBe(4);
  });
});
