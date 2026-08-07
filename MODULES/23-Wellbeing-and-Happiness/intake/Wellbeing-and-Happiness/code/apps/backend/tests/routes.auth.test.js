// tests/routes.auth.test.js — HTTP-level role enforcement (no DB needed)
//
// These hit the real Express app. Routes that reach the DB will error AFTER the
// auth check, so we only assert the auth/role behaviour here — the guard runs
// before any DB access. Public routes (health, helplines) need no context.

process.env.WB_MASTER_KEY = process.env.WB_MASTER_KEY || 'test-master-key-abcdef 0123456789';

const request = require('supertest');
const { buildApp } = require('../src/app');

const app = buildApp();

const asStudent = (r) => r.set('x-wb-actor-id', '7').set('x-wb-role', 'student').set('x-wb-org-id', '1');
const asTeacher = (r) => r.set('x-wb-actor-id', '5').set('x-wb-role', 'teacher').set('x-wb-org-id', '1');
const asPrincipal = (r) => r.set('x-wb-actor-id', '3').set('x-wb-role', 'principal').set('x-wb-org-id', '1');
const asCounsellor = (r) => r.set('x-wb-actor-id', '9').set('x-wb-role', 'counsellor').set('x-wb-org-id', '1');

describe('🌐 public routes need no auth', () => {
  it('GET /api/wb/health', async () => {
    const res = await request(app).get('/api/wb/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/wb/helplines returns Tele-MANAS first', async () => {
    const res = await request(app).get('/api/wb/helplines');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Tele-MANAS');
  });
});

describe('🔒 student routes reject non-students and missing auth', () => {
  it('a teacher posting a pulse is forbidden (403)', async () => {
    const res = await asTeacher(request(app).post('/api/wb/pulse')).send({ mood: 'good' });
    expect(res.status).toBe(403);
  });

  it('a teacher listing journal entries is forbidden (403)', async () => {
    const res = await asTeacher(request(app).get('/api/wb/journal'));
    expect(res.status).toBe(403);
  });

  it('missing auth context is a 400', async () => {
    const res = await request(app).post('/api/wb/pulse').send({ mood: 'good' });
    expect(res.status).toBe(400);
  });

  it('a student with a bad mood gets 400 (passes auth, fails validation)', async () => {
    const res = await asStudent(request(app).post('/api/wb/pulse')).send({ mood: 'nope' });
    // Reaches the service (auth ok), which rejects the mood before any DB write.
    expect(res.status).toBe(400);
  });

  it('no ranking endpoint exists (404)', async () => {
    for (const p of ['/api/wb/leaderboard', '/api/wb/most-stressed', '/api/wb/rank']) {
      const res = await asStudent(request(app).get(p));
      expect(res.status).toBe(404);
    }
  });
});

describe('👩‍⚕️ context view — only counsellor, only with a reason', () => {
  it('teacher GET /students/:id/context → 403', async () => {
    const res = await asTeacher(request(app).get('/api/wb/students/42/context?reason=worried about them'));
    expect(res.status).toBe(403);
  });

  it('principal GET /students/:id/context → 403', async () => {
    const res = await asPrincipal(request(app).get('/api/wb/students/42/context?reason=reviewing the case'));
    expect(res.status).toBe(403);
  });

  it('parent GET /students/:id/pulse → 403', async () => {
    const res = request(app).get('/api/wb/students/42/pulse?reason=i am the parent here')
      .set('x-wb-actor-id', '2').set('x-wb-role', 'parent').set('x-wb-org-id', '1');
    expect((await res).status).toBe(403);
  });

  it('counsellor WITHOUT a reason → 400 (before any DB access)', async () => {
    const res = await asCounsellor(request(app).get('/api/wb/students/42/context'));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reason/i);
  });
});
