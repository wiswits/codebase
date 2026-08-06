'use strict';
/*
 * PUBLIC FORMS — T2.6 Phase E3. The tokenised Admissions intake form.
 *
 *  • admin side (authenticated): ensure/read/update the org's admissions form
 *    (custom_forms row, slug='admissions', entity_type='lead').
 *  • public side (UNAUTHENTICATED, rate-limited, own router): render the form's
 *    fields from the org's custom-field defs, and accept a submission → a
 *    client_leads row (source='public_form') + custom_field_values.
 *
 * The token is the whole request context on the public side — an unguessable
 * 18-char hex. A missing/inactive token answers exactly like a missing form (no
 * oracle). All writes are org-scoped via the form row; parameterized SQL only.
 */
const crypto = require('crypto');
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const customFields = require('../custom-fields/customFields.service');
const crmSvc = require('../../services/crmService');

const newToken = () => crypto.randomBytes(9).toString('hex'); // 18 hex chars

// Only ever expose the safe, render-relevant shape of a field def to the public.
const publicField = (d) => ({
  field_key: d.field_key, label: d.label, data_type: d.data_type,
  options_json: d.options_json || null, is_required: !!d.is_required,
  section: d.section || null, help_text: d.help_text || null,
});

// ── admin: ensure + read the org's admissions form ──────────────────────────
async function ensureAdmissionsForm(orgId) {
  let form = await queryOne(`SELECT * FROM custom_forms WHERE org_id=? AND slug='admissions' LIMIT 1`, [orgId]);
  if (!form) {
    const token = newToken();
    await query(
      // Seeded OFF deliberately, unlike a form someone deliberately creates: this row
      // is auto-created for EVERY org the first time the page loads. Switching it on by
      // default would silently open a public intake URL for every existing tenant
      // without anyone asking for one.
      `INSERT INTO custom_forms (org_id, slug, name, entity_type, intro_text, success_message, public_token, is_active)
       VALUES (?,?,?,?,?,?,?,0)`,
      [orgId, 'admissions', 'Admissions Enquiry', 'lead',
       'Fill this quick form and our team will reach out to you.',
       "Thank you! We've received your enquiry and will contact you soon.", token]);
    form = await queryOne(`SELECT * FROM custom_forms WHERE org_id=? AND slug='admissions' LIMIT 1`, [orgId]);
  }
  return form;
}

exports.adminGet = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const form = await ensureAdmissionsForm(orgId);
    const defs = await customFields.listDefs(orgId, form.entity_type);
    return success(res, {
      slug: form.slug, name: form.name, entity_type: form.entity_type,
      intro_text: form.intro_text, success_message: form.success_message,
      is_active: !!form.is_active, public_token: form.public_token,
      public_path: `/apply/${form.public_token}`,
      field_count: defs.length,
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.adminUpdate = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    await ensureAdmissionsForm(orgId);
    const b = req.body || {};
    const sets = [], params = [];
    const set = (c, v) => { sets.push(`${c}=?`); params.push(v); };
    if (b.name !== undefined) { if (!String(b.name).trim()) return error(res, 'Name cannot be empty', 400); set('name', String(b.name).trim().slice(0, 160)); }
    if (b.intro_text !== undefined) set('intro_text', b.intro_text ? String(b.intro_text).slice(0, 500) : null);
    if (b.success_message !== undefined) set('success_message', b.success_message ? String(b.success_message).slice(0, 500) : null);
    if (b.is_active !== undefined) set('is_active', b.is_active ? 1 : 0);
    if (b.regenerate_token) set('public_token', newToken());
    if (!sets.length) return error(res, 'Nothing to update', 400);
    params.push(orgId);
    await query(`UPDATE custom_forms SET ${sets.join(', ')} WHERE org_id=? AND slug='admissions'`, params);
    await audit(req, 'CUSTOM_FORM_UPDATE', 'custom_form', null, { new_data: { admissions: b } });
    const form = await queryOne(`SELECT * FROM custom_forms WHERE org_id=? AND slug='admissions'`, [orgId]);
    return success(res, { is_active: !!form.is_active, public_token: form.public_token, public_path: `/apply/${form.public_token}` }, 'Form saved');
  } catch (e) { return error(res, e.message, 500); }
};

// ── public: render form schema by token ─────────────────────────────────────
exports.publicGet = async (req, res) => {
  try {
    const token = String(req.params.token || '').trim().slice(0, 48);
    const form = await queryOne(`SELECT * FROM custom_forms WHERE public_token=? AND is_active=1 LIMIT 1`, [token]);
    if (!form) return error(res, 'Form not found', 404);
    const org = await queryOne('SELECT COALESCE(display_name, name) AS org_name, logo_url, brand_color FROM client_organizations WHERE id=?', [form.org_id]);
    const defs = await customFields.listDefs(form.org_id, form.entity_type);
    return success(res, {
      name: form.name, intro_text: form.intro_text,
      org_name: org?.org_name || null, logo_url: org?.logo_url || null, brand_color: org?.brand_color || null,
      fields: defs.map(publicField),
    });
  } catch (e) { return error(res, 'Form not found', 404); }
};

// ── public: accept a submission → lead + custom values ──────────────────────
exports.publicSubmit = async (req, res) => {
  try {
    const token = String(req.params.token || '').trim().slice(0, 48);
    const form = await queryOne(`SELECT * FROM custom_forms WHERE public_token=? AND is_active=1 LIMIT 1`, [token]);
    if (!form) return error(res, 'Form not found', 404);
    const orgId = form.org_id;

    const b = req.body || {};
    const first_name = String(b.first_name || '').trim();
    const phone = String(b.phone || '').trim();
    if (!first_name) return error(res, 'Your name is required', 400);
    if (!phone) return error(res, 'A phone number is required', 400);
    if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email))) return error(res, 'Enter a valid email', 400);

    // custom fields validated against the form's entity defs (required enforced)
    const cf = await customFields.validateCustom(orgId, form.entity_type, b.custom || {}, { enforceRequired: true });
    if (!cf.ok) return error(res, cf.message, 400);

    // Every submission is stored as a response (viewable per form in /forms).
    const fullName = `${first_name} ${String(b.last_name || '').trim()}`.trim();
    await query(
      `INSERT INTO form_submissions (org_id, form_id, name, phone, email, answers_json) VALUES (?,?,?,?,?,?)`,
      [orgId, form.id, fullName.slice(0, 160), phone.slice(0, 30),
       String(b.email || '').trim().slice(0, 160) || null, JSON.stringify(cf.cleaned || {})]);

    // Admissions / lead forms ALSO feed the CRM pipeline. Other forms (staff
    // hiring, custom) just collect responses — no lead. ensureLeadStages so the
    // lead lands in a real stage and shows on the board.
    if (form.entity_type === 'lead' || form.entity_type === 'admission') {
      await crmSvc.ensureLeadStages(orgId);
      const stage = await queryOne('SELECT id FROM client_lead_stages WHERE org_id=? AND is_active=1 ORDER BY sort_order ASC, id ASC LIMIT 1', [orgId]).catch(() => null);
      // school_id is deliberately LEFT NULL here, and this is NOT the same
      // omission the CRM insert had. Nobody is logged in on a public form, so
      // there is no active branch to read, and the form never asks which campus.
      // NULL means "organisation-wide", so a walk-in enquiry stays visible to
      // EVERY branch's admissions desk until somebody claims it — the honest
      // state of an enquiry that has not chosen a campus. Guessing the primary
      // branch would hide it from the campus it was actually meant for. If
      // per-campus public forms are wanted, the form needs a campus field; that
      // is a product change, not a scoping fix.
      const r = await query(
        `INSERT INTO client_leads (org_id, first_name, last_name, phone, email, parent_name, source, source_detail, stage_id)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [orgId, first_name.slice(0, 100), String(b.last_name || '').trim().slice(0, 100) || null,
         phone.slice(0, 20), String(b.email || '').trim().slice(0, 150) || null,
         String(b.parent_name || '').trim().slice(0, 200) || null, 'public_form', `form:${form.slug}`,
         stage ? stage.id : null]);
      await customFields.writeValues(orgId, form.entity_type, r.insertId, cf.cleaned);
    }
    return success(res, { submitted: true, message: form.success_message || 'Thank you! Your submission has been received.' }, 'Submitted', 201);
  } catch (e) { return error(res, 'Could not submit — please try again', 500); }
};

// ── admin: generic forms CRUD (the Form Builder) ────────────────────────────
const ENTITY_LABELS = { lead: 'Admissions / Enquiry', admission: 'Admissions', staff: 'Staff / Hiring', student: 'Student', guardian: 'Guardian' };
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'form';

// GET /api/forms — every form for the org + response counts
exports.list = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    await ensureAdmissionsForm(orgId); // the default admissions form always exists
    const rows = await query(
      `SELECT f.*, (SELECT COUNT(*) FROM form_submissions s WHERE s.form_id=f.id) AS responses
         FROM custom_forms f WHERE f.org_id=? ORDER BY f.id ASC`, [orgId]);
    return success(res, { forms: rows.map((f) => ({
      id: f.id, slug: f.slug, name: f.name, entity_type: f.entity_type,
      entity_label: ENTITY_LABELS[f.entity_type] || f.entity_type,
      intro_text: f.intro_text, success_message: f.success_message,
      is_active: !!f.is_active, public_token: f.public_token,
      public_path: `/apply/${f.public_token}`, responses: Number(f.responses) || 0,
    })) });
  } catch (e) { return error(res, e.message, 500); }
};

// POST /api/forms — create a named public form for any entity
exports.create = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const entity_type = customFields.isEntity(b.entity_type) ? b.entity_type : 'lead';
    if (!name) return error(res, 'Form name is required', 400);
    // unique slug per org
    let base = slugify(name), slug = base, n = 1;
    while (await queryOne('SELECT id FROM custom_forms WHERE org_id=? AND slug=?', [orgId, slug])) slug = `${base}-${++n}`;
    const token = newToken();
    const r = await query(
      // ── CREATED LIVE, NOT OFF ─────────────────────────────────────────────
      // This wrote is_active=0, and the manager rendered the share link only for an
      // ACTIVE form — so a form you had just created showed no link at all. AK built
      // one at JD PUBLIC SCHOOL and reported "created form show nahi ho rahe hai": it
      // was in the list, but the thing you make a form FOR was invisible until you
      // found an unlabelled power button.
      //
      // A form is created because someone wants to share it, so create → copy link →
      // send is now the whole job. Switching it off is one clearly-labelled click, and
      // the link renders either way so an off form is visibly off rather than absent.
      //
      // NOTE: `ensureAdmissionsForm` above stays OFF on purpose — that row is created
      // automatically for every org, and turning it on by default would open a public
      // URL for every tenant without anyone asking.
      `INSERT INTO custom_forms (org_id, slug, name, entity_type, intro_text, success_message, public_token, is_active)
       VALUES (?,?,?,?,?,?,?,1)`,
      [orgId, slug, name.slice(0, 160), entity_type,
       b.intro_text ? String(b.intro_text).slice(0, 500) : 'Please fill this form.',
       b.success_message ? String(b.success_message).slice(0, 500) : 'Thank you! Your submission has been received.', token]);
    await audit(req, 'CUSTOM_FORM_CREATE', 'custom_form', r.insertId, { new_data: { name, entity_type } });
    return success(res, { id: r.insertId, slug, public_token: token, public_path: `/apply/${token}`, is_active: true }, 'Form created and live', 201);
  } catch (e) { return error(res, e.message, 500); }
};

// PUT /api/forms/:id — update name/intro/success/active/token
exports.updateForm = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const form = await queryOne('SELECT * FROM custom_forms WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!form) return error(res, 'Form not found', 404);
    const b = req.body || {};
    const sets = [], params = [];
    const set = (c, v) => { sets.push(`${c}=?`); params.push(v); };
    if (b.name !== undefined) { if (!String(b.name).trim()) return error(res, 'Name cannot be empty', 400); set('name', String(b.name).trim().slice(0, 160)); }
    if (b.intro_text !== undefined) set('intro_text', b.intro_text ? String(b.intro_text).slice(0, 500) : null);
    if (b.success_message !== undefined) set('success_message', b.success_message ? String(b.success_message).slice(0, 500) : null);
    if (b.is_active !== undefined) set('is_active', b.is_active ? 1 : 0);
    if (b.regenerate_token) set('public_token', newToken());
    if (!sets.length) return error(res, 'Nothing to update', 400);
    params.push(req.params.id, orgId);
    await query(`UPDATE custom_forms SET ${sets.join(', ')} WHERE id=? AND org_id=?`, params);
    await audit(req, 'CUSTOM_FORM_UPDATE', 'custom_form', req.params.id, { new_data: b });
    const f = await queryOne('SELECT * FROM custom_forms WHERE id=? AND org_id=?', [req.params.id, orgId]);
    return success(res, { is_active: !!f.is_active, public_token: f.public_token, public_path: `/apply/${f.public_token}` }, 'Form saved');
  } catch (e) { return error(res, e.message, 500); }
};

// DELETE /api/forms/:id — remove a form + its responses (the built-in admissions form is protected)
exports.removeForm = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const form = await queryOne('SELECT * FROM custom_forms WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!form) return error(res, 'Form not found', 404);
    if (form.slug === 'admissions') return error(res, 'The built-in Admissions form cannot be deleted — turn it off instead', 400);
    await query('DELETE FROM form_submissions WHERE org_id=? AND form_id=?', [orgId, req.params.id]);
    await query('DELETE FROM custom_forms WHERE id=? AND org_id=?', [req.params.id, orgId]);
    await audit(req, 'CUSTOM_FORM_DELETE', 'custom_form', req.params.id, { old_data: { name: form.name } });
    return success(res, {}, 'Form deleted');
  } catch (e) { return error(res, e.message, 500); }
};

// DELETE /api/forms/:id/submissions/:subId — remove ONE response, for good.
//
// ── Why this is a hard delete, and deliberately so ──────────────────────────
// A lead deleted from the CRM can be brought back, because the response it came
// from is still here — `form_submissions` is the ORIGINAL record and the leads
// board is a working copy of it. That makes this the one place where deleting
// actually means deleting, and there is nowhere further back to restore from.
//
// So the safety lives at the two points where it can still help: the UI asks
// before it acts, and holds the row for ten seconds with an Undo before this
// route is ever called. Past that, the row is gone — a "trash" here would just
// be a second thing to remember to empty, and would keep a family's phone
// number and answers on file after a school chose to remove them.
//
// The lead the response created is NOT touched. It has its own lifecycle (a
// school may have worked it for weeks), and silently deleting someone's pipeline
// entry because an old form response was tidied up would be a surprise, not a
// convenience.
exports.removeSubmission = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id, subId } = req.params;

    // Scoped by org AND by the form in the URL, so a submission id cannot be
    // deleted through a form that does not own it, or from another tenant.
    const sub = await queryOne(
      'SELECT id, name, phone, email, created_at FROM form_submissions WHERE id=? AND form_id=? AND org_id=?',
      [subId, id, orgId]);
    if (!sub) return error(res, 'Response not found', 404);

    await query('DELETE FROM form_submissions WHERE id=? AND form_id=? AND org_id=?', [subId, id, orgId]);

    // The whole row goes into the audit trail, because after this the database
    // holds nothing else about it — the audit entry IS the record that it
    // existed, who removed it, and when.
    await audit(req, 'FORM_SUBMISSION_DELETE', 'form_submission', subId, {
      old_data: { form_id: Number(id), name: sub.name, phone: sub.phone, email: sub.email, created_at: sub.created_at },
    });

    return success(res, {}, `Response from ${sub.name || 'this person'} deleted`);
  } catch (e) { return error(res, e.message, 500); }
};

// GET /api/forms/:id/submissions — a form's responses (newest first)
exports.submissions = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const form = await queryOne('SELECT id, entity_type FROM custom_forms WHERE id=? AND org_id=?', [req.params.id, orgId]);
    if (!form) return error(res, 'Form not found', 404);
    const defs = await customFields.listDefs(orgId, form.entity_type);
    const rows = await query(
      'SELECT id, name, phone, email, answers_json, created_at FROM form_submissions WHERE org_id=? AND form_id=? ORDER BY id DESC LIMIT 500',
      [orgId, req.params.id]);
    const parse = (v) => { if (v == null) return {}; if (typeof v === 'object') return v; try { return JSON.parse(v); } catch { return {}; } };
    return success(res, {
      fields: defs.map((d) => ({ field_key: d.field_key, label: d.label })),
      submissions: rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, answers: parse(r.answers_json), created_at: r.created_at })),
    });
  } catch (e) { return error(res, e.message, 500); }
};
