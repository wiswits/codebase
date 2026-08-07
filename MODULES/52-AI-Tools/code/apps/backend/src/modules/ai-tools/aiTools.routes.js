const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const aiGateway = require('../../services/ai/gateway');
const db = require('../../config/db');

// Teacher/staff-only AI tools (generators + at-risk lists). Student-facing tools
// (doubt-solver, weekly-insights) stay open. Prevents students/parents from
// enumerating at-risk classmates or burning org AI budget on teacher generators.
const aiStaff = requireRole('owner', 'admin', 'principal', 'coordinator', 'academic_coordinator', 'hod', 'super_admin', 'system_admin', 'teacher');

// ============================================================
// AI QUESTION GENERATOR
// ============================================================
router.post('/question-gen', authenticate, aiStaff, async (req, res) => {
  try {
    const { topic, subject, chapter, count = 5, difficulty = 'medium', bloom_level = 'understand', question_type = 'mcq_single' } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'topic required' });

    const sysPrompt = `You are an expert Indian school curriculum question writer.
Generate high-quality questions for the given topic, difficulty, and Bloom's taxonomy level.
Output ONLY valid JSON array — no markdown, no commentary.`;

    const userPrompt = `Generate ${count} ${difficulty}-difficulty ${question_type} questions on:
Topic: ${topic}
Subject: ${subject || 'General'}
Chapter: ${chapter || 'N/A'}
Bloom level: ${bloom_level}

Return JSON array:
[{
  "question_text": "...",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "correct_answer": "B",
  "solution": "Step-by-step explanation",
  "bloom_level": "${bloom_level}",
  "difficulty": "${difficulty}"
}]`;

    const result = await aiGateway.complete({
      orgId: req.user.org_id,
      userId: req.user.user_id,
      feature: 'question_gen',
      prompt: userPrompt,
      systemPrompt: sysPrompt,
      maxTokens: 2500,
      temperature: 0.6,
      refType: 'aitools_qgen',
    });

    let questions = [];
    try {
      const clean = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      questions = JSON.parse(clean);
    } catch (e) {
      return res.json({ success: false, message: 'AI returned invalid JSON', rawText: result.text });
    }

    res.json({ success: true, questions, aiCost: result.cost, aiTokens: result.tokens, provider: result.provider });
  } catch (e) {
    console.error('[ai-tools.qgen]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});

// ============================================================
// AI ESSAY GRADER
// ============================================================
router.post('/essay-grader', authenticate, aiStaff, async (req, res) => {
  try {
    const { essay_text, rubric, max_score = 100 } = req.body;
    if (!essay_text) return res.status(400).json({ success: false, message: 'essay_text required' });

    const defaultRubric = rubric || `
- Content & Ideas (30 marks): clarity, depth, originality
- Organization (20 marks): structure, flow, transitions
- Language (25 marks): grammar, vocabulary, sentence variety
- Conventions (15 marks): spelling, punctuation
- Engagement (10 marks): voice, audience awareness`;

    const sys = `You are a strict but fair Indian school essay examiner.
Grade essays based on the rubric. Output ONLY valid JSON.`;

    const userPrompt = `Grade this essay out of ${max_score}:

ESSAY:
${essay_text}

RUBRIC:
${defaultRubric}

Output JSON:
{
  "score": <number>,
  "max_score": ${max_score},
  "grade_letter": "A+|A|B+|B|C|D|F",
  "breakdown": [{"criterion": "...", "score": N, "max": N, "comment": "..."}],
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "overall_remark": "1-2 sentence summary"
}`;

    const result = await aiGateway.complete({
      orgId: req.user.org_id,
      userId: req.user.user_id,
      feature: 'essay_grade',
      prompt: userPrompt,
      systemPrompt: sys,
      maxTokens: 1500,
      temperature: 0.3,
      refType: 'aitools_essay',
    });

    let parsed;
    try {
      const clean = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return res.json({ success: false, message: 'AI returned invalid JSON', rawText: result.text });
    }

    res.json({ success: true, ...parsed, aiCost: result.cost, aiTokens: result.tokens });
  } catch (e) {
    console.error('[ai-tools.essay]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});

// ============================================================
// AI LESSON PLAN GENERATOR
// ============================================================
router.post('/lesson-plan', authenticate, aiStaff, async (req, res) => {
  try {
    const { topic, subject, grade, duration_min = 45, learning_objectives } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'topic required' });

    const sys = `You are an expert curriculum designer for Indian schools (CBSE/ICSE/State).
Generate detailed lesson plans aligned to NCERT and Bloom's taxonomy.
Output ONLY valid JSON.`;

    const userPrompt = `Create a ${duration_min}-minute lesson plan:
Topic: ${topic}
Subject: ${subject || 'General'}
Grade: ${grade || 'Class 9'}
Learning objectives: ${learning_objectives || 'Auto-generate'}

Output JSON:
{
  "title": "...",
  "duration_min": ${duration_min},
  "objectives": ["..."],
  "prerequisites": ["..."],
  "materials": ["..."],
  "phases": [
    {"name": "Engagement (5 min)", "duration": 5, "activities": ["..."], "teacher_notes": "..."},
    {"name": "Instruction (15 min)", "duration": 15, "activities": ["..."], "teacher_notes": "..."},
    {"name": "Practice (15 min)", "duration": 15, "activities": ["..."], "teacher_notes": "..."},
    {"name": "Assessment (10 min)", "duration": 10, "activities": ["..."], "teacher_notes": "..."}
  ],
  "homework": "...",
  "extension_activities": ["..."]
}`;

    const result = await aiGateway.complete({
      orgId: req.user.org_id,
      userId: req.user.user_id,
      feature: 'lesson_plan',
      prompt: userPrompt,
      systemPrompt: sys,
      maxTokens: 2000,
      temperature: 0.5,
      refType: 'aitools_lesson',
    });

    let parsed;
    try {
      const clean = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return res.json({ success: false, message: 'AI returned invalid JSON', rawText: result.text });
    }

    res.json({ success: true, plan: parsed, aiCost: result.cost, aiTokens: result.tokens });
  } catch (e) {
    console.error('[ai-tools.lesson]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});

// ============================================================
// AI WEAK AREA ALERTS — list students at risk
// ============================================================
router.get('/weak-alerts', authenticate, aiStaff, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const [students] = await db.pool.execute(`
      SELECT s.id as student_id, u.first_name, u.last_name, u.email,
        -- level='topic' + org scope: the table stores the SAME weakness again at
        -- chapter and subject level, so an unpinned COUNT(*) reported a single
        -- weak topic as three and pushed students over the alert threshold
        -- (same defect class as the duplicated dashboard row, QA round 7).
        (SELECT COUNT(*) FROM client_student_weak_areas w
          WHERE w.student_id = s.id AND w.org_id = s.org_id AND w.level = 'topic' AND w.severity = 'critical') as critical_count,
        (SELECT COUNT(*) FROM client_student_weak_areas w
          WHERE w.student_id = s.id AND w.org_id = s.org_id AND w.level = 'topic' AND w.severity = 'weak') as weak_count,
        (SELECT ai_label FROM client_student_learning_profiles WHERE student_id = s.id ORDER BY id DESC LIMIT 1) as profile_label
      FROM client_students s
      JOIN client_users u ON u.id = s.user_id
      WHERE s.org_id = ?
      HAVING critical_count > 0 OR weak_count > 2
      ORDER BY critical_count DESC, weak_count DESC
      LIMIT 50
    `, [orgId]);
    res.json({ success: true, students });
  } catch (e) {
    console.error('[ai-tools.weak-alerts]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});

// ============================================================
// AI AVAILABILITY — read-only probe so a surface can show an honest
// "coming soon" state UP FRONT instead of dead-ending after the user has
// typed a whole question. Reuses the SAME gate every AI route already
// enforces (gateway org config: active + provisioned key + budget) — no
// second flag mechanism. Never exposes the key, spend, or budget.
// ============================================================
router.get('/status', authenticate, async (req, res) => {
  try {
    const cfg = await aiGateway.getOrgConfig(req.user.org_id);
    const overBudget = cfg.monthlyBudget > 0 && cfg.currentSpend >= cfg.monthlyBudget
      && !(cfg.fallbackToWiswits && !cfg.isUsingDefault);
    const available = !!cfg.apiKey && !!cfg.isActive && !overBudget;
    let reason = null;
    if (!available) reason = !cfg.isActive ? 'disabled' : (overBudget ? 'quota_exceeded' : 'coming_soon');
    return res.json({ success: true, data: { available, reason } });
  } catch (e) {
    console.error('[ai-tools.status]', e);
    return res.json({ success: true, data: { available: false, reason: 'coming_soon' } });
  }
});

// Added by audit script — list available tools
router.get('/list', authenticate, async (req, res) => {
  return res.json({
    status: 'success',
    data: {
      tools: [
        { id: 'lesson-plan',    name: 'Lesson Plan Generator', icon: 'BookOpen' },
        { id: 'question-gen',   name: 'Question Generator',    icon: 'FileQuestion' },
        { id: 'essay-grader',   name: 'Essay Grader',          icon: 'CheckSquare' },
        { id: 'doubt-solver',   name: 'Doubt Solver',          icon: 'HelpCircle' },
        { id: 'weak-alerts',    name: 'Weak Area Alerts',      icon: 'AlertTriangle' },
        { id: 'report-cards',   name: 'AI Report Cards',       icon: 'FileText' },
        { id: 'weekly-insights',name: 'Weekly Insights',       icon: 'Activity' }
      ]
    }
  });
});


// ============================================================
// AI REPORT CARD REMARKS
// ============================================================
router.post('/report-card-remark', authenticate, aiStaff, async (req, res) => {
  try {
    const { student_name, scores, attendance_pct, behavior } = req.body;
    if (!student_name) return res.status(400).json({ success: false, message: 'student_name required' });

    const sys = `You are a kind but honest school teacher writing report card remarks.
Use warm, encouraging language with specific suggestions.`;

    const userPrompt = `Write a 3-4 sentence report card remark for ${student_name}.
Scores: ${JSON.stringify(scores || {})}
Attendance: ${attendance_pct || 'N/A'}%
Behavior: ${behavior || 'Good'}

Tone: warm, specific, actionable. End with encouragement for next term.`;

    const result = await aiGateway.complete({
      orgId: req.user.org_id,
      userId: req.user.user_id,
      feature: 'report_remark',
      prompt: userPrompt,
      systemPrompt: sys,
      maxTokens: 300,
      temperature: 0.7,
      refType: 'aitools_remark',
    });

    res.json({ success: true, remark: result.text.trim(), aiCost: result.cost });
  } catch (e) {
    console.error('[ai-tools.remark]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});


// ============================================================
// AI DOUBT SOLVER — student asks, AI explains step-by-step
// ============================================================
router.post('/doubt-solver', authenticate, async (req, res) => {
  try {
    const { question, subject, grade } = req.body;
    const q = (question || '').trim();
    if (q.length < 5) return res.status(400).json({ success: false, message: 'Please type your doubt (at least a short sentence).' });
    if (q.length > 2000) return res.status(400).json({ success: false, message: 'Please keep your doubt under 2000 characters.' });

    const sys = `You are a friendly, patient tutor for Indian school students (CBSE/ICSE/State boards).
Explain step-by-step in simple language a school student understands. Use short paragraphs and numbered steps.
If the question is ambiguous, answer the most likely interpretation and say so.
If it is not an academic question, politely redirect the student to ask a study-related doubt.
Output ONLY valid JSON.`;

    const userPrompt = `Student doubt${subject ? ' (Subject: ' + subject + ')' : ''}${grade ? ' (Class: ' + grade + ')' : ''}:
"""${q}"""

Output JSON:
{
  "answer": "clear step-by-step explanation (plain text, use \\n for line breaks and numbered steps)",
  "key_concept": "the one core concept behind this doubt",
  "example": "one short worked example or analogy",
  "practice_tip": "one sentence on how to practice this",
  "related_topics": ["..."]
}`;

    const result = await aiGateway.complete({
      orgId: req.user.org_id,
      userId: req.user.user_id,
      feature: 'doubt_solver',
      prompt: userPrompt,
      systemPrompt: sys,
      maxTokens: 1200,
      temperature: 0.4,
      refType: 'aitools_doubt',
    });

    let parsed;
    try {
      const clean = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      // Fall back to raw text so the student still gets an answer
      parsed = { answer: result.text, key_concept: null, example: null, practice_tip: null, related_topics: [] };
    }
    // Doubt History (§25): persist question + parsed answer for later revisits
    let doubtId = null;
    try {
      const [ins] = await db.pool.execute(
        `INSERT INTO client_student_doubts (org_id, user_id, subject, question, answer)
         VALUES (?,?,?,?,?)`,
        [req.user.org_id, req.user.user_id, subject || null, q, JSON.stringify(parsed)]
      );
      doubtId = ins.insertId;
    } catch {}
    res.json({ success: true, data: parsed, doubt_id: doubtId, usage: { tokens: result.tokens_used, cost_inr: result.cost_inr } });
  } catch (e) {
    console.error('[ai-tools.doubt-solver]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});

// Doubt History (§25) — own doubts only, newest first; ?bookmarked=1 filters
router.get('/doubt-solver/history', authenticate, async (req, res) => {
  try {
    let where = 'WHERE org_id=? AND user_id=?';
    const params = [req.user.org_id, req.user.user_id];
    if (req.query.bookmarked == 1) where += ' AND is_bookmarked=1';
    const [rows] = await db.pool.execute(
      `SELECT id, subject, question, answer, is_bookmarked, created_at
         FROM client_student_doubts ${where}
        ORDER BY created_at DESC, id DESC LIMIT 30`, params);
    res.json({ success: true, data: { doubts: rows.map(r => ({
      ...r,
      answer: (() => { try { return typeof r.answer === 'string' ? JSON.parse(r.answer) : r.answer; } catch { return null; } })(),
    })) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/doubt-solver/history/:id/bookmark', authenticate, async (req, res) => {
  try {
    await db.pool.execute(
      `UPDATE client_student_doubts SET is_bookmarked=1-is_bookmarked
        WHERE id=? AND org_id=? AND user_id=?`,
      [req.params.id, req.user.org_id, req.user.user_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ============================================================
// WEEKLY INSIGHTS — parent/student: last-7-day snapshot + AI summary
// ============================================================
router.get('/weekly-insights', authenticate, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const uid = req.user.user_id;

    // Resolve target student: self (student) or linked child (parent)
    let studentId = req.query.student_id ? parseInt(req.query.student_id) : null;
    const selfStudent = await db.pool.execute('SELECT id FROM client_students WHERE org_id=? AND user_id=?', [orgId, uid]).then(([r]) => r[0]);
    const parentRow = await db.pool.execute('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [orgId, uid]).then(([r]) => r[0]);

    if (!studentId) {
      if (selfStudent) studentId = selfStudent.id;
      else if (parentRow) {
        const [links] = await db.pool.execute('SELECT student_id FROM client_parent_students WHERE org_id=? AND parent_id=? AND COALESCE(status,\'active\')=\'active\' ORDER BY is_primary DESC LIMIT 1', [orgId, parentRow.id]);
        if (links.length) studentId = links[0].student_id;
      }
    }
    if (!studentId) return res.status(404).json({ success: false, message: 'No linked student found' });

    // Authorization: self, linked parent, or staff (teacher+)
    const isSelf = selfStudent && selfStudent.id === studentId;
    let isLinkedParent = false;
    if (parentRow) {
      const [l] = await db.pool.execute('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parentRow.id, studentId]);
      isLinkedParent = l.length > 0;
    }
    const roleSlug = (req.user.role_slug || '').toLowerCase();
    const isStaff = ['owner','admin','principal','super_admin','system_admin','teacher','hod'].includes(roleSlug);
    if (!isSelf && !isLinkedParent && !isStaff) return res.status(403).json({ success: false, message: 'Not permitted' });

    const [[studentInfo]] = await db.pool.execute(
      `SELECT s.id, u.first_name, u.last_name FROM client_students s JOIN client_users u ON u.id=s.user_id WHERE s.id=? AND s.org_id=?`,
      [studentId, orgId]);
    if (!studentInfo) return res.status(404).json({ success: false, message: 'Student not found' });

    // Deterministic 7-day snapshot (all org-scoped)
    const [[att]] = await db.pool.execute(
      `SELECT COUNT(*) total, SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) present
       FROM client_attendance_records ar
       JOIN client_attendance_sessions se ON se.id = ar.session_id
       WHERE ar.org_id=? AND ar.student_id=? AND se.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [orgId, studentId]);
    const [[quiz]] = await db.pool.execute(
      `SELECT COUNT(*) attempts, ROUND(AVG(percentage),1) avg_pct
       FROM client_quiz_attempts
       WHERE org_id=? AND student_id=? AND submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [orgId, studentId]);
    const [weak] = await db.pool.execute(
      `SELECT severity, COUNT(*) n FROM client_student_weak_areas
       WHERE org_id=? AND student_id=? AND level='topic' GROUP BY severity`,
      [orgId, studentId]);
    const weakMap = {}; weak.forEach(w => { weakMap[w.severity] = w.n; });
    const [[profile]] = await db.pool.execute(
      `SELECT ai_label FROM client_student_learning_profiles WHERE student_id=? ORDER BY id DESC LIMIT 1`,
      [studentId]).catch(() => [[null]]);

    const snapshot = {
      student: { id: studentInfo.id, name: (studentInfo.first_name + ' ' + (studentInfo.last_name || '')).trim() },
      attendance: { sessions: att.total || 0, present: Number(att.present) || 0 },
      quizzes: { attempts: quiz.attempts || 0, avg_pct: quiz.avg_pct != null ? Number(quiz.avg_pct) : null },
      weak_areas: { critical: weakMap.critical || 0, weak: weakMap.weak || 0, attention: weakMap.attention || 0, mastered: weakMap.mastered || 0 },
      profile_label: profile ? profile.ai_label : null,
    };

    // AI summary (best-effort; snapshot is returned even if AI fails)
    let summary = null;
    try {
      const result = await aiGateway.complete({
        orgId, userId: uid, feature: 'weekly_insights',
        systemPrompt: 'You write short, warm, specific weekly progress notes for Indian school parents. 3 sentences max: 1 win, 1 concern, 1 action for next week. No preamble. Plain text only.',
        prompt: `Child: ${snapshot.student.name}
Attendance last 7 days: ${snapshot.attendance.present}/${snapshot.attendance.sessions} sessions present
Quizzes last 7 days: ${snapshot.quizzes.attempts} attempts, average ${snapshot.quizzes.avg_pct != null ? snapshot.quizzes.avg_pct + '%' : 'n/a'}
Weak topics: ${snapshot.weak_areas.critical} critical, ${snapshot.weak_areas.weak} weak, ${snapshot.weak_areas.mastered} mastered
Learning profile: ${snapshot.profile_label || 'not built yet'}`,
        maxTokens: 220, temperature: 0.5, refType: 'aitools_weekly',
      });
      summary = result.text.trim();
    } catch (e) { console.error('[weekly-insights ai]', e.message); }

    res.json({ success: true, data: { ...snapshot, summary } });
  } catch (e) {
    console.error('[ai-tools.weekly-insights]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});

// ============================================================
// TEACHER AI SUGGESTION (SUG-0008) — replaces the hardcoded
// "Today's AI Suggestion" widget with a real, class-scoped nudge.
// Deterministic snapshot (weakest section-subject this teacher teaches
// + overdue assignments) → short AI suggestion. Snapshot always returned;
// AI text is best-effort. Teacher/staff only, org- and ownership-scoped.
// ============================================================
router.get('/teacher-suggestion', authenticate, aiStaff, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const uid = req.user.user_id;

    // Weakest (section, subject) this teacher actually teaches, by exam average.
    // Same timetable-scoped join as the teacher performance widget, additionally
    // constrained to the teacher's own subject for that section.
    let focus = null;
    try {
      const [rows] = await db.pool.execute(
        `SELECT c.name AS class_name, sec.name AS section_name, sub.name AS subject_name,
                ROUND(AVG((m.marks_obtained/es.max_marks)*100),1) AS avg_pct,
                COUNT(DISTINCT m.student_id) AS students
           FROM client_exam_marks m
           JOIN client_exam_subjects es ON es.id=m.exam_subject_id
           JOIN client_exams e ON e.id=m.exam_id
           JOIN client_enrollments en ON en.student_id=m.student_id AND en.status='active'
           JOIN client_sections sec ON sec.id=en.section_id
           JOIN client_classes c ON c.id=sec.class_id
           JOIN client_subjects sub ON sub.id=es.subject_id
           JOIN client_timetable_slots ts ON ts.section_id=sec.id AND ts.subject_id=es.subject_id
                AND ts.teacher_id=? AND ts.org_id=m.org_id
          WHERE m.org_id=? AND m.is_absent=0 AND e.status IN ('published','completed','ongoing')
          GROUP BY sec.id, es.subject_id
          HAVING COUNT(*) > 0
          ORDER BY avg_pct ASC
          LIMIT 1`, [uid, orgId]);
      if (rows.length) {
        const r = rows[0];
        focus = {
          class_name: r.class_name, section_name: r.section_name, subject_name: r.subject_name,
          avg_pct: r.avg_pct != null ? Number(r.avg_pct) : null, students: Number(r.students) || 0,
        };
      }
    } catch (e) { console.error('[teacher-suggestion focus]', e.message); }

    // Overdue assignments owned by this teacher (nudge to grade/follow up).
    let overdue = 0;
    try {
      const [[row]] = await db.pool.execute(
        `SELECT COUNT(*) AS n FROM client_assignments
          WHERE org_id=? AND teacher_id=? AND due_date IS NOT NULL AND due_date < NOW()
            AND status IN ('published','active')`, [orgId, uid]);
      overdue = Number(row?.n) || 0;
    } catch (e) { /* column set may differ; non-fatal */ }

    const snapshot = { focus, overdue_assignments: overdue };

    // Deterministic fallback so the widget is never empty even if AI is off.
    let suggestion;
    if (focus && focus.avg_pct != null) {
      const cls = `${focus.class_name}${focus.section_name ? ' - ' + focus.section_name : ''}`;
      suggestion = `${cls} is averaging ${focus.avg_pct}% in ${focus.subject_name}. Consider a short practice set on the weakest topics this week.`;
    } else {
      suggestion = 'No exam data yet for your classes. Once marks are entered, you’ll get targeted practice suggestions here.';
    }

    // Best-effort AI upgrade of the suggestion text.
    if (focus && focus.avg_pct != null) {
      try {
        const result = await aiGateway.complete({
          orgId, userId: uid, feature: 'teacher_suggestion',
          systemPrompt: 'You advise Indian school teachers. Reply in ONE specific, encouraging sentence (max 30 words) suggesting a concrete next action for the weakest class. Plain text, no preamble.',
          prompt: `Class: ${focus.class_name}${focus.section_name ? ' - ' + focus.section_name : ''}
Subject: ${focus.subject_name}
Class average: ${focus.avg_pct}%
Students: ${focus.students}
Overdue assignments to review: ${overdue}`,
          maxTokens: 90, temperature: 0.5, refType: 'aitools_teacher_suggestion',
        });
        if (result?.text?.trim()) suggestion = result.text.trim();
      } catch (e) { console.error('[teacher-suggestion ai]', e.message); }
    }

    res.json({ success: true, data: { ...snapshot, suggestion } });
  } catch (e) {
    console.error('[ai-tools.teacher-suggestion]', e);
    res.status(e.code === 'AI_COMING_SOON' ? 200 : 500).json({ success: false, coming_soon: e.code === 'AI_COMING_SOON', message: e.message });
  }
});

module.exports = router;
