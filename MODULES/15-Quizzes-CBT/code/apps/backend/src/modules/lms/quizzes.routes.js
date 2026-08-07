const express = require('express');
const router = express.Router();
const ctrl = require('./quizzes.controller');
const { authenticate } = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requirePermission } = require('../../middleware/rbac');

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('assessment'));
// Teacher endpoints
router.get('/', requirePermission('quizzes.view'), ctrl.list);
router.post('/', requirePermission('quizzes.create'), ctrl.create);
router.get('/available', ctrl.available);
// getOne returns questions WITH correct_answer — this is a teacher/manage view,
// NOT the student attempt path (students use /available + /:id/start +
// /:id/attempt-data, which strip answers). `quizzes.view` is held by students, so
// gating this by view leaked the answer key. Require manage permission.
router.get('/:id', requirePermission('quizzes.create'), ctrl.getOne);
router.put('/:id', requirePermission('quizzes.create'), ctrl.update);
router.delete('/:id', requirePermission('quizzes.create'), ctrl.remove);
router.post('/:id/questions', requirePermission('quizzes.create'), ctrl.addQuestion);
router.post('/:id/questions/bulk', requirePermission('quizzes.create'), ctrl.addQuestionsBulk);
router.delete('/:id/questions/:questionId', requirePermission('quizzes.create'), ctrl.removeQuestion);
// submissions returns EVERY attempt (classmates' names, admission_number, scores,
// ranking) — a teacher/manage view. Gating by `quizzes.view` let any student read
// every classmate's grades + PII. Require manage permission.
router.get('/:id/submissions', requirePermission('quizzes.create'), ctrl.submissions);

// Student endpoints
router.post('/:id/start', ctrl.startAttempt);
router.post('/:id/submit', ctrl.submitAttempt);
router.get('/:id/results/:attemptId', ctrl.reviewAttempt);

module.exports = router;

// ═══ QUIZ CONFIG ═══
const { query: q2, queryOne: q2One } = require('../../config/db');
const { success: ok2, error: err2 } = require('../../utils/response');
const { assertOrgOwns } = require('../../core/multi-tenant/ownership');

// result_publish_at is IST wall time — serialize as a plain string so the JSON
// layer never TZ-shifts it (SUG-0049b).
const cfgWallTime = (cfg) => {
  if (cfg && cfg.result_publish_at instanceof Date) {
    const d = cfg.result_publish_at, p = (n) => String(n).padStart(2, '0');
    cfg.result_publish_at = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
  }
  return cfg;
};
router.get('/:id/config', async (req, res) => {
  try {
    // The quiz must belong to the caller's org before we read — or worse,
    // auto-create — its config row: the unscoped INSERT stamped the CALLER's
    // org onto any other tenant's quiz (cross-org pollution).
    await assertOrgOwns('quiz', req.params.id, req.user.org_id);
    const cfg = await q2One('SELECT * FROM client_quiz_config WHERE quiz_id=?', [req.params.id]);
    if (!cfg) {
      // Auto-create default config
      await q2('INSERT INTO client_quiz_config (quiz_id, org_id) VALUES (?,?)', [req.params.id, req.user.org_id]);
      const fresh = await q2One('SELECT * FROM client_quiz_config WHERE quiz_id=?', [req.params.id]);
      return ok2(res, { config: cfgWallTime(fresh) });
    }
    return ok2(res, { config: cfgWallTime(cfg) });
  } catch (e) { return err2(res, e.message, e.status || 500); }
});

router.put('/:id/config', requirePermission('quizzes.create'), async (req, res) => {
  try {
    // Same gate as GET: the upsert keys on quiz_id with the caller's org.
    await assertOrgOwns('quiz', req.params.id, req.user.org_id);
    const { shuffle_questions, shuffle_options, show_result_immediately, show_solution_after, attempt_limit,
            calculator_enabled, lock_navigation, result_publish_at } = req.body;
    // result_publish_at (SUG-0049b) needs teacher_followups_migration; fall back
    // to the legacy column set so config saves still work pre-migration.
    const base = [req.params.id, req.user.org_id, shuffle_questions ? 1 : 0, shuffle_options ? 1 : 0,
       show_result_immediately ? 1 : 0, show_solution_after || 'after_window', attempt_limit || 1,
       calculator_enabled ? 1 : 0, lock_navigation ? 1 : 0];
    try {
      await q2(`INSERT INTO client_quiz_config (quiz_id, org_id, shuffle_questions, shuffle_options, show_result_immediately, show_solution_after, attempt_limit, calculator_enabled, lock_navigation, result_publish_at)
                VALUES (?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE shuffle_questions=VALUES(shuffle_questions), shuffle_options=VALUES(shuffle_options),
                show_result_immediately=VALUES(show_result_immediately), show_solution_after=VALUES(show_solution_after), attempt_limit=VALUES(attempt_limit),
                calculator_enabled=VALUES(calculator_enabled), lock_navigation=VALUES(lock_navigation), result_publish_at=VALUES(result_publish_at)`,
        [...base, result_publish_at || null]);
    } catch (e) {
      if (!/result_publish_at/i.test(e.message)) throw e;
      await q2(`INSERT INTO client_quiz_config (quiz_id, org_id, shuffle_questions, shuffle_options, show_result_immediately, show_solution_after, attempt_limit, calculator_enabled, lock_navigation)
                VALUES (?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE shuffle_questions=VALUES(shuffle_questions), shuffle_options=VALUES(shuffle_options),
                show_result_immediately=VALUES(show_result_immediately), show_solution_after=VALUES(show_solution_after), attempt_limit=VALUES(attempt_limit),
                calculator_enabled=VALUES(calculator_enabled), lock_navigation=VALUES(lock_navigation)`, base);
    }
    return ok2(res, {}, 'Config saved');
  } catch (e) { return err2(res, e.message, e.status || 500); }
});

// Publish / close
router.post('/:id/publish', requirePermission('quizzes.create'), async (req, res) => {
  try {
    await q2('UPDATE client_quizzes SET status=? WHERE id=? AND org_id=?', ['published', req.params.id, req.user.org_id]);
    return ok2(res, {}, 'Quiz published');
  } catch (e) { return err2(res, e.message, 500); }
});

router.post('/:id/close', requirePermission('quizzes.create'), async (req, res) => {
  try {
    await q2('UPDATE client_quizzes SET status=? WHERE id=? AND org_id=?', ['closed', req.params.id, req.user.org_id]);
    return ok2(res, {}, 'Quiz closed');
  } catch (e) { return err2(res, e.message, 500); }
});

// Save answer during attempt (for auto-save every 30s)
router.put('/attempts/:attemptId/answer', async (req, res) => {
  try {
    const { question_id, student_answer, flagged } = req.body;
    const attemptId = req.params.attemptId;

    // Verify attempt belongs to user. student_id stores client_students.id,
    // not user_id — the old direct compare never matched, leaving this guard
    // dead and the flagged_questions write below it unprotected.
    const att = await quizV2.getOwnedAttempt(attemptId, req.user.user_id, req.user.org_id);
    if (att.status !== 'in_progress') return err2(res, 'Attempt already submitted', 400);

    // Upsert answer
    const existing = await q2One('SELECT id FROM client_quiz_answers WHERE attempt_id=? AND question_id=?', [attemptId, question_id]);
    if (existing) {
      await q2('UPDATE client_quiz_answers SET student_answer=? WHERE id=?', [student_answer, existing.id]);
    } else {
      await q2('INSERT INTO client_quiz_answers (org_id, attempt_id, question_id, student_answer) VALUES (?,?,?,?)',
        [req.user.org_id, attemptId, question_id, student_answer]);
    }

    // Update flagged list if provided
    if (flagged !== undefined) {
      const flaggedArr = Array.isArray(flagged) ? flagged : [];
      await q2('UPDATE client_quiz_attempts SET flagged_questions=? WHERE id=?', [JSON.stringify(flaggedArr), attemptId]);
    }

    return ok2(res, {}, 'Answer saved');
  } catch (e) { return err2(res, e.message, e.status || 500); }
});

// Quiz analytics (teacher)
router.get('/:id/analytics', requirePermission('quizzes.create'), async (req, res) => {
  try {
    const quizId = req.params.id;
    // Quiz ids are global autoincrements — without this gate any teacher could
    // read another org's attempts, scores and student PII by iterating ids.
    await assertOrgOwns('quiz', quizId, req.user.org_id);
    // Names live on client_users; client_students has no first_name/last_name/
    // roll_number columns (same join as quizServiceV2 getAttemptResult/leaderboard).
    const attempts = await q2(`
      SELECT a.*, u.first_name, u.last_name, s.admission_number AS roll_number
      FROM client_quiz_attempts a
      LEFT JOIN client_students s ON s.id=a.student_id
      LEFT JOIN client_users u ON u.id=s.user_id
      WHERE a.quiz_id=? AND a.org_id=? AND a.status IN ('submitted','graded')
      ORDER BY a.score DESC`, [quizId, req.user.org_id]);

    const stats = await q2One(`
      SELECT COUNT(*) total_attempts,
             ROUND(AVG(score),2) avg_score,
             MAX(score) max_score,
             MIN(score) min_score,
             ROUND(AVG(percentage),2) avg_pct
      FROM client_quiz_attempts WHERE quiz_id=? AND org_id=? AND status IN ('submitted','graded')`, [quizId, req.user.org_id]);

    // Per-question accuracy
    const perQ = await q2(`
      SELECT q.id, q.question_text, q.sequence,
             COUNT(ans.id) total_answers,
             SUM(ans.is_correct) correct_count,
             ROUND(SUM(ans.is_correct)/NULLIF(COUNT(ans.id),0)*100, 1) accuracy_pct
      FROM client_quiz_questions q
      LEFT JOIN client_quiz_answers ans ON ans.question_id=q.id
      LEFT JOIN client_quiz_attempts att ON att.id=ans.attempt_id AND att.org_id=? AND att.status IN ('submitted','graded')
      WHERE q.quiz_id=?
      GROUP BY q.id ORDER BY q.sequence`, [req.user.org_id, quizId]);

    return ok2(res, { attempts, stats, question_analytics: perQ });
  } catch (e) { return err2(res, e.message, e.status || 500); }
});


// ═══ PREMIUM DEPTH ENDPOINTS ═══
const quizV2 = require('../../services/quizServiceV2');

// Student: get quiz for attempt (no correct answers)
router.get('/:id/attempt-data', async (req, res) => {
  try {
    const data = await quizV2.getQuizForAttempt(req.params.id, req.user.user_id, req.user.org_id);
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
});

// Start/resume attempt (enforced)
router.post('/:id/start-v2', async (req, res) => {
  try {
    const data = await quizV2.startAttempt(req.params.id, req.user.user_id, req.user.org_id);
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
});

// Save answer (auto-save)
router.put('/attempts/:id/save-answer', async (req, res) => {
  try {
    const { question_id, answer, time_spent, flagged } = req.body;
    await quizV2.saveAnswer({
      attemptId: req.params.id,
      studentId: req.user.user_id,
      questionId: question_id,
      answer,
      timeSpent: time_spent,
      flagged,
      orgId: req.user.org_id,
    });
    return res.json({ status: 'success' });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
});

// Log tab switch (anti-cheat)
router.post('/attempts/:id/tab-switch', async (req, res) => {
  try {
    const count = await quizV2.incrementTabSwitch(req.params.id, req.user.user_id, req.user.org_id);
    return res.json({ status: 'success', data: { tab_switches: count } });
  } catch (err) {
    return res.status(err.status || 400).json({ status: 'error', message: err.message });
  }
});

// Submit attempt (auto-grade)
router.post('/attempts/:id/submit', async (req, res) => {
  try {
    // IDOR guard: autoGradeAttempt() takes only the attempt id (a global
    // autoincrement), so without this any student could submit + grade ANY
    // attempt — a classmate's, or one in another org. Require that the attempt
    // belongs to the calling student in this org before grading.
    const own = await q2One(
      `SELECT a.id, a.student_id FROM client_quiz_attempts a
       JOIN client_students s ON s.id = a.student_id
       WHERE a.id = ? AND a.org_id = ? AND s.user_id = ?`,
      [req.params.id, req.user.org_id, req.user.user_id]);
    if (!own) return res.status(403).json({ status: 'error', message: 'This attempt is not yours' });
    const result = await quizV2.autoGradeAttempt(req.params.id);
    // Refresh this student's weak areas from the new attempt so the profile isn't
    // frozen until the nightly cron ('numbers never change' report). Fire-and-forget
    // so it never blocks or fails the submit response.
    try {
      require('../../services/recovery/weakAreaDetector')
        .calculateForStudent(own.student_id, req.user.org_id)
        .catch(() => {});
    } catch { /* detector unavailable — nightly cron still covers it */ }
    return res.json({ status: 'success', data: result });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
});

// Result page
router.get('/attempts/:id/result-v2', async (req, res) => {
  try {
    const data = await quizV2.getAttemptResult(req.params.id, req.user.user_id);
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
});

// Teacher analytics
router.get('/:id/analytics-v2', requirePermission('quizzes.create'), async (req, res) => {
  try {
    const data = await quizV2.getQuizAnalytics(req.params.id, req.user.org_id);
    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
});

// Parent: child's quiz results
router.get('/parent/child/:childId/results', async (req, res) => {
  try {
    // Verify parent link. client_parent_students.parent_id references
    // client_parents.id, NOT the user id — resolve the parent row first
    // (same pattern as reportcards/attendance). Was matching on user_id → no
    // link ever found → parent saw nothing.
    const { queryOne: qo2, query: q2 } = require('../../config/db');
    const parent = await qo2('SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [req.user.user_id, req.user.org_id]);
    const link = parent && await qo2('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, req.params.childId]);
    if (!link) return res.status(403).json({ status: 'error', message: 'Not your child' });
    
    const attempts = await q2(
      `SELECT a.*, q.title, q.total_marks, q.duration_minutes, q.passing_marks
       FROM client_quiz_attempts a
       JOIN client_quizzes q ON q.id=a.quiz_id
       WHERE a.student_id=? AND a.org_id=? AND a.status IN ('submitted','graded')
       ORDER BY a.submitted_at DESC LIMIT 50`,
      [req.params.childId, req.user.org_id]
    );
    return res.json({ status: 'success', data: { attempts } });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
});

