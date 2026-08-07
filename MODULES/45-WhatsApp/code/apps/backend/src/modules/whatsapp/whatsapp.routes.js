const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const logger = require('../../utils/logger');
const wa = require('../../services/whatsapp');
const crypto = require('crypto');

// ─── Delivery webhook (provider calls this — MUST be before `authenticate`) ──
// Meta verification challenge (GET).
router.get('/webhook', (req, res) => {
  const token = process.env.WHATSAPP_WEBHOOK_TOKEN;
  if (token && req.query['hub.verify_token'] === token) {
    return res.status(200).send(req.query['hub.challenge'] || 'ok');
  }
  return res.sendStatus(403);
});

router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const rawBody = req.body?.toString ? req.body.toString() : JSON.stringify(req.body || {});
    // Authenticate the provider callback. Prefer Meta's HMAC signature; else a
    // shared token. If neither is configured, reject (fail closed).
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const shared = process.env.WHATSAPP_WEBHOOK_TOKEN;
    let ok = false;
    if (appSecret) {
      const sig = (req.headers['x-hub-signature-256'] || '').replace('sha256=', '');
      const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
      const a = Buffer.from(sig, 'hex'); const b = Buffer.from(expected, 'hex');
      ok = a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
    } else if (shared) {
      ok = (req.headers['x-webhook-token'] === shared) || (req.query.token === shared);
    }
    if (!ok) return res.status(401).json({ error: 'Unauthorized webhook' });

    let payload;
    try { payload = JSON.parse(rawBody); } catch { payload = {}; }
    const providerMsgId = payload?.data?.message_id
      || payload?.messageId
      || payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.id
      || payload?.MessageSid;
    const newStatus = payload?.status
      || payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.status
      || payload?.MessageStatus;

    if (providerMsgId && newStatus) {
      const statusMap = { delivered:'delivered', read:'read', failed:'failed', sent:'sent', queued:'sending' };
      const mapped = statusMap[String(newStatus).toLowerCase()] || newStatus;
      await query(
        `UPDATE client_whatsapp_messages SET
          status=?,
          delivered_at=CASE WHEN ? IN ('delivered','read') AND delivered_at IS NULL THEN NOW() ELSE delivered_at END,
          read_at=CASE WHEN ? = 'read' AND read_at IS NULL THEN NOW() ELSE read_at END
         WHERE provider_message_id=?`,
        [mapped, mapped, mapped, providerMsgId]
      );
    }
    return res.status(200).json({ received: true });
  } catch(e) { logger.error('WA webhook:', e); return res.status(500).json({ error: 'error' }); }
});

router.use(authenticate);
// WhatsApp is an admin comms tool — config (incl. api keys), bulk-send, broadcast
// and templates must never be reachable by student/parent/teacher. Router-level
// gate (was authenticate-only: any org member could tamper keys or blast parents).
const { requireRole } = require('../../middleware/rbac');
router.use(requireRole('owner', 'admin', 'principal', 'super_admin', 'system_admin'));

// ─── Config ────────────────────────────────────────────────────────────────
router.get('/config', async (req, res) => {
  try {
    const o = req.user.org_id;
    const cfg = await queryOne('SELECT org_id, provider, sender_phone, sender_name, is_active, monthly_quota, sent_this_month, quota_reset_at FROM client_whatsapp_config WHERE org_id=?', [o]);
    return success(res, cfg || { provider: 'mock', is_active: 1 });
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/config', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { provider, api_key, api_secret, sender_phone, sender_name, monthly_quota, is_active } = req.body;
    await query(
      `INSERT INTO client_whatsapp_config (org_id, provider, api_key, api_secret, sender_phone, sender_name, monthly_quota, is_active)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         provider=COALESCE(VALUES(provider),provider),
         api_key=COALESCE(VALUES(api_key),api_key),
         api_secret=COALESCE(VALUES(api_secret),api_secret),
         sender_phone=COALESCE(VALUES(sender_phone),sender_phone),
         sender_name=COALESCE(VALUES(sender_name),sender_name),
         monthly_quota=COALESCE(VALUES(monthly_quota),monthly_quota),
         is_active=COALESCE(VALUES(is_active),is_active)`,
      [o, provider||null, api_key||null, api_secret||null,
       sender_phone||null, sender_name||null,
       monthly_quota||null,
       is_active!==undefined?(is_active?1:0):null]
    );
    return success(res, {}, 'WhatsApp config saved');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Templates CRUD ────────────────────────────────────────────────────────
router.get('/templates', async (req, res) => {
  try {
    const o = req.user.org_id;
    const rows = await query('SELECT * FROM client_whatsapp_templates WHERE org_id=? AND is_active=1 ORDER BY category, name', [o]);
    return success(res, { templates: rows });
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/templates', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { template_key, name, category, body, variables, language } = req.body;
    if (!template_key || !name || !body) return error(res, 'template_key, name, body required', 400);
    const r = await query(
      `INSERT INTO client_whatsapp_templates (org_id, template_key, name, category, body, variables, language, approval_status)
       VALUES (?,?,?,?,?,?,?,'draft')`,
      [o, template_key, name, category||'announcement', body, variables||null, language||'en']
    );
    return success(res, { id: r.insertId }, 'Template created', 201);
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { name, category, body, variables, language, approval_status, is_active } = req.body;
    await query(
      `UPDATE client_whatsapp_templates SET
        name=COALESCE(?,name), category=COALESCE(?,category),
        body=COALESCE(?,body), variables=COALESCE(?,variables),
        language=COALESCE(?,language), approval_status=COALESCE(?,approval_status),
        is_active=COALESCE(?,is_active)
       WHERE id=? AND org_id=?`,
      [name||null, category||null, body||null, variables||null, language||null,
       approval_status||null,
       is_active!==undefined?(is_active?1:0):null,
       req.params.id, o]
    );
    return success(res, {}, 'Template updated');
  } catch(e) { return error(res, e.message, 500); }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const o = req.user.org_id;
    await query('UPDATE client_whatsapp_templates SET is_active=0 WHERE id=? AND org_id=?', [req.params.id, o]);
    return success(res, {}, 'Template deleted');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Test send ─────────────────────────────────────────────────────────────
router.post('/test-send', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { phone, template_key, variables } = req.body;
    if (!phone) return error(res, 'phone required', 400);

    let result;
    if (template_key) {
      result = await wa.sendTemplate(o, {
        phone, template_key,
        variables: variables || {},
        sent_by: req.user.user_id,
      });
    } else {
      result = await wa.sendText(o, {
        phone,
        body: req.body.body || 'Test message from APEX by WISWITS',
        sent_by: req.user.user_id,
      });
    }
    return success(res, result, result.ok ? 'Sent' : 'Failed');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Bulk send ─────────────────────────────────────────────────────────────
router.post('/bulk-send', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { template_key, recipients, variables_base } = req.body;
    if (!template_key || !Array.isArray(recipients)) return error(res, 'template_key and recipients[] required', 400);

    const results = await wa.sendBulk(o, recipients, {
      template_key,
      variables_fn: (r) => ({ ...variables_base, ...r.variables }),
      sent_by: req.user.user_id,
    });
    return success(res, { results, total: results.length, sent: results.filter(r => r.ok).length });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Send to all parents of section ────────────────────────────────────────
router.post('/broadcast-section-parents', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { section_id, template_key, variables } = req.body;
    if (!section_id || !template_key) return error(res, 'section_id and template_key required', 400);

    const parents = await query(
      `SELECT DISTINCT u.id AS user_id, u.phone,
         CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS name
       FROM client_users u
       JOIN client_parents p ON p.user_id=u.id
       JOIN client_parent_students ps ON ps.parent_id=p.id
       JOIN client_enrollments e ON e.student_id=ps.student_id
       WHERE e.section_id=? AND u.is_active=1 AND u.phone IS NOT NULL AND ps.org_id=?`,
      [section_id, o]
    );

    const results = await wa.sendBulk(o, parents, {
      template_key,
      variables_fn: () => variables || {},
      sent_by: req.user.user_id,
    });

    return success(res, {
      target_count: parents.length,
      sent: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Messages log ──────────────────────────────────────────────────────────
router.get('/messages', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { status, phone, template_key, limit=100 } = req.query;
    let where = 'WHERE org_id=?';
    const p = [o];
    if (status) { where += ' AND status=?'; p.push(status); }
    if (phone)  { where += ' AND recipient_phone LIKE ?'; p.push(`%${phone}%`); }
    if (template_key) { where += ' AND template_key=?'; p.push(template_key); }

    const rows = await query(
      `SELECT * FROM client_whatsapp_messages ${where} ORDER BY created_at DESC LIMIT ?`,
      [...p, parseInt(limit)]
    );
    return success(res, { messages: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Stats ─────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const o = req.user.org_id;
    const row = await queryOne(
      `SELECT
        COUNT(*) AS total,
        SUM(status='sent') AS sent,
        SUM(status='delivered') AS delivered,
        SUM(status='read') AS \`read\`,
        SUM(status='failed') AS failed,
        SUM(DATE(created_at)=CURDATE()) AS today
       FROM client_whatsapp_messages WHERE org_id=?`, [o]
    );
    const cfg = await queryOne('SELECT provider, monthly_quota, sent_this_month FROM client_whatsapp_config WHERE org_id=?', [o]);
    return success(res, { ...row, ...cfg });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Opt-in/out ────────────────────────────────────────────────────────────
router.post('/opt-out', async (req, res) => {
  try {
    const o = req.user.org_id;
    const { phone, reason } = req.body;
    await wa.optOut(o, phone, reason, req.user.user_id);
    return success(res, {}, 'Opted out');
  } catch(e) { return error(res, e.message, 500); }
});

router.post('/opt-in', async (req, res) => {
  try {
    const o = req.user.org_id;
    await wa.optIn(o, req.body.phone);
    return success(res, {}, 'Opted in');
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;
