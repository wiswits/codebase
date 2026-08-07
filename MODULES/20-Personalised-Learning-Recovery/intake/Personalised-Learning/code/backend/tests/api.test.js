'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();
const asTeacher = (r) => r.set('x-role', 'teacher').set('x-org-id', '1');

describe('health', () => {
  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.module).toBe('pl');
  });
});

describe('POST /api/pl/analyze/weak-areas → root cause', () => {
  it('flags Ch01 as root over Ch03/Ch07', async () => {
    const now = '2026-07-16T00:00:00Z';
    const daysAgo = (n) => new Date(Date.parse(now) - n * 86400000).toISOString();
    const topics = [
      { wiswits_id: 'MATH10C07T01', subject_id: 1, attempted: 8, accuracy: 28, last_attempt_at: daysAgo(2), variance: 5 },
      { wiswits_id: 'MATH10C03T02', subject_id: 1, attempted: 8, accuracy: 34, last_attempt_at: daysAgo(2), variance: 5 },
      { wiswits_id: 'MATH10C01T02', subject_id: 1, attempted: 8, accuracy: 41, last_attempt_at: daysAgo(2), variance: 5 },
    ];
    const res = await asTeacher(request(app).post('/api/pl/analyze/weak-areas')).send({ topics, now });
    expect(res.status).toBe(200);
    const root = res.body.weak_areas.find((w) => w.is_root_cause);
    expect(root.wiswits_id).toBe('MATH10C01T02');
    expect(res.body.weak_areas[0].is_root_cause).toBe(true); // roots sorted first
  });
});

describe('POST /api/pl/analyze/worksheet-plan → behaviour override', () => {
  it('rusher + silly>40 → coaching, not worksheet', async () => {
    const res = await asTeacher(request(app).post('/api/pl/analyze/worksheet-plan')).send({
      weak_areas: [{ wiswits_id: 'MATH10C01T02', severity: 'critical', accuracy: 41, is_root_cause: true }],
      profile: { behaviour: 'rusher', silly_mistake_rate: 42, coaching_note: 'slow down' },
    });
    expect(res.body.skip_worksheet).toBe(true);
  });
});

describe('permission gate', () => {
  it('student blocked from teacher-only distractor route', async () => {
    const res = await request(app)
      .post('/api/pl/analyze/distractor')
      .set('x-role', 'student')
      .send({ question: {}, responses: [] });
    expect(res.status).toBe(403);
  });
});

describe('dignity: comparison API returns no rank', () => {
  it('no rank / leaderboard in payload', async () => {
    const res = await request(app)
      .post('/api/pl/analyze/comparison')
      .set('x-role', 'parent')
      .send({
        my: { accuracy: 67, score: 27, max: 40 },
        peers: { class_avg: 61, topper_accuracy: 94 },
        history: [{ accuracy: 67 }, { accuracy: 64 }],
        percentile: 78,
      });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/rank|leaderboard/i);
    expect(res.body.position.band).toBe('top_25');
  });
});
