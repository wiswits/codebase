'use strict';

require('dotenv').config();

const express = require('express');
const request = require('supertest');

const { context } = require('../src/middleware/context');
const testBuilderRouter = require('../src/routes/testBuilder');
const db = require('../src/config/db');

// Throwaway app that mounts only the router under test (no need to touch app.js).
const app = express();
app.use(express.json());
app.use(context);
const api = express.Router();
api.use(testBuilderRouter);
app.use('/api/pl', api);

const ORG_ID = 9001; // demo org, already seeded
const SUBJECT_ID = 9001;

const asTeacher = (r) => r.set('x-role', 'teacher').set('x-org-id', String(ORG_ID)).set('x-user-id', '1');

afterAll(async () => {
  await db.close();
});

describe('Test Builder API', () => {
  let testId;

  it('POST /tests creates a draft test shell', async () => {
    const res = await asTeacher(request(app).post('/api/pl/tests')).send({
      title: 'Test Builder Integration Draft',
      subject_id: SUBJECT_ID,
      class_no: 10,
      type: 'unit',
      mode: 'online',
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.id).toBeTruthy();
    testId = res.body.id;
  });

  it('POST /tests/:id/questions adds a question, then POST /tests/:id/publish publishes it', async () => {
    const addRes = await asTeacher(request(app).post(`/api/pl/tests/${testId}/questions`)).send({
      add: [
        {
          wiswits_id: 'MATH10C01T02', bloom: 'apply', difficulty: 'easy', marks: 2,
          stem: 'What is HCF(12,18)?',
          options: [{ key: 'A', text: '6', is_correct: true }, { key: 'B', text: '12', is_correct: false }],
          correct: 'A',
        },
      ],
      remove: [],
      reorder: [],
    });
    expect(addRes.status).toBe(200);
    expect(addRes.body.total_questions).toBe(1);

    const pubRes = await asTeacher(request(app).post(`/api/pl/tests/${testId}/publish`));
    expect(pubRes.status).toBe(200);
    expect(pubRes.body.status).toBe('published');
    expect(pubRes.body.question_count).toBe(1);
  });

  it('GET /tests lists the created test for the org', async () => {
    const res = await asTeacher(request(app).get('/api/pl/tests')).query({ subject: SUBJECT_ID });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tests)).toBe(true);
    expect(res.body.tests.some((t) => t.id === testId)).toBe(true);
  });

  it('POST /tests/:id/clone duplicates the test + its questions as a new draft', async () => {
    const res = await asTeacher(request(app).post(`/api/pl/tests/${testId}/clone`));
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.question_count).toBe(1);
    expect(res.body.title).toMatch(/\(copy\)$/);
    expect(res.body.id).not.toBe(testId);
  });

  it('POST /tests/from-qbank creates a test with frozen question snapshots', async () => {
    const res = await asTeacher(request(app).post('/api/pl/tests/from-qbank')).send({
      title: 'QBank-built test',
      subject_id: SUBJECT_ID,
      class_no: 10,
      filters: { wiswits_ids: ['MATH10C01T02'], difficulty: 'medium' },
      count: 3,
    });
    expect(res.status).toBe(201);
    expect(res.body.question_count).toBeGreaterThan(0);

    const preview = await asTeacher(request(app).get(`/api/pl/tests/${res.body.id}/preview`));
    expect(preview.status).toBe(200);
    expect(preview.body.questions.length).toBe(res.body.question_count);
    expect(preview.body.questions[0].stem).toBeTruthy();
  });

  it('GET /tests/:id/validate returns basic sanity checks when no blueprint', async () => {
    const res = await asTeacher(request(app).get(`/api/pl/tests/${testId}/validate`));
    expect(res.status).toBe(200);
    expect(res.body.has_blueprint).toBe(false);
    expect(res.body.sane).toBe(true);
  });
});
