'use strict';

require('dotenv').config();

const express = require('express');
const request = require('supertest');

const { context } = require('../src/middleware/context');
const worksheetsRouter = require('../src/routes/worksheets');
const cyclesFullRouter = require('../src/routes/recoveryCyclesFull');
const profileRouter = require('../src/routes/profile');
const db = require('../src/config/db');

// Throwaway app mounting only the routers under test (app.js untouched).
const app = express();
app.use(express.json());
app.use(context);
const api = express.Router();
api.use(worksheetsRouter);
api.use(cyclesFullRouter);
api.use(profileRouter);
app.use('/api/pl', api);

const ORG_ID = 9001; // demo org, already seeded
const SUBJECT_ID = 9001;

const asTeacher = (r) => r.set('x-role', 'teacher').set('x-org-id', String(ORG_ID)).set('x-user-id', '1');

afterAll(async () => {
  await db.close();
});

describe('Worksheets + Recovery Cycles + Profile — end-to-end against seeded org 9001', () => {
  let weakStudentId;

  beforeAll(async () => {
    const rows = await db.query(
      `SELECT student_id FROM client_pl_weak_area WHERE org_id=:org_id AND status IN ('open','in_recovery') LIMIT 1`,
      { org_id: ORG_ID }
    );
    expect(rows.length).toBeGreaterThan(0); // seed must have open/in_recovery weak areas
    weakStudentId = rows[0].student_id;
  });

  it('POST /worksheets/generate builds a worksheet for a real weak student', async () => {
    const res = await asTeacher(request(app).post('/api/pl/worksheets/generate')).send({ student_id: weakStudentId });
    expect([200, 201]).toContain(res.status);

    if (res.body.skip_worksheet) {
      // behaviour override (rusher + silly>40) — valid outcome, nothing more to assign here
      expect(res.body.message).toBeTruthy();
      return;
    }

    expect(res.body.id).toBeTruthy();
    expect(res.body.student_id).toBe(weakStudentId);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBeGreaterThan(0);
    expect(res.body.total_questions).toBe(res.body.questions.length);
    expect(res.body.status).toBe('generated');

    const worksheetId = res.body.id;

    // GET /worksheets/:id round-trips
    const getRes = await asTeacher(request(app).get(`/api/pl/worksheets/${worksheetId}`));
    expect(getRes.status).toBe(200);
    expect(getRes.body.questions.length).toBe(res.body.total_questions);

    // GET /worksheets list filter by student
    const listRes = await asTeacher(request(app).get('/api/pl/worksheets')).query({ student: weakStudentId });
    expect(listRes.status).toBe(200);
    expect(listRes.body.worksheets.some((w) => w.id === worksheetId)).toBe(true);

    // GET /worksheets/:id/pdf — structured content, no real pdf
    const pdfRes = await asTeacher(request(app).get(`/api/pl/worksheets/${worksheetId}/pdf`)).query({ solutions: 'true' });
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.body.pdf_path).toBeNull();
    expect(Array.isArray(pdfRes.body.content.questions)).toBe(true);

    // regenerate → different question ids, same targets/strategy
    const oldQuestionIds = res.body.questions.map((q) => q.id).sort();
    const regenRes = await asTeacher(request(app).post(`/api/pl/worksheets/${worksheetId}/regenerate`));
    expect(regenRes.status).toBe(200);
    const newQuestionIds = regenRes.body.questions.map((q) => q.id).sort();
    expect(newQuestionIds).not.toEqual(oldQuestionIds);
    expect(regenRes.body.strategy).toBe(res.body.strategy);

    // PATCH edits
    const patchRes = await asTeacher(request(app).patch(`/api/pl/worksheets/${worksheetId}`)).send({
      total_questions: regenRes.body.questions.length,
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('edited');

    // assign
    const assignRes = await asTeacher(request(app).post(`/api/pl/worksheets/${worksheetId}/assign`));
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.status).toBe('assigned');
    expect(assignRes.body.assigned_at).toBeTruthy();

    // attempt (simple recorded score)
    const attemptRes = await asTeacher(request(app).post(`/api/pl/worksheets/${worksheetId}/attempt`)).send({ score: 72 });
    expect(attemptRes.status).toBe(200);
    expect(attemptRes.body.status).toBe('attempted');
    expect(Number(attemptRes.body.score)).toBe(72);
  });

  it('POST /worksheets/generate-bulk generates across multiple students', async () => {
    const rows = await db.query(
      `SELECT DISTINCT student_id FROM client_pl_weak_area WHERE org_id=:org_id AND status IN ('open','in_recovery') LIMIT 3`,
      { org_id: ORG_ID }
    );
    const studentIds = rows.map((r) => r.student_id);
    const res = await asTeacher(request(app).post('/api/pl/worksheets/generate-bulk')).send({ student_ids: studentIds });
    expect(res.status).toBe(201);
    expect(res.body.generated + res.body.skipped_coaching).toBe(studentIds.length);
    expect(res.body.worksheets.length).toBe(studentIds.length);
  });

  it('POST /worksheets/generate-class bulk-generates for a class-wide misconception wiswits_id', async () => {
    const [wa] = await db.query(
      `SELECT wiswits_id FROM client_pl_weak_area WHERE org_id=:org_id AND status IN ('open','in_recovery') LIMIT 1`,
      { org_id: ORG_ID }
    );
    const res = await asTeacher(request(app).post('/api/pl/worksheets/generate-class')).send({
      test_id: 1, wiswits_id: wa.wiswits_id,
    });
    expect(res.status).toBe(201);
    expect(typeof res.body.generated).toBe('number');
    expect(Array.isArray(res.body.worksheets)).toBe(true);
  });

  it('Recovery cycle: start + retest end-to-end → closed outcome', async () => {
    const [wa] = await db.query(
      `SELECT id, student_id, wiswits_id, accuracy FROM client_pl_weak_area WHERE org_id=:org_id AND status IN ('open','in_recovery') LIMIT 1`,
      { org_id: ORG_ID }
    );

    const startRes = await asTeacher(request(app).post('/api/pl/cycles/start')).send({ weak_area_id: wa.id });
    expect(startRes.status).toBeLessThan(300);

    if (startRes.body.needs_teacher) {
      // max cycles already hit for this weak area — valid outcome, escalation path
      expect(startRes.body.cycles).toBeGreaterThanOrEqual(3);
      return;
    }

    expect(startRes.body.id).toBeTruthy();
    expect(startRes.body.weak_area_id).toBe(wa.id);
    const cycleId = startRes.body.id;

    // retest with a high accuracy → guaranteed 'closed' (>= CLOSE_THRESHOLD)
    const retestRes = await asTeacher(request(app).post(`/api/pl/cycles/${cycleId}/retest`)).send({ retest_accuracy: 96 });
    expect(retestRes.status).toBe(200);
    expect(retestRes.body.outcome).toBe('closed');
    expect(retestRes.body.next_action.action).toBe('close_weak_area');
    expect(retestRes.body.cycle.outcome).toBe('closed');
    expect(retestRes.body.cycle.days_to_close).not.toBeNull();

    // weak_area flipped to closed
    const [updatedWa] = await db.query(`SELECT status FROM client_pl_weak_area WHERE id=:id`, { id: wa.id });
    expect(updatedWa.status).toBe('closed');

    // timeline includes this cycle
    const timelineRes = await asTeacher(request(app).get(`/api/pl/cycles/timeline/${wa.student_id}`));
    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body.timeline.some((t) => t.cycle_id === cycleId && t.outcome === 'closed')).toBe(true);

    // student cycle history is annotated with weak_area status
    const studentCyclesRes = await asTeacher(request(app).get(`/api/pl/cycles/student/${wa.student_id}`));
    expect(studentCyclesRes.status).toBe(200);
    const found = studentCyclesRes.body.cycles.find((c) => c.id === cycleId);
    expect(found.weak_area_status).toBe('closed');
  });

  it('GET /cycles lists with filters', async () => {
    const res = await asTeacher(request(app).get('/api/pl/cycles')).query({ outcome: 'closed', limit: 5 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cycles)).toBe(true);
    expect(res.body.cycles.every((c) => c.outcome === 'closed')).toBe(true);
  });

  it('Profile: recompute from real responses, then fetch', async () => {
    const [attemptRow] = await db.query(
      `SELECT a.student_id FROM client_pl_attempt a WHERE a.org_id=:org_id AND a.status='evaluated' LIMIT 1`,
      { org_id: ORG_ID }
    );
    const studentId = attemptRow.student_id;

    const recomputeRes = await asTeacher(request(app).post('/api/pl/profile/recompute')).send({
      student_id: studentId, subject_id: SUBJECT_ID,
    });
    expect(recomputeRes.status).toBe(200);
    expect(recomputeRes.body.behaviour).toBeTruthy();
    expect(recomputeRes.body.pace).toBeTruthy();
    expect(recomputeRes.body.error_signature_json).toBeTruthy();

    const getRes = await asTeacher(request(app).get(`/api/pl/profile/student/${studentId}`)).query({ subject_id: SUBJECT_ID });
    expect(getRes.status).toBe(200);
    expect(getRes.body.behaviour).toBe(recomputeRes.body.behaviour);
  });

  it('Profile: 404 for a student with no computed profile yet', async () => {
    const res = await asTeacher(request(app).get('/api/pl/profile/student/999999')).query({ subject_id: SUBJECT_ID });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('profile_not_found');
  });
});
