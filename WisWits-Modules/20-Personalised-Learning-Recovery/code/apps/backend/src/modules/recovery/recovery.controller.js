'use strict';
const db = require('../../config/db');
const detector = require('../../services/recovery/weakAreaDetector');
// ONE definition of accuracy / rounding / confidence / label — utils/weakArea.js.
const wa = require('../../utils/weakArea');

// POST /api/recovery/weak-areas/recalculate
// Admin/teacher manual trigger. Optional ?student_id= or ?class_id= or all
exports.recalculate = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { student_id, class_id } = req.query;

    if (student_id) {
      const r = await detector.calculateForStudent(parseInt(student_id), orgId);
      return res.json({ success: true, scope: 'student', ...r });
    }

    if (class_id) {
      // get all students in class
      const [students] = await db.pool.execute(
        'SELECT id FROM client_students WHERE org_id = ? AND class_id = ?',
        [orgId, parseInt(class_id)]
      );
      let processed = 0, topicsTotal = 0, errors = 0;
      for (const s of students) {
        try {
          const r = await detector.calculateForStudent(s.id, orgId);
          if (r.ok) { processed++; topicsTotal += (r.topicsAnalyzed || 0); }
        } catch { errors++; }
      }
      return res.json({ success: true, scope: 'class', class_id: parseInt(class_id), processed, topicsTotal, errors });
    }

    const r = await detector.calculateForOrg(orgId);
    return res.json({ success: true, scope: 'org', ...r });
  } catch (err) {
    console.error('[recovery.recalculate]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/weak-areas/student/:id
// Get weak areas for ONE student (admin/teacher view)
exports.getStudentWeakAreas = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const studentId = parseInt(req.params.id);
    const { level: rawLevel = 'topic', severity } = req.query;
    // The table holds one row per level for the SAME performance — an unpinned
    // level shows the identical weakness two or three times (QA round 7).
    const level = wa.WEAK_AREA_LEVELS.includes(String(rawLevel)) ? String(rawLevel) : 'topic';
    // `unproven` is a CONFIDENCE bucket, not a stored severity — it is applied
    // after the rows are merged, never as SQL on the enum column.
    const severityFilter = severity && severity !== 'unproven' ? String(severity) : null;
    const statusFilter = severity ? String(severity) : null;

    let sql = `
      SELECT w.*,
        s.name AS subject_name,
        c.name AS chapter_name,
        t.name AS topic_name,
        st.name AS subtopic_name
      FROM client_student_weak_areas w
      LEFT JOIN client_qb_subjects s ON s.id = w.subject_id
      LEFT JOIN client_qb_chapters c ON c.id = w.chapter_id
      LEFT JOIN client_qb_topics t ON t.id = w.topic_id
      LEFT JOIN client_qb_subtopics st ON st.id = w.subtopic_id
      WHERE w.student_id = ? AND w.org_id = ? AND w.level = ?
    `;
    const params = [studentId, orgId, level];
    if (severityFilter) {
      sql += ' AND w.severity = ?';
      params.push(severityFilter);
    }
    sql += ' ORDER BY w.severity_score DESC, w.accuracy_pct ASC';

    const [rows] = await db.pool.execute(sql, params);

    // Two rows can legitimately share a display name — either the topic
    // catalog itself has duplicate name entries (different topic_id, same
    // text), or a topic-level query can pick up multiple subtopic-level rows
    // whose topic_name JOIN resolves identically. Either way, the STUDENT
    // sees the same label 5x, which reads as a broken feature. Aggregate by
    // display name: combine attempts (weighted accuracy), keep the worst
    // severity, and derive the summary counts from this SAME deduped set —
    // otherwise the headline counts can never agree with what's rendered.
    const SEVERITY_RANK = wa.SEVERITY_RANK;
    const byName = new Map();
    for (const r of rows) {
      const name = r.topic_name || r.subtopic_name || r.chapter_name || r.subject_name || `#${r.id}`;
      const existing = byName.get(name);
      if (!existing) { byName.set(name, { ...r, _name: name }); continue; }
      existing.total_attempts = (Number(existing.total_attempts) || 0) + (Number(r.total_attempts) || 0);
      existing.correct_attempts = (Number(existing.correct_attempts) || 0) + (Number(r.correct_attempts) || 0);
      if (SEVERITY_RANK[r.severity] > SEVERITY_RANK[existing.severity]) existing.severity = r.severity;
      if (r.severity_score > existing.severity_score) existing.severity_score = r.severity_score;
    }

    // ONE derivation for every merged row: accuracy, rounding, confidence and
    // the displayed label all come from describe() — the same call the
    // dashboard widget makes, so the two surfaces cannot drift apart again.
    let items = Array.from(byName.values()).map(({ _name, ...rest }) => {
      const d = wa.describe({ ...rest, name: _name });
      return {
        ...rest,
        accuracy_pct: d.accuracy,       // 0–100, 1 dp, null when no attempts
        status: d.status,               // critical|weak|attention|mastered|unproven
        confidence: d.confidence,       // none|low|high
        status_label: d.label,
        headline: d.headline,
      };
    });
    if (statusFilter) items = items.filter(it => it.status === statusFilter);

    // Counts derive from the SAME list that is rendered — a topic badged
    // "Not enough practice" is counted as unproven, never as attention.
    const summary = wa.emptySummary();
    items.forEach(it => { if (summary[it.status] != null) summary[it.status]++; });

    return res.json({ success: true, level, summary, items });
  } catch (err) {
    console.error('[recovery.getStudentWeakAreas]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/weak-areas/me
// Student's own weak areas
exports.getMyWeakAreas = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;

    const [studentRow] = await db.pool.execute(
      'SELECT id FROM client_students WHERE user_id = ? AND org_id = ?',
      [userId, orgId]
    );
    if (!studentRow.length) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    const studentId = studentRow[0].id;
    req.params.id = studentId;
    return exports.getStudentWeakAreas(req, res);
  } catch (err) {
    console.error('[recovery.getMyWeakAreas]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/weak-areas/class/:classId
// Class-wide heatmap (admin/teacher)
exports.getClassWeakAreas = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const classId = parseInt(req.params.classId);

    const [rows] = await db.pool.execute(`
      SELECT
        t.id AS topic_id,
        t.name AS topic_name,
        c.name AS chapter_name,
        s.name AS subject_name,
        COUNT(DISTINCT w.student_id) AS students_count,
        SUM(w.total_attempts) AS total_attempts,
        SUM(w.correct_attempts) AS correct_attempts,
        ${wa.accuracyPctSql('w.correct_attempts', 'w.total_attempts')} AS avg_accuracy,
        SUM(CASE WHEN w.severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
        SUM(CASE WHEN w.severity = 'weak' THEN 1 ELSE 0 END) AS weak_count,
        SUM(CASE WHEN w.severity = 'mastered' THEN 1 ELSE 0 END) AS mastered_count
      FROM client_student_weak_areas w
      -- SEMI-join, not a JOIN: a student with two active enrollments would
      -- otherwise multiply every one of their rows into the SUM()s.
      JOIN client_students st ON st.id = w.student_id AND st.org_id = w.org_id
      LEFT JOIN client_qb_topics t ON t.id = w.topic_id
      LEFT JOIN client_qb_chapters c ON c.id = w.chapter_id
      LEFT JOIN client_qb_subjects s ON s.id = w.subject_id
      WHERE w.org_id = ? AND w.level = 'topic'
        AND EXISTS (
          SELECT 1 FROM client_enrollments e
            JOIN client_sections sec ON sec.id = e.section_id
           WHERE e.student_id = st.id AND e.status = 'active' AND sec.class_id = ?
        )
      GROUP BY t.id, t.name, c.name, s.name
      ORDER BY avg_accuracy IS NULL, avg_accuracy ASC
    `, [orgId, classId]);

    // Same describe() as every other surface, so the class table's accuracy and
    // the student drill-down can never print two different numbers.
    const items = rows.map(r => {
      const d = wa.describe({
        severity: Number(r.critical_count) ? 'critical' : Number(r.weak_count) ? 'weak' : 'attention',
        correct_attempts: r.correct_attempts,
        total_attempts: r.total_attempts,
        name: r.topic_name || 'this topic',
      });
      return { ...r, avg_accuracy: d.accuracy, confidence: d.confidence, status: d.status, status_label: d.label };
    });

    return res.json({ success: true, items });
  } catch (err) {
    console.error('[recovery.getClassWeakAreas]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const profileBuilder = require('../../services/recovery/learningProfileBuilder');

// POST /api/recovery/profile/build — admin/teacher trigger
exports.buildProfile = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { student_id, use_ai = true } = req.body;

    if (student_id) {
      const r = await profileBuilder.buildForStudent(parseInt(student_id), orgId, { useAI: use_ai });
      return res.json({ success: true, ...r });
    }
    const r = await profileBuilder.buildForOrg(orgId, { useAI: use_ai });
    return res.json({ success: true, ...r });
  } catch (err) {
    console.error('[recovery.buildProfile]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/profile/student/:id
exports.getStudentProfile = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const studentId = parseInt(req.params.id);
    const [rows] = await db.pool.execute(
      'SELECT * FROM client_student_learning_profiles WHERE student_id = ? AND org_id = ?',
      [studentId, orgId]
    );
    if (!rows.length) return res.json({ success: true, profile: null, message: 'No profile yet — run build first' });
    const p = rows[0];
    if (typeof p.ai_recommendations === 'string') {
      try { p.ai_recommendations = JSON.parse(p.ai_recommendations); } catch {}
    }
    return res.json({ success: true, profile: p });
  } catch (err) {
    console.error('[recovery.getStudentProfile]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/profile/me
exports.getMyProfile = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const [studentRow] = await db.pool.execute(
      'SELECT id FROM client_students WHERE user_id = ? AND org_id = ?',
      [userId, orgId]
    );
    if (!studentRow.length) return res.status(404).json({ success: false, message: 'Student not found' });
    req.params.id = studentRow[0].id;
    return exports.getStudentProfile(req, res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const worksheetGen = require('../../services/recovery/worksheetGenerator');
const pdfGen = require('../../services/recovery/pdfGenerator');

// POST /api/recovery/worksheets/generate
exports.generateWorksheet = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.user_id;
    const { student_id, difficulty = 'medium', topic_ids = null, use_ai = true, draft = false } = req.body;
    if (!student_id) return res.status(400).json({ success: false, message: 'student_id required' });

    const result = await worksheetGen.generateWorksheet({
      studentId: parseInt(student_id),
      orgId, userId,
      difficulty,
      topicIds: topic_ids,
      useAI: use_ai,
      draft: !!draft,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[recovery.generateWorksheet]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/worksheets/:id
exports.getWorksheet = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const ws = await worksheetGen.getWorksheetById(parseInt(req.params.id), orgId);
    if (!ws) return res.status(404).json({ success: false, message: 'Worksheet not found' });
    return res.json({ success: true, worksheet: ws });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/worksheets/:id/pdf  (?key=1 for answer key)
exports.downloadWorksheetPDF = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const showAnswers = !!req.query.key;
    const ws = await worksheetGen.getWorksheetById(parseInt(req.params.id), orgId);
    if (!ws) return res.status(404).json({ success: false, message: 'Worksheet not found' });
    const pdf = await pdfGen.generatePDF(ws, { showAnswers });
    return res.json({ success: true, pdf_url: pdf.url, filename: pdf.filename });
  } catch (err) {
    console.error('[recovery.downloadWorksheetPDF]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/recovery/worksheets/student/:id
exports.listStudentWorksheets = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const studentId = parseInt(req.params.id);
    const [rows] = await db.pool.execute(`
      SELECT w.id, w.difficulty, w.total_questions, w.total_marks, w.time_limit_min,
             w.attempt_status, w.score_pct, w.pdf_url, w.pdf_answer_key_url,
             w.assigned_at AS created_at, w.submitted_at,
             w.ai_provider, w.ai_cost_inr, w.generated_by, w.topic_ids
      FROM client_recovery_worksheets w
      LEFT JOIN client_student_weak_areas swa ON swa.id = w.weak_area_id
      WHERE w.org_id = ?
        AND (
          swa.student_id = ?
          OR w.id IN (
            SELECT worksheet_id FROM client_worksheet_assignments
            WHERE student_id = ? AND org_id = ?
          )
          OR w.weak_area_id IS NULL
        )
      ORDER BY w.assigned_at DESC
      LIMIT 50
    `, [orgId, studentId, studentId, orgId]);
    return res.json({ success: true, worksheets: rows });
  } catch (err) {
    console.error('[recovery.listStudentWorksheets]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
