'use strict';
const db = require('../../config/db');
const { encrypt, decrypt, last4 } = require('../../services/ai/crypto');
const { listModels, PRICING } = require('../../services/ai/pricing');
const gateway = require('../../services/ai/gateway');

const PROVIDER_INFO = {
  anthropic: { name: 'Anthropic Claude', signupUrl: 'https://console.anthropic.com', defaultModel: 'claude-haiku-4-5-20251001' },
  openai: { name: 'OpenAI', signupUrl: 'https://platform.openai.com/signup', defaultModel: 'gpt-4o-mini' },
  google: { name: 'Google Gemini', signupUrl: 'https://aistudio.google.com/apikey', defaultModel: 'gemini-1.5-flash' },
  groq: { name: 'Groq (Fast Llama)', signupUrl: 'https://console.groq.com', defaultModel: 'llama-3.3-70b-versatile' },
  wiswits_default: { name: 'WISWITS AI', signupUrl: null, defaultModel: 'claude-haiku-4-5-20251001' },
};

// GET /api/ai-config — current org's config
exports.getConfig = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const [rows] = await db.pool.execute(
      `SELECT id, provider, model, api_key_last4, monthly_budget_inr, current_month_spend_inr,
              current_month_tokens, budget_reset_date, fallback_to_wiswits, is_active,
              test_status, test_message, tested_at, created_at, updated_at
       FROM client_org_ai_config WHERE org_id = ?`,
      [orgId]
    );
    const config = rows[0] || null;
    return res.json({
      success: true,
      config,
      providers: PROVIDER_INFO,
      pricing: PRICING,
    });
  } catch (e) {
    console.error('[ai-config.get]', e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/ai-config — save settings (with encryption)
exports.updateConfig = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const roleSlug = req.user.role_slug;
    if (!['owner', 'admin', 'principal'].includes(roleSlug)) {
      return res.status(403).json({ success: false, message: 'Only owners and admins can manage AI config' });
    }

    const { provider, model, api_key, monthly_budget_inr, fallback_to_wiswits, is_active } = req.body;

    if (!PROVIDER_INFO[provider]) {
      return res.status(400).json({ success: false, message: 'Invalid provider' });
    }

    const [existing] = await db.pool.execute('SELECT id, api_key_encrypted FROM client_org_ai_config WHERE org_id = ?', [orgId]);

    let encrypted = existing[0]?.api_key_encrypted || null;
    let keyLast4 = null;
    if (api_key && api_key !== '__keep__') {
      encrypted = encrypt(api_key);
      keyLast4 = last4(api_key);
    } else if (existing[0]) {
      const [r2] = await db.pool.execute('SELECT api_key_last4 FROM client_org_ai_config WHERE org_id = ?', [orgId]);
      keyLast4 = r2[0]?.api_key_last4 || null;
    }

    if (existing.length) {
      await db.pool.execute(
        `UPDATE client_org_ai_config SET
          provider = ?, model = ?, api_key_encrypted = ?, api_key_last4 = ?,
          monthly_budget_inr = ?, fallback_to_wiswits = ?, is_active = ?
         WHERE org_id = ?`,
        [provider, model, encrypted, keyLast4, monthly_budget_inr || 0, fallback_to_wiswits ? 1 : 0, is_active !== false ? 1 : 0, orgId]
      );
    } else {
      await db.pool.execute(
        `INSERT INTO client_org_ai_config
          (org_id, provider, model, api_key_encrypted, api_key_last4, monthly_budget_inr, fallback_to_wiswits, is_active, budget_reset_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_FORMAT(LAST_DAY(NOW()) + INTERVAL 1 DAY, '%Y-%m-01'))`,
        [orgId, provider, model, encrypted, keyLast4, monthly_budget_inr || 0, fallback_to_wiswits ? 1 : 0, is_active !== false ? 1 : 0]
      );
    }

    const [updated] = await db.pool.execute(
      `SELECT id, provider, model, api_key_last4, monthly_budget_inr, current_month_spend_inr,
              current_month_tokens, budget_reset_date, fallback_to_wiswits, is_active,
              test_status, test_message, tested_at
       FROM client_org_ai_config WHERE org_id = ?`,
      [orgId]
    );

    return res.json({ success: true, config: updated[0] });
  } catch (e) {
    console.error('[ai-config.update]', e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/ai-config/test — test current key works
exports.testConnection = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // No role check here previously — any authenticated user could trigger a
    // live, billed call to the org's AI provider using its stored key.
    if (!['owner', 'admin', 'principal'].includes(req.user.role_slug)) {
      return res.status(403).json({ success: false, message: 'Only owners and admins can manage AI config' });
    }
    const { provider, model, api_key } = req.body;

    let testKey = api_key;
    if (!testKey || testKey === '__keep__') {
      const [rows] = await db.pool.execute('SELECT api_key_encrypted FROM client_org_ai_config WHERE org_id = ?', [orgId]);
      testKey = rows[0]?.api_key_encrypted ? decrypt(rows[0].api_key_encrypted) : null;
    }

    if (provider === 'wiswits_default') {
      testKey = process.env.WISWITS_DEFAULT_AI_KEY;
    }

    if (!testKey) {
      return res.json({ success: false, ok: false, message: 'No API key provided' });
    }

    const result = await gateway.testConnection({ provider, model, apiKey: testKey });

    await db.pool.execute(
      `UPDATE client_org_ai_config
       SET test_status = ?, test_message = ?, tested_at = NOW()
       WHERE org_id = ?`,
      [result.ok ? 'success' : 'failed', result.message?.slice(0, 500) || null, orgId]
    );

    return res.json({ success: true, ok: result.ok, message: result.message });
  } catch (e) {
    console.error('[ai-config.test]', e);
    return res.json({ success: true, ok: false, message: e.message });
  }
};

// GET /api/ai-config/usage — last 30 days usage stats
exports.getUsage = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // Org-wide AI spend/cost data — no role check previously.
    if (!['owner', 'admin', 'principal'].includes(req.user.role_slug)) {
      return res.status(403).json({ success: false, message: 'Only owners and admins can view AI usage' });
    }

    const [today] = await db.pool.execute(
      `SELECT COUNT(*) calls, COALESCE(SUM(total_tokens),0) tokens, COALESCE(SUM(cost_inr),0) cost
       FROM client_ai_usage_log WHERE org_id = ? AND DATE(created_at) = CURDATE()`,
      [orgId]
    );

    const [month] = await db.pool.execute(
      `SELECT COUNT(*) calls, COALESCE(SUM(total_tokens),0) tokens, COALESCE(SUM(cost_inr),0) cost
       FROM client_ai_usage_log WHERE org_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
      [orgId]
    );

    const [byFeature] = await db.pool.execute(
      `SELECT feature, COUNT(*) calls, COALESCE(SUM(cost_inr),0) cost, COALESCE(SUM(total_tokens),0) tokens
       FROM client_ai_usage_log
       WHERE org_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY feature ORDER BY cost DESC`,
      [orgId]
    );

    const [recent] = await db.pool.execute(
      `SELECT id, feature, provider, model, total_tokens, cost_inr, status, created_at
       FROM client_ai_usage_log
       WHERE org_id = ? ORDER BY created_at DESC LIMIT 20`,
      [orgId]
    );

    const [daily] = await db.pool.execute(
      `SELECT DATE(created_at) date, COUNT(*) calls, COALESCE(SUM(cost_inr),0) cost, COALESCE(SUM(total_tokens),0) tokens
       FROM client_ai_usage_log
       WHERE org_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       GROUP BY DATE(created_at) ORDER BY date`,
      [orgId]
    );

    return res.json({
      success: true,
      today: today[0],
      month: month[0],
      byFeature,
      recent,
      daily,
    });
  } catch (e) {
    console.error('[ai-config.usage]', e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/ai-config — reset (back to wiswits default)
exports.resetConfig = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // Principal must be able to RESET AI config too — updateConfig already allows
    // 'principal', so omitting it here 403'd a principal on reset only. (JWT carries
    // role_slug='principal', not base_role, so this direct slug check needs it.)
    if (!['owner', 'admin', 'principal'].includes(req.user.role_slug)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await db.pool.execute('DELETE FROM client_org_ai_config WHERE org_id = ?', [orgId]);
    return res.json({ success: true, message: 'AI config reset to WISWITS default' });
  } catch (e) {
    console.error('[ai-config.reset]', e);
    return res.status(500).json({ success: false, message: e.message });
  }
};
