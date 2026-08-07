const express = require('express');
const router  = express.Router();
const { pool, query, queryOne, transaction } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { tempPassword } = require('../../utils/tempPassword');
const { authenticate } = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requireRole } = require('../../middleware/rbac');
const logger = require('../../utils/logger');
const crmSvc = require('../../services/crmService');
// One counter per (org, session), allocated atomically — see
// modules/admissions/core/series.queries.js. Used when converting a lead.
const { allocateNumber: allocateAdmissionNumber } = require('../admissions/core/series.queries');
const { audit } = require('../../utils/audit');
const { getActiveSchool, getWriteSchool, BRANCH_SQL } = require('../../utils/activeSchool');
const notifSvc = require('../../services/notificationService');
const { safePct } = require('../../utils/pct');
const meters = require('../../services/meters');

router.use(authenticate);
// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('admissions'));
// CRM (sales leads + PII) is an admin/sales surface — gate the whole router so
// students/parents/teachers cannot read or enumerate lead data.
router.use(requireRole('owner', 'admin', 'principal'));

// ─── STAGES ────────────────────────────────────────────────────────────────
router.get('/stages', async (req, res) => {
  try {
    const o = req.user.org_id;
    await crmSvc.ensureLeadStages(o); // self-heal: seed the default pipeline if none
    const rows = await query(
      `SELECT * FROM client_lead_stages WHERE org_id=? AND is_active=1 ORDER BY sort_order`,
      [o]
    );
    return success(res, { stages: rows });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/stages', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { name, stage_key, sort_order, color, is_terminal, is_won } = req.body;
    if (!name || !stage_key) return error(res, 'name and stage_key required', 400);

    const r = await query(
      `INSERT INTO client_lead_stages (org_id, name, stage_key, sort_order, color, is_terminal, is_won)
       VALUES (?,?,?,?,?,?,?)`,
      [o, name, stage_key, sort_order||99, color||'#6b7280', is_terminal?1:0, is_won?1:0]
    );
    return success(res, { id: r.insertId }, 'Stage created', 201);
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/stages/:id', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { name, sort_order, color, is_terminal, is_won, is_active } = req.body;
    await query(
      `UPDATE client_lead_stages SET
        name=COALESCE(?,name), sort_order=COALESCE(?,sort_order),
        color=COALESCE(?,color), is_terminal=COALESCE(?,is_terminal),
        is_won=COALESCE(?,is_won), is_active=COALESCE(?,is_active)
       WHERE id=? AND org_id=?`,
      [name||null, sort_order||null, color||null,
       is_terminal!==undefined?(is_terminal?1:0):null,
       is_won!==undefined?(is_won?1:0):null,
       is_active!==undefined?(is_active?1:0):null,
       req.params.id, o]
    );
    return success(res, {}, 'Stage updated');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── DUPLICATES CHECK (called before create) ──────────────────────────────
router.post('/leads/check-duplicates', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { phone, first_name, last_name, email } = req.body;
    const matches = await crmSvc.findDuplicates(o, { phone, first_name, last_name, email }, await getActiveSchool(req));
    return success(res, { matches, has_duplicates: matches.length > 0 });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── LEADS CRUD ────────────────────────────────────────────────────────────
router.get('/leads', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { stage_id, assigned_to, temperature, search, is_won, is_lost, limit = 100 } = req.query;

    let where = 'WHERE l.org_id=?';
    const params = [o];
    // A lead belongs to the campus it applied to. NULL = not yet assigned to
    // one (every public enquiry starts that way), and stays visible to every
    // branch's admissions desk until somebody claims it.
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND (l.school_id IS NULL OR l.school_id=?)'; params.push(activeSchool); }
    if (stage_id)    { where += ' AND l.stage_id=?';    params.push(stage_id); }
    if (assigned_to) { where += ' AND l.assigned_to=?'; params.push(assigned_to); }
    if (temperature) { where += ' AND l.temperature=?'; params.push(temperature); }
    if (is_won==='1')  { where += ' AND l.is_won=1'; }
    if (is_lost==='1') { where += ' AND l.is_lost=1'; }
    if (is_won==='0' && is_lost==='0') { where += ' AND l.is_won=0 AND l.is_lost=0'; }
    if (search) {
      where += ' AND (l.first_name LIKE ? OR l.last_name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // pool.query, not query()/execute: mysql2's prepared-statement protocol
    // rejects `LIMIT ?` with ER_WRONG_ARGUMENTS. MariaDB (prod) tolerates it and
    // MySQL does not, so this route has always worked on the server and always
    // 500'd on a local MySQL — the exact direction of drift that hides until
    // someone runs the real thing locally. Same treatment the other paginated
    // selects in this codebase already carry. query() still escapes the `?`.
    const [rows] = await pool.query(
      `SELECT l.*,
        s.name AS stage_name, s.color AS stage_color, s.stage_key,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS assigned_name,
        (SELECT COUNT(*) FROM client_lead_activities WHERE lead_id=l.id) AS activity_count,
        (SELECT MAX(performed_at) FROM client_lead_activities WHERE lead_id=l.id) AS last_activity_at
       FROM client_leads l
       LEFT JOIN client_lead_stages s ON s.id=l.stage_id
       LEFT JOIN client_users u ON u.id=l.assigned_to
       ${where}
       ORDER BY l.created_at DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

    return success(res, { leads: rows });
  } catch(e) { logger.error('Leads list:',e); return error(res, e.message, 500); }
});

// Pipeline view (grouped by stage)
router.get('/leads/pipeline', async (req, res) => {
  try {
    const o = req.user.org_id;
    await crmSvc.ensureLeadStages(o); // self-heal: seed the default pipeline if none
    const stages = await query(
      `SELECT * FROM client_lead_stages WHERE org_id=? AND is_active=1 ORDER BY sort_order`, [o]
    );
    const pipeSchool = await getActiveSchool(req);
    const leads = await query(
      `SELECT l.*, 
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS assigned_name
       FROM client_leads l
       LEFT JOIN client_users u ON u.id=l.assigned_to
       WHERE l.org_id=? AND l.is_won=0 AND l.is_lost=0
         AND (? IS NULL OR l.school_id IS NULL OR l.school_id = ?)
       ORDER BY l.created_at DESC`, [o, pipeSchool, pipeSchool]
    );

    const byStage = {};
    stages.forEach(s => { byStage[s.stage_key] = { stage: s, leads: [] }; });
    leads.forEach(l => {
      // NEVER silently drop a lead: one whose stage_id is null or points at a
      // removed/inactive stage falls into the first stage instead of vanishing
      // from the board (this is how the public-form enquiry went missing).
      const stage = stages.find(s => s.id === l.stage_id) || stages[0];
      if (stage) byStage[stage.stage_key].leads.push(l);
    });

    const stats = {
      total_open: leads.length,
      total_hot: leads.filter(l => l.temperature==='hot').length,
      total_warm: leads.filter(l => l.temperature==='warm').length,
      total_cold: leads.filter(l => l.temperature==='cold').length,
      followups_today: leads.filter(l => l.next_followup_at && new Date(l.next_followup_at).toDateString() === new Date().toDateString()).length,
    };

    return success(res, { pipeline: byStage, stages, stats });
  } catch(e) { return error(res, e.message, 500); }
});

// Counselor: my leads
router.get('/leads/mine', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const mineSchool = await getActiveSchool(req);
    const leads = await query(
      `SELECT l.*, s.name AS stage_name, s.color AS stage_color
       FROM client_leads l
       LEFT JOIN client_lead_stages s ON s.id=l.stage_id
       WHERE l.org_id=? AND l.assigned_to=? AND l.is_won=0 AND l.is_lost=0
         AND (? IS NULL OR l.school_id IS NULL OR l.school_id = ?)
       ORDER BY 
         CASE WHEN l.next_followup_at < NOW() THEN 0 ELSE 1 END,
         l.next_followup_at ASC,
         l.created_at DESC`, [o, uid, mineSchool, mineSchool]
    );
    return success(res, { leads });
  } catch(e) { return error(res, e.message, 500); }
});

// Single lead detail + activity timeline
router.get('/leads/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const detailSchool = await getActiveSchool(req);
    const lead = await queryOne(
      `SELECT l.*, 
        s.name AS stage_name, s.color AS stage_color, s.stage_key,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS assigned_name,
        u.email AS assigned_email
       FROM client_leads l
       LEFT JOIN client_lead_stages s ON s.id=l.stage_id
       LEFT JOIN client_users u ON u.id=l.assigned_to
       WHERE l.id=? AND l.org_id=? AND (? IS NULL OR l.school_id IS NULL OR l.school_id = ?)`,
      [req.params.id, o, detailSchool, detailSchool]
    );
    if (!lead) return error(res, 'Lead not found', 404);

    const activities = await query(
      `SELECT a.*,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS performer_name
       FROM client_lead_activities a
       LEFT JOIN client_users u ON u.id=a.performed_by
       WHERE a.lead_id=? AND a.org_id=?
       ORDER BY a.performed_at DESC`, [req.params.id, o]
    );

    const demos = await query(
      `SELECT d.*, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS faculty_name
       FROM client_lead_demos d
       LEFT JOIN client_users u ON u.id=d.faculty_id
       WHERE d.lead_id=? AND d.org_id=?
       ORDER BY d.scheduled_at DESC`, [req.params.id, o]
    );

    return success(res, { lead, activities, demos });
  } catch(e) { return error(res, e.message, 500); }
});

// CREATE lead
router.post('/leads', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      first_name, last_name, phone, alt_phone, email,
      parent_name, parent_phone,
      target_class, target_exam, target_subjects, target_batch_id,
      source, source_detail, utm_source, utm_campaign, referrer_name,
      stage_id, assigned_to, temperature, notes, next_followup_at,
      force_create  // set true to skip duplicate check (from merge flow)
    } = req.body;

    if (!first_name || !phone) return error(res, 'first_name and phone required', 400);

    // Duplicate check (unless force_create)
    if (!force_create) {
      const dupes = await crmSvc.findDuplicates(
        o, { phone, first_name, last_name, email }, await getActiveSchool(req));
      if (dupes.length > 0) {
        return success(res, {
          duplicate_found: true,
          matches: dupes,
        }, 'Duplicates found — review and decide');
      }
    }

    // Auto-assign if not set
    let finalAssignee = assigned_to;
    if (!finalAssignee) {
      const nextC = await crmSvc.pickNextCounselor(o);
      finalAssignee = nextC?.id || null;
    }

    // Default stage: first active stage ("New")
    let finalStage = stage_id;
    if (!finalStage) {
      const firstStage = await queryOne(
        `SELECT id FROM client_lead_stages WHERE org_id=? AND is_active=1 ORDER BY sort_order LIMIT 1`, [o]
      );
      finalStage = firstStage?.id || null;
    }

    // getWriteSchool, not getActiveSchool: an applicant applies to a CAMPUS, and
    // a lead left NULL is org-wide — which would make every branch predicate on
    // this table inert, because nothing else ever writes the column. An admin
    // creating a lead is standing at a campus, so the active branch (or the
    // org's primary, for an unscoped caller) is the honest answer. The public
    // enquiry form is the deliberate exception — see publicForms.controller.
    const leadSchoolId = await getWriteSchool(req);

    const r = await query(
      `INSERT INTO client_leads (
        org_id, school_id, first_name, last_name, phone, alt_phone, email,
        parent_name, parent_phone,
        target_class, target_exam, target_subjects, target_batch_id,
        source, source_detail, utm_source, utm_campaign, referrer_name,
        stage_id, assigned_to, temperature, notes, next_followup_at, created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [o, leadSchoolId, first_name, last_name||null, phone, alt_phone||null, email||null,
       parent_name||null, parent_phone||null,
       target_class||null, target_exam||null, target_subjects||null, target_batch_id||null,
       source||'walk_in', source_detail||null, utm_source||null, utm_campaign||null, referrer_name||null,
       finalStage, finalAssignee, temperature||'warm', notes||null,
       next_followup_at||null, req.user.user_id]
    );

    // Log activity
    await crmSvc.logActivity(o, r.insertId, {
      type: 'note',
      title: 'Lead created',
      description: `Source: ${source||'walk_in'}`,
      performed_by: req.user.user_id,
    });

    if (finalAssignee) {
      await crmSvc.logActivity(o, r.insertId, {
        type: 'assignment',
        title: 'Auto-assigned',
        description: `Round-robin assignment`,
        performed_by: req.user.user_id,
      });

      // Notify assigned counselor
      try {
        await notifSvc.send(o, {
          recipient_id: finalAssignee,
          recipient_role: 'admin',
          type: 'lead_assigned',
          title: `New lead: ${first_name} ${last_name||''}`.trim(),
          body: `${phone} · ${target_class||'—'} · ${source||'walk_in'}`,
          action_url: `/admin/crm/leads/${r.insertId}`,
          icon: 'Users',
          priority: 'normal',
          sender_id: req.user.user_id,
          sender_role: 'admin',
        });
      } catch(err) { logger.warn('Lead notif failed:', err); }
    }

    return success(res, { id: r.insertId, assigned_to: finalAssignee }, 'Lead created', 201);
  } catch(e) { logger.error('Lead create:',e); return error(res, e.message, 500); }
});

// UPDATE lead (supports stage change, reassignment, notes)
router.put('/leads/:id', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const {
      first_name, last_name, phone, alt_phone, email,
      parent_name, parent_phone,
      target_class, target_exam, target_subjects,
      stage_id, assigned_to, temperature, notes, next_followup_at,
      is_won, is_lost, lost_reason
    } = req.body;

    // Get current state for activity logging
    const editSchool = await getActiveSchool(req);
    const current = await queryOne(
      `SELECT stage_id, assigned_to, is_won, is_lost FROM client_leads
        WHERE id=? AND org_id=? AND (? IS NULL OR school_id IS NULL OR school_id = ?)`,
      [req.params.id, o, editSchool, editSchool]);
    if (!current) return error(res, 'Lead not found', 404);

    await query(
      `UPDATE client_leads SET
        first_name=COALESCE(?,first_name), last_name=COALESCE(?,last_name),
        phone=COALESCE(?,phone), alt_phone=COALESCE(?,alt_phone), email=COALESCE(?,email),
        parent_name=COALESCE(?,parent_name), parent_phone=COALESCE(?,parent_phone),
        target_class=COALESCE(?,target_class), target_exam=COALESCE(?,target_exam),
        target_subjects=COALESCE(?,target_subjects),
        stage_id=COALESCE(?,stage_id), assigned_to=COALESCE(?,assigned_to),
        temperature=COALESCE(?,temperature), notes=COALESCE(?,notes),
        next_followup_at=COALESCE(?,next_followup_at),
        is_won=COALESCE(?,is_won), is_lost=COALESCE(?,is_lost),
        lost_reason=COALESCE(?,lost_reason)
       WHERE id=? AND org_id=? AND (? IS NULL OR school_id IS NULL OR school_id = ?)`,
      [first_name||null, last_name||null, phone||null, alt_phone||null, email||null,
       parent_name||null, parent_phone||null,
       target_class||null, target_exam||null, target_subjects||null,
       stage_id||null, assigned_to||null,
       temperature||null, notes||null, next_followup_at||null,
       is_won!==undefined?(is_won?1:0):null,
       is_lost!==undefined?(is_lost?1:0):null,
       lost_reason||null,
       req.params.id, o]
    );

    // Log meaningful changes
    if (stage_id && stage_id !== current.stage_id) {
      const newStage = await queryOne('SELECT name FROM client_lead_stages WHERE id=?', [stage_id]);
      await crmSvc.logActivity(o, req.params.id, {
        type: 'stage_change',
        title: `Stage → ${newStage?.name || stage_id}`,
        performed_by: req.user.user_id,
      });
    }

    if (assigned_to && assigned_to !== current.assigned_to) {
      const newUser = await queryOne('SELECT first_name, last_name FROM client_users WHERE id=?', [assigned_to]);
      await crmSvc.logActivity(o, req.params.id, {
        type: 'assignment',
        title: `Reassigned to ${newUser?.first_name || assigned_to}`,
        performed_by: req.user.user_id,
      });

      // Notify new assignee
      try {
        const lead = await queryOne(
          'SELECT first_name, last_name, phone FROM client_leads WHERE id=? AND org_id=?',
          [req.params.id, o]);
        await notifSvc.send(o, {
          recipient_id: assigned_to,
          recipient_role: 'admin',
          type: 'lead_assigned',
          title: `Lead reassigned to you: ${lead.first_name}`,
          body: `${lead.phone}`,
          action_url: `/admin/crm/leads/${req.params.id}`,
          icon: 'Users',
          priority: 'normal',
          sender_id: req.user.user_id,
          sender_role: 'admin',
        });
      } catch {}
    }

    return success(res, {}, 'Lead updated');
  } catch(e) { return error(res, e.message, 500); }
});

// DELETE lead
router.delete('/leads/:id', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    // Reachability is decided BEFORE any child row is destroyed. Deleting the
    // activities first and only then discovering the lead is out of branch
    // would leave another campus's applicant stripped of its history.
    const delSchool = await getActiveSchool(req);
    const target = await queryOne(
      `SELECT id FROM client_leads WHERE id=? AND org_id=? AND ${BRANCH_SQL}`,
      [req.params.id, o, delSchool, delSchool]);
    if (!target) return error(res, 'Lead not found', 404);

    await query('DELETE FROM client_lead_activities WHERE lead_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_lead_demos WHERE lead_id=? AND org_id=?', [req.params.id, o]);
    await query('DELETE FROM client_leads WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── ACTIVITIES ────────────────────────────────────────────────────────────
router.post('/leads/:id/activities', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { type, title, description, meta, duration_mins, outcome } = req.body;
    if (!type) return error(res, 'type required', 400);

    const actSchool = await getActiveSchool(req);
    const actLead = await queryOne(
      `SELECT id FROM client_leads WHERE id=? AND org_id=? AND ${BRANCH_SQL}`,
      [req.params.id, o, actSchool, actSchool]);
    if (!actLead) return error(res, 'Lead not found', 404);

    await crmSvc.logActivity(o, req.params.id, {
      type, title, description, meta, duration_mins, outcome,
      performed_by: req.user.user_id,
    });

    // Update lead's last_contact_at
    await query(
      `UPDATE client_leads SET last_contact_at=NOW() WHERE id=? AND org_id=?`,
      [req.params.id, o]
    );

    return success(res, {}, 'Activity logged', 201);
  } catch(e) { return error(res, e.message, 500); }
});

// ─── DEMO SCHEDULING ───────────────────────────────────────────────────────
router.post('/leads/:id/demos', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { scheduled_at, duration_mins, subject_name, faculty_id, section_id, venue, mode } = req.body;
    if (!scheduled_at) return error(res, 'scheduled_at required', 400);

    const demoSchool = await getActiveSchool(req);
    const demoLead = await queryOne(
      `SELECT id FROM client_leads WHERE id=? AND org_id=? AND ${BRANCH_SQL}`,
      [req.params.id, o, demoSchool, demoSchool]);
    if (!demoLead) return error(res, 'Lead not found', 404);

    const r = await query(
      `INSERT INTO client_lead_demos 
        (org_id, lead_id, scheduled_at, duration_mins, subject_name, faculty_id, section_id, venue, mode, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [o, req.params.id, scheduled_at, duration_mins||60, subject_name||null,
       faculty_id||null, section_id||null, venue||null, mode||'offline', req.user.user_id]
    );

    // Update lead stage to "Demo Scheduled" if such a stage exists
    const demoStage = await queryOne(
      `SELECT id FROM client_lead_stages WHERE org_id=? AND stage_key='demo_sched' LIMIT 1`, [o]
    );
    if (demoStage) {
      await query('UPDATE client_leads SET stage_id=? WHERE id=? AND org_id=?', [demoStage.id, req.params.id, o]);
    }

    await crmSvc.logActivity(o, req.params.id, {
      type: 'demo_scheduled',
      title: `Demo scheduled for ${new Date(scheduled_at).toLocaleDateString('en-IN')}`,
      description: subject_name ? `Subject: ${subject_name}` : null,
      performed_by: req.user.user_id,
    });

    return success(res, { id: r.insertId }, 'Demo scheduled', 201);
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/demos/:id', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { status, feedback_text, feedback_rating } = req.body;
    await query(
      `UPDATE client_lead_demos SET
        status=COALESCE(?,status),
        feedback_text=COALESCE(?,feedback_text),
        feedback_rating=COALESCE(?,feedback_rating)
       WHERE id=? AND org_id=?`,
      [status||null, feedback_text||null, feedback_rating||null, req.params.id, o]
    );
    return success(res, {}, 'Demo updated');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── LEAD → STUDENT CONVERSION ─────────────────────────────────────────────
router.post('/leads/:id/convert', requireRole('owner','admin','principal'), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { section_id, admission_number, password } = req.body;
    const activeSchool = await getActiveSchool(req);

    const lead = await queryOne(
      `SELECT * FROM client_leads WHERE id=? AND org_id=? AND ${BRANCH_SQL}`,
      [req.params.id, o, activeSchool, activeSchool]
    );
    if (!lead) return error(res, 'Lead not found', 404);
    if (lead.converted_student_id) return error(res, 'Already converted', 400);

    // The section (if given) must belong to this org AND to a branch this caller
    // can reach — never enroll into another tenant's section, and never admit a
    // child into the other campus's class.
    let sec = null;
    if (section_id) {
      sec = await queryOne(
        `SELECT id, school_id FROM client_sections WHERE id=? AND org_id=? AND ${BRANCH_SQL}`,
        [section_id, o, activeSchool, activeSchool]);
      if (!sec) return error(res, 'Selected class/section is invalid', 400);
    }

    // The branch this admission belongs to. The section is the most concrete
    // answer — a child sitting in 10-A is at the campus 10-A is taught at — then
    // the applicant's own campus, then whatever branch the request was scoped to.
    //
    // Until now this INSERT simply omitted school_id, so EVERY student admitted
    // through the funnel landed with a NULL branch while students created on the
    // form got one. The roster filters on that column, so those children were
    // invisible to their own branch's admin and visible to every other one.
    const studentSchoolId = sec?.school_id ?? lead.school_id ?? activeSchool ?? null;

    // Email: use the lead's real email if present; otherwise a clearly-internal,
    // collision-free placeholder (no "pilot" smell). Reject a real duplicate up
    // front with a friendly message instead of a raw 500 from the unique index.
    const studentEmail = lead.email || `stu.${req.params.id}.${(lead.phone || 'na')}@no-email.local`;
    const dupe = await queryOne('SELECT id FROM client_users WHERE email=? AND org_id=?', [studentEmail, o]);
    if (dupe) return error(res, 'A user with this email already exists — edit the enquiry email and try again.', 409);

    // A hand-typed admission number bypasses the series entirely, and
    // client_students.admission_number carries only a plain index — nothing in
    // the database stops two children being given the same one. Two forms would
    // then be printed with the same number and neither the school nor the code
    // would ever object. Reject it here, where a clear 409 is still possible.
    if (admission_number) {
      const takenNo = await queryOne(
        'SELECT id FROM client_students WHERE org_id=? AND admission_number=? LIMIT 1',
        [o, String(admission_number).trim()]
      );
      if (takenNo) {
        return error(res, `Admission number ${admission_number} already belongs to another student.`, 409);
      }
    }

    const bcrypt = require('bcrypt');
    const hashedPwd = await bcrypt.hash(password || tempPassword(), 10);
    const wonStage = await queryOne('SELECT id FROM client_lead_stages WHERE org_id=? AND is_won=1 LIMIT 1', [o]);
    // PLAN LIMIT (KI-118). Converting a lead creates a real student, so it consumes
    // headcount exactly like POST /api/students and has to answer to the same cap —
    // otherwise the limit is enforced on the form and bypassed by the funnel.
    const cap = await meters.checkHeadcount(o, 'students', 1);
    if (!cap.ok) return error(res, cap.message, 402);

    const studentRole = await queryOne("SELECT id FROM client_roles WHERE org_id=? AND base_role='student' LIMIT 1", [o]);

    // ALL writes in ONE transaction — a mid-sequence failure must not leave an
    // orphaned user account without its student record / role.
    const { userId, studentId, admissionNo } = await transaction(async (conn) => {
      const [userR] = await conn.execute(
        `INSERT INTO client_users (org_id, email, password_hash, first_name, last_name, phone, is_active)
         VALUES (?,?,?,?,?,?,1)`,
        [o, studentEmail, hashedPwd, lead.first_name, lead.last_name, lead.phone]
      );
      // The admission number now comes from the school's own series (one counter
      // per session, allocated under the row's unique key inside this same
      // transaction) instead of being derived from the new user's auto-increment
      // id. The old scheme produced numbers that jumped — ADM-2026-0007 followed
      // by ADM-2026-0019, because the id counts every user in the org, not the
      // children admitted this session — and a school reading its own register
      // could not tell whether the gaps were lost admissions.
      //
      // An explicitly supplied number still wins: a school migrating its records
      // in must be able to keep the numbers already printed on its forms.
      let admissionNo = admission_number;
      if (!admissionNo) {
        const [ayRows] = await conn.execute(
          `SELECT name FROM academic_years WHERE org_id = ? AND is_current = 1 ORDER BY start_date DESC LIMIT 1`,
          [o]
        );
        const session = (ayRows[0] && ayRows[0].name) || String(new Date().getFullYear());
        try {
          const allocated = await allocateAdmissionNumber(o, session, 'ADM', conn);
          admissionNo = allocated.number;
        } catch (seriesErr) {
          // Admitting a child must not depend on this module being installed.
          // Between a deploy landing and its migration being applied the series
          // table does not exist yet, and without this fallback EVERY conversion
          // in EVERY org would 500 in that window — turning a new feature into an
          // outage on the flow a school cares about most. Fall back to the old
          // derived number and carry on; the admission is what matters.
          logger.warn(`Admission series unavailable (org ${o}), using derived number: ${seriesErr.message}`);
          admissionNo = `ADM-${new Date().getFullYear()}-${String(userR.insertId).padStart(4, '0')}`;
        }
      }
      const [studentR] = await conn.execute(
        `INSERT INTO client_students (org_id, user_id, admission_number, school_id) VALUES (?,?,?,?)`,
        [o, userR.insertId, admissionNo, studentSchoolId]
      );
      if (studentRole) {
        await conn.execute(`INSERT IGNORE INTO client_user_roles (org_id, user_id, role_id) VALUES (?,?,?)`,
          [o, userR.insertId, studentRole.id]);
      }
      if (section_id) {
        await conn.execute(
          `INSERT INTO client_enrollments (org_id, student_id, section_id, enrollment_date, status) VALUES (?,?,?,CURDATE(),'active')`,
          [o, studentR.insertId, section_id]);
      }
      await conn.execute(`UPDATE client_leads SET is_won=1, stage_id=?, converted_student_id=? WHERE id=? AND org_id=?`,
        [wonStage?.id || null, studentR.insertId, req.params.id, o]);
      return { userId: userR.insertId, studentId: studentR.insertId, admissionNo };
    });
    const studentR = { insertId: studentId };
    const userR = { insertId: userId };

    await crmSvc.logActivity(o, req.params.id, {
      type: 'won',
      title: 'Converted to student',
      description: `Student ID: ${studentR.insertId} · Admission: ${admissionNo}`,
      performed_by: req.user.user_id,
    });

    // §12 names Admission as auditable. The CRM activity above is a SALES note
    // on the lead — it lives in the CRM timeline, is scoped to a lead that can be
    // deleted, and answers "how did this deal progress". The audit row answers a
    // different question, the one a school asks months later: who admitted this
    // child, when, from where. Different reader, different retention, both needed.
    await audit(req, 'ADMISSION', 'student', studentR.insertId, {
      new_data: { via: 'crm_lead', lead_id: Number(req.params.id), admission_number: admissionNo },
    });

    return success(res, {
      student_id: studentR.insertId,
      user_id: userR.insertId,
      admission_number: admissionNo,
      email: studentEmail,
    }, 'Lead converted to student', 201);

  } catch(e) { logger.error('Lead convert:',e); return error(res, e.message, 500); }
});

// ─── STATS / ANALYTICS ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const o = req.user.org_id;
    // Counts carry the branch filter too. "412 enquiries" on a board showing 180
    // of them tells a branch admin exactly how much they are not being shown.
    const statsSchool = await getActiveSchool(req);
    const row = await queryOne(
      `SELECT
        COUNT(*) AS total,
        SUM(is_won=1) AS won,
        SUM(is_lost=1) AS lost,
        SUM(is_won=0 AND is_lost=0) AS open,
        SUM(temperature='hot') AS hot,
        SUM(DATE(created_at)=CURDATE()) AS new_today,
        SUM(WEEK(created_at)=WEEK(CURDATE())) AS new_this_week
       FROM client_leads WHERE org_id=? AND ${BRANCH_SQL}`, [o, statsSchool, statsSchool]
    );

    const byCounselor = await query(
      `SELECT l.assigned_to, 
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS counselor_name,
        COUNT(*) AS total,
        SUM(l.is_won=1) AS won,
        SUM(l.is_won=0 AND l.is_lost=0) AS open
       FROM client_leads l
       LEFT JOIN client_users u ON u.id=l.assigned_to
       WHERE l.org_id=? AND (? IS NULL OR l.school_id IS NULL OR l.school_id = ?)
       GROUP BY l.assigned_to
       ORDER BY total DESC`, [o, statsSchool, statsSchool]
    );

    // No leads yet is not "0% conversion" — it is no data (utils/pct.js).
    const conversionRate = safePct(row.won, row.total);

    return success(res, { ...row, conversion_rate: conversionRate, by_counselor: byCounselor });
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;
