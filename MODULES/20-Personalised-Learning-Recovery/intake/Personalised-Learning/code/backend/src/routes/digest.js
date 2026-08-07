'use strict';

/**
 * /api/pl/digest/* — the parent digest. Same dignity-safe, encouraging
 * framing as algorithms/benchmark.js's narrative (Rule 21):
 *   ✅ "Aarav ne 34% → 78% improve kiya 🎉"
 *   ❌ any rank / position / leaderboard language — never, not even implied.
 *
 * This simulates a cron-triggered send: POST /digest/send just records the
 * payload (client_pl_digest row) — no real email/whatsapp integration here.
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../middleware/context');
const db = require('../config/db');
const { nameFor } = require('../db/fixtures');

const READ_ROLES = requirePermission('teacher', 'principal', 'parent');
const SEND_ROLES = requirePermission('teacher', 'principal');

/** Build the encouraging summary payload for one student. No rank, ever. */
async function buildDigestPayload(org_id, student_id) {
  const name = nameFor(student_id);

  const attempts = await db.query(
    `SELECT percentage, submitted_at FROM client_pl_attempt
     WHERE org_id=:org_id AND student_id=:sid AND status='evaluated'
     ORDER BY submitted_at ASC`,
    { org_id, sid: student_id }
  );

  const first = attempts.length ? Number(attempts[0].percentage) : null;
  const latest = attempts.length ? Number(attempts[attempts.length - 1].percentage) : null;
  const delta = first != null && latest != null ? Math.round(latest - first) : null;

  const [{ gaps_closed } = { gaps_closed: 0 }] = await db.query(
    `SELECT COUNT(*) AS gaps_closed FROM client_pl_weak_area
     WHERE org_id=:org_id AND student_id=:sid AND status='closed'`,
    { org_id, sid: student_id }
  );

  let encouraging_line;
  if (first != null && latest != null && delta > 0) {
    encouraging_line = `${name} ne ${Math.round(first)}% → ${Math.round(latest)}% improve kiya 🎉`;
  } else if (first != null && latest != null && delta === 0) {
    encouraging_line = `${name} apni ${Math.round(latest)}% performance ko steady rakh rahe hain — consistency bhi ek jeet hai 👍`;
  } else if (latest != null) {
    encouraging_line = `${name} ne haal hi me ${Math.round(latest)}% score kiya — agla test aur behtar hoga 💪`;
  } else {
    encouraging_line = `${name} ka pehla test abhi baaki hai — jald hi update milega.`;
  }

  return {
    student_id,
    student_name: name,
    latest_score: latest,
    first_score: first,
    delta_since_first: delta,
    gaps_closed: Number(gaps_closed) || 0,
    encouraging_line,
    generated_at: new Date().toISOString(),
  };
}

// ─── Preview (no send) ──────────────────────────────────────────
router.get('/digest/student/:id', READ_ROLES, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.id);
  const payload = await buildDigestPayload(org_id, student_id);
  res.json({ preview: payload });
});

// ─── Send (record only — simulates the cron trigger) ───────────
router.post('/digest/send', SEND_ROLES, async (req, res) => {
  const org_id = req.ctx.org_id;
  const { student_id, parent_id, period_start, period_end, channel = 'app' } = req.body || {};
  if (!student_id || !period_start || !period_end) {
    return res.status(400).json({ error: 'student_id_period_required' });
  }

  const payload = await buildDigestPayload(org_id, Number(student_id));
  const r = await db.query(
    `INSERT INTO client_pl_digest (org_id, student_id, parent_id, period_start, period_end, payload_json, channel, sent_at)
     VALUES (:org_id, :sid, :pid, :ps, :pe, :payload, :channel, NOW())`,
    {
      org_id, sid: Number(student_id), pid: parent_id ? Number(parent_id) : null,
      ps: period_start, pe: period_end, payload: JSON.stringify(payload), channel,
    }
  );

  res.status(201).json({ id: r.insertId, student_id: Number(student_id), parent_id: parent_id || null,
    period_start, period_end, channel, payload, sent_at: new Date().toISOString() });
});

// ─── History for one student ────────────────────────────────────
router.get('/digest/history/:student_id', READ_ROLES, async (req, res) => {
  const org_id = req.ctx.org_id;
  const student_id = Number(req.params.student_id);
  const rows = await db.query(
    `SELECT id, student_id, parent_id, period_start, period_end, payload_json, channel, sent_at, opened_at, clicked_at, created_at
     FROM client_pl_digest WHERE org_id=:org_id AND student_id=:sid
     ORDER BY created_at DESC LIMIT :limit`,
    { org_id, sid: student_id, limit: Number(req.query.limit || 50) }
  );
  res.json({ digests: rows });
});

module.exports = router;
