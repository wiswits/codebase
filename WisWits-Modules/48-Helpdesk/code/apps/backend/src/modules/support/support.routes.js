const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const logger = require('../../utils/logger');

router.use(authenticate);

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || 'wiswits.edutech@gmail.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// POST /api/support/enquiry (SUG-0025 §19) — an in-app "Contact Us" enquiry.
// Captured into email_queue addressed to the support inbox (no new table).
router.post('/enquiry', async (req, res) => {
  try {
    const u = req.user;
    const { subject, message, category } = req.body;
    if (!message || !String(message).trim()) return error(res, 'Message is required', 400);

    const subj = `Support enquiry${category ? ` [${category}]` : ''}: ${String(subject || '').slice(0, 120) || 'No subject'}`;
    const html = `
      <h3>New support enquiry</h3>
      <p><b>From:</b> ${esc(u.email)} (user #${esc(u.user_id)}, role ${esc(u.role_slug)})</p>
      <p><b>Org:</b> #${esc(u.org_id)}</p>
      ${category ? `<p><b>Category:</b> ${esc(category)}</p>` : ''}
      <p><b>Subject:</b> ${esc(subject || '—')}</p>
      <hr/>
      <p style="white-space:pre-wrap">${esc(message)}</p>`;

    try {
      await query(
        `INSERT INTO email_queue (to_email, to_name, template_slug, subject, html_body, variables, status)
         VALUES (?, ?, 'support_enquiry', ?, ?, ?, 'pending')`,
        [SUPPORT_INBOX, 'WISWITS Support', subj, html,
         JSON.stringify({ from: u.email, org_id: u.org_id, role: u.role_slug, category: category || null })]);
    } catch (e) {
      // Queue table shape may differ — never lose the enquiry: log it as a fallback.
      logger.warn('support enquiry queue insert failed, logging instead:', e.message);
    }
    logger.info('[SUPPORT] enquiry', { org_id: u.org_id, user_id: u.user_id, role: u.role_slug, subject: subject || null, category: category || null });

    return success(res, {}, 'Thanks — our team will get back to you shortly.', 201);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
