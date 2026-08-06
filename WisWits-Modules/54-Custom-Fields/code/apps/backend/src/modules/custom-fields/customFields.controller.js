'use strict';
/*
 * CUSTOM FIELD DEFINITIONS — CRUD API (T2.6 Phase A, HANDOFF §E).
 * Admin designs the field schema per entity_type here; the VALUES flow through
 * the entity endpoints (students/staff/…), not this controller.
 *
 * Governance: every mutation is gated by the `fields` dimension — when the owner
 * has locked it, the admin sees the fields read-only ("Managed by WisWits").
 * Every mutation is audited. All rows are org-scoped; parameterized SQL only.
 */
const { query, queryOne } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const { adminCan } = require('../features/governance');
const svc = require('./customFields.service');

// field_key must be a stable, url/column-safe snake_case token, and must not
// shadow a fixed source-of-truth column on that entity (custom is ADDITIVE).
const KEY_RE = /^[a-z][a-z0-9_]{1,63}$/;

const asJson = (v) => (v == null ? null : JSON.stringify(v));

// The org's governance gate for the `fields` dimension. Fail-open lives in
// governance.js; here we just translate a locked dim into a 403.
async function ensureUnlocked(res, orgId) {
  if (!(await adminCan(orgId, 'fields'))) {
    error(res, 'Custom fields are managed by WisWits for your organization', 403);
    return false;
  }
  return true;
}

// GET /api/fields/:entity  — list defs (forms + admin manager both call this).
// ?all=1 includes inactive (admin manager only); default = active only.
const list = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const entity = req.params.entity;
    if (!svc.isEntity(entity)) return error(res, 'Unknown entity type', 400);
    const includeInactive = String(req.query.all) === '1';
    const defs = await svc.listDefs(orgId, entity, { includeInactive });
    // governance-aware: tell the UI whether this dimension is admin-editable.
    const managed = !(await adminCan(orgId, 'fields'));
    return success(res, { fields: defs, managed, entity, dataTypes: svc.DATA_TYPES });
  } catch (e) { return error(res, e.message, 500); }
};

// POST /api/fields/:entity  — create a definition.
const create = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const entity = req.params.entity;
    if (!svc.isEntity(entity)) return error(res, 'Unknown entity type', 400);
    if (!(await ensureUnlocked(res, orgId))) return;

    const b = req.body || {};
    const field_key = String(b.field_key || '').trim().toLowerCase();
    const label = String(b.label || '').trim();
    const data_type = String(b.data_type || 'text').trim();

    if (!KEY_RE.test(field_key)) return error(res, 'field_key must be snake_case (a-z, 0-9, _), 2-64 chars, starting with a letter', 400);
    if ((svc.RESERVED_KEYS[entity] || []).includes(field_key)) return error(res, `"${field_key}" is a built-in field — pick another key`, 400);
    if (!label) return error(res, 'label is required', 400);
    if (!svc.knownType(data_type)) return error(res, `data_type must be one of: ${svc.DATA_TYPES.join(', ')}`, 400);
    if (['select', 'radio', 'multiselect'].includes(data_type) && !(Array.isArray(b.options_json) && b.options_json.length))
      return error(res, `${data_type} requires a non-empty options list`, 400);

    const dup = await queryOne(
      'SELECT id FROM custom_field_definitions WHERE org_id=? AND entity_type=? AND field_key=?',
      [orgId, entity, field_key]);
    if (dup) return error(res, `A field with key "${field_key}" already exists`, 409);

    // append to the end by default
    const maxRow = await queryOne(
      'SELECT COALESCE(MAX(sort_order),0) AS m FROM custom_field_definitions WHERE org_id=? AND entity_type=?',
      [orgId, entity]);
    const sort_order = b.sort_order != null ? Number(b.sort_order) : Number(maxRow.m) + 10;

    const result = await query(
      `INSERT INTO custom_field_definitions
         (org_id, school_id, entity_type, field_key, label, data_type, options_json, validation_json,
          section, help_text, sort_order, is_required, is_active, is_system, visible_roles, editable_roles)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,0,?,?)`,
      [orgId, b.school_id || null, entity, field_key, label, data_type,
       asJson(b.options_json), asJson(b.validation_json), b.section || null, b.help_text || null,
       sort_order, b.is_required ? 1 : 0, asJson(b.visible_roles), asJson(b.editable_roles)]);

    await audit(req, 'CUSTOM_FIELD_CREATE', 'custom_field', result.insertId, { new_data: { entity, field_key, label, data_type } });
    return success(res, { id: result.insertId }, 'Field created', 201);
  } catch (e) { return error(res, e.message, 500); }
};

// PUT /api/fields/:entity/:id  — update a definition.
// A system field (blueprint core) may only be tuned (label/help/required/section/
// visibility/order), never re-keyed or re-typed — that would strand its values.
const update = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { entity, id } = req.params;
    if (!svc.isEntity(entity)) return error(res, 'Unknown entity type', 400);
    if (!(await ensureUnlocked(res, orgId))) return;

    const def = await svc.getDef(orgId, entity, id);
    if (!def) return error(res, 'Field not found', 404);

    const b = req.body || {};
    const sets = [];
    const params = [];
    const set = (col, val) => { sets.push(`${col}=?`); params.push(val); };

    if (b.label !== undefined) { if (!String(b.label).trim()) return error(res, 'label cannot be empty', 400); set('label', String(b.label).trim()); }
    if (b.help_text !== undefined) set('help_text', b.help_text || null);
    if (b.section !== undefined) set('section', b.section || null);
    if (b.is_required !== undefined) set('is_required', b.is_required ? 1 : 0);
    if (b.sort_order !== undefined) set('sort_order', Number(b.sort_order));
    if (b.is_active !== undefined) set('is_active', b.is_active ? 1 : 0);
    if (b.visible_roles !== undefined) set('visible_roles', asJson(b.visible_roles));
    if (b.editable_roles !== undefined) set('editable_roles', asJson(b.editable_roles));
    if (b.validation_json !== undefined) set('validation_json', asJson(b.validation_json));
    if (b.options_json !== undefined) {
      if (['select', 'radio', 'multiselect'].includes(def.data_type) && !(Array.isArray(b.options_json) && b.options_json.length))
        return error(res, `${def.data_type} requires a non-empty options list`, 400);
      set('options_json', asJson(b.options_json));
    }

    // data_type / field_key change: only for non-system fields, and re-key must
    // stay unique + non-reserved.
    if (b.data_type !== undefined && b.data_type !== def.data_type) {
      if (def.is_system) return error(res, 'A built-in field type cannot be changed', 400);
      if (!svc.knownType(b.data_type)) return error(res, `data_type must be one of: ${svc.DATA_TYPES.join(', ')}`, 400);
      set('data_type', b.data_type);
    }
    if (b.field_key !== undefined && b.field_key !== def.field_key) {
      if (def.is_system) return error(res, 'A built-in field key cannot be changed', 400);
      const nk = String(b.field_key).trim().toLowerCase();
      if (!KEY_RE.test(nk)) return error(res, 'field_key must be snake_case', 400);
      if ((svc.RESERVED_KEYS[entity] || []).includes(nk)) return error(res, `"${nk}" is a built-in field`, 400);
      const dup = await queryOne('SELECT id FROM custom_field_definitions WHERE org_id=? AND entity_type=? AND field_key=? AND id<>?', [orgId, entity, nk, id]);
      if (dup) return error(res, 'Another field already uses that key', 409);
      set('field_key', nk);
    }

    if (!sets.length) return error(res, 'Nothing to update', 400);
    params.push(orgId, entity, id);
    await query(`UPDATE custom_field_definitions SET ${sets.join(', ')} WHERE org_id=? AND entity_type=? AND id=?`, params);
    await audit(req, 'CUSTOM_FIELD_UPDATE', 'custom_field', id, { old_data: { field_key: def.field_key }, new_data: b });
    return success(res, {}, 'Field updated');
  } catch (e) { return error(res, e.message, 500); }
};

// PUT /api/fields/:entity/reorder  — { order: [id, id, ...] }
const reorder = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const entity = req.params.entity;
    if (!svc.isEntity(entity)) return error(res, 'Unknown entity type', 400);
    if (!(await ensureUnlocked(res, orgId))) return;

    const order = Array.isArray(req.body?.order) ? req.body.order.map(Number).filter(Boolean) : [];
    if (!order.length) return error(res, 'order array required', 400);

    // only touch rows that actually belong to this org+entity (ignore strays)
    const own = await query(
      `SELECT id FROM custom_field_definitions WHERE org_id=? AND entity_type=? AND id IN (${order.map(() => '?').join(',')})`,
      [orgId, entity, ...order]);
    const ownSet = new Set(own.map((r) => r.id));
    let i = 0;
    for (const id of order) {
      if (!ownSet.has(id)) continue;
      i += 10;
      await query('UPDATE custom_field_definitions SET sort_order=? WHERE org_id=? AND entity_type=? AND id=?', [i, orgId, entity, id]);
    }
    await audit(req, 'CUSTOM_FIELD_REORDER', 'custom_field', null, { new_data: { entity, order } });
    return success(res, {}, 'Order saved');
  } catch (e) { return error(res, e.message, 500); }
};

// DELETE /api/fields/:entity/:id  — soft delete (deactivate). System fields are
// protected: deactivate only, values preserved. Non-system optionally hard-purged.
const remove = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { entity, id } = req.params;
    if (!svc.isEntity(entity)) return error(res, 'Unknown entity type', 400);
    if (!(await ensureUnlocked(res, orgId))) return;

    const def = await svc.getDef(orgId, entity, id);
    if (!def) return error(res, 'Field not found', 404);

    const hard = String(req.query.hard) === '1';
    if (hard && def.is_system) return error(res, 'A built-in field cannot be deleted — deactivate it instead', 400);

    if (hard) {
      await query('DELETE FROM custom_field_values WHERE org_id=? AND entity_type=? AND field_key=?', [orgId, entity, def.field_key]);
      await query('DELETE FROM custom_field_definitions WHERE org_id=? AND entity_type=? AND id=?', [orgId, entity, id]);
    } else {
      await query('UPDATE custom_field_definitions SET is_active=0 WHERE org_id=? AND entity_type=? AND id=?', [orgId, entity, id]);
    }
    await audit(req, 'CUSTOM_FIELD_DELETE', 'custom_field', id, { old_data: { field_key: def.field_key, hard } });
    return success(res, {}, hard ? 'Field deleted' : 'Field deactivated');
  } catch (e) { return error(res, e.message, 500); }
};

module.exports = { list, create, update, reorder, remove };
