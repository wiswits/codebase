'use strict';

/**
 * /api/pl/alerts/* — the notification inbox for the actionable insights the
 * other routes (insights.js) emit. Reads/writes only `client_pl_alert`.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');

const ANY_ROLE = requirePermission('teacher', 'principal', 'student', 'parent');

// ─── List with filters ─────────────────────────────────────────
router.get('/alerts', ANY_ROLE, async (req, res) => {
  const org_id = req.ctx.org_id;
  const { role, status, severity } = req.query;
  const clauses = ['org_id = :org_id'];
  const params = { org_id, limit: Number(req.query.limit || 100) };
  if (role) { clauses.push('target_role = :role'); params.role = role; }
  if (status) { clauses.push('status = :status'); params.status = status; }
  if (severity) { clauses.push('severity = :severity'); params.severity = severity; }

  const rows = await db.query(
    `SELECT id, type, severity, target_role, target_id, subject_type, subject_id,
            title, body, action_json, payload_json, status, created_at, read_at, actioned_at
     FROM client_pl_alert WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC LIMIT :limit`,
    params
  );
  res.json({ alerts: rows });
});

// ─── Mark read (only from 'new') ───────────────────────────────
router.post('/alerts/:id/read', ANY_ROLE, async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const r = await db.query(
    `UPDATE client_pl_alert SET status='read', read_at=NOW() WHERE id=:id AND org_id=:org_id AND status='new'`,
    { id, org_id }
  );
  res.json({ ok: true, updated: r.affectedRows > 0 });
});

// ─── Mark actioned ──────────────────────────────────────────────
router.post('/alerts/:id/action', ANY_ROLE, async (req, res) => {
  const org_id = req.ctx.org_id;
  const id = Number(req.params.id);
  const r = await db.query(
    `UPDATE client_pl_alert SET status='actioned', actioned_at=NOW() WHERE id=:id AND org_id=:org_id`,
    { id, org_id }
  );
  res.json({ ok: true, updated: r.affectedRows > 0 });
});

module.exports = router;
