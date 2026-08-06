'use strict';
/*
 * CUSTOM FIELDS — the ONE field engine (T2.6 Phase A, HANDOFF §E).
 *
 * Everything about custom fields resolves through this service so there is a
 * SINGLE source of truth for: which entity types exist, the type registry
 * (validate + cast), reading a merged `custom` object, and writing values in a
 * txn-safe upsert. Controllers (definitions CRUD) and entity endpoints
 * (students/staff/admissions) both call in here — never re-implement validation
 * or casting at a call site.
 *
 * Value storage: EVERY value is stored as text in custom_field_values.value_text
 * and cast back on read (number → Number, checkbox → bool, multiselect/address →
 * parsed JSON, else string). Fixed columns stay source-of-truth; custom is ADDITIVE.
 */
const { query, pool } = require('../../config/db');

// entity_type whitelist (HANDOFF §E). Extend here + seed defs to add an entity.
const ENTITY_TYPES = ['student', 'staff', 'admission', 'lead', 'guardian'];

// field_keys that would shadow a real fixed column — rejected on create so custom
// stays purely ADDITIVE and never competes with the source-of-truth column.
const RESERVED_KEYS = {
  student: ['id', 'org_id', 'user_id', 'school_id', 'first_name', 'last_name', 'email',
    'phone', 'password', 'admission_number', 'date_of_birth', 'gender', 'blood_group',
    'address', 'emergency_contact', 'section_id', 'is_active', 'custom'],
  staff: ['id', 'org_id', 'user_id', 'first_name', 'last_name', 'email', 'phone',
    'password', 'role_id', 'designation', 'department', 'department_id', 'is_active', 'custom'],
  admission: ['id', 'org_id', 'custom', 'first_name', 'last_name', 'phone', 'email', 'parent_name'],
  // contact fields are captured directly by the public form — keep them out of
  // the custom set so they never render twice.
  lead: ['id', 'org_id', 'custom', 'first_name', 'last_name', 'phone', 'email', 'parent_name'],
  guardian: ['id', 'org_id', 'custom'],
};

const isEntity = (t) => ENTITY_TYPES.includes(t);

// ── Type registry ───────────────────────────────────────────────────────────
// Each type: validate(raw, def) → { ok, value } | { ok:false, message }, where
// `value` is the STRING to persist; and cast(text, def) → the typed read value.
const str = (v) => String(v).trim();
const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const optionValues = (def) => {
  const raw = def.options_json;
  const arr = Array.isArray(raw) ? raw : [];
  // options may be ['A','B'] or [{value,label}] — accept either
  return arr.map((o) => (o && typeof o === 'object' ? o.value : o)).map(String);
};

const TYPES = {
  text:     { validate: (v) => ({ ok: true, value: str(v) }), cast: (t) => t },
  textarea: { validate: (v) => ({ ok: true, value: str(v) }), cast: (t) => t },
  email:    { validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(v)) ? { ok: true, value: str(v) } : { ok: false, message: 'must be a valid email' }, cast: (t) => t },
  phone:    { validate: (v) => ({ ok: true, value: str(v).replace(/[^\d+\-() ]/g, '') }), cast: (t) => t },
  url:      { validate: (v) => /^https?:\/\/\S+$/i.test(str(v)) ? { ok: true, value: str(v) } : { ok: false, message: 'must be a valid URL (http/https)' }, cast: (t) => t },
  file:     { validate: (v) => ({ ok: true, value: str(v) }), cast: (t) => t },
  relation: { validate: (v) => ({ ok: true, value: str(v) }), cast: (t) => t },
  number: {
    validate: (v) => { const n = Number(v); return Number.isFinite(n) ? { ok: true, value: String(n) } : { ok: false, message: 'must be a number' }; },
    cast: (t) => { const n = Number(t); return Number.isFinite(n) ? n : null; },
  },
  date: {
    validate: (v) => /^\d{4}-\d{2}-\d{2}$/.test(str(v).slice(0, 10)) && !Number.isNaN(new Date(str(v).slice(0, 10) + 'T00:00:00Z').getTime())
      ? { ok: true, value: str(v).slice(0, 10) } : { ok: false, message: 'must be a date (YYYY-MM-DD)' },
    cast: (t) => t,
  },
  datetime: {
    validate: (v) => !Number.isNaN(new Date(str(v)).getTime()) ? { ok: true, value: new Date(str(v)).toISOString() } : { ok: false, message: 'must be a valid date/time' },
    cast: (t) => t,
  },
  checkbox: {
    validate: (v) => ({ ok: true, value: (v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true') ? '1' : '0' }),
    cast: (t) => t === '1',
  },
  select: {
    validate: (v, def) => optionValues(def).includes(str(v)) ? { ok: true, value: str(v) } : { ok: false, message: 'not an allowed option' },
    cast: (t) => t,
  },
  radio: {
    validate: (v, def) => optionValues(def).includes(str(v)) ? { ok: true, value: str(v) } : { ok: false, message: 'not an allowed option' },
    cast: (t) => t,
  },
  multiselect: {
    validate: (v, def) => {
      const arr = Array.isArray(v) ? v.map(String) : (isBlank(v) ? [] : [str(v)]);
      const allowed = optionValues(def);
      const bad = arr.filter((x) => !allowed.includes(x));
      if (bad.length) return { ok: false, message: `invalid option(s): ${bad.join(', ')}` };
      return { ok: true, value: JSON.stringify(arr) };
    },
    cast: (t) => { try { const a = JSON.parse(t); return Array.isArray(a) ? a : []; } catch { return []; } },
  },
  address: {
    validate: (v) => {
      const obj = (v && typeof v === 'object') ? v : null;
      if (!obj) return { ok: false, message: 'must be an address object' };
      return { ok: true, value: JSON.stringify(obj) };
    },
    cast: (t) => { try { return JSON.parse(t); } catch { return null; } },
  },
};

const DATA_TYPES = Object.keys(TYPES);
const knownType = (t) => Object.prototype.hasOwnProperty.call(TYPES, t);

// ── Definitions read ────────────────────────────────────────────────────────
// mysql2 with a JSON column returns already-parsed objects, but be defensive if
// the column is ever TEXT.
const parseJson = (v, fallback = null) => {
  if (v == null) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

function hydrateDef(row) {
  return {
    ...row,
    options_json: parseJson(row.options_json, null),
    validation_json: parseJson(row.validation_json, null),
    visible_roles: parseJson(row.visible_roles, null),
    editable_roles: parseJson(row.editable_roles, null),
    is_required: !!row.is_required,
    is_active: !!row.is_active,
    is_system: !!row.is_system,
  };
}

// Active defs for an entity (the set forms render + validate against). Org-scoped;
// includes org-wide (school_id NULL) always, plus branch-specific defs.
async function listDefs(orgId, entityType, { includeInactive = false, schoolId = null } = {}) {
  const params = [orgId, entityType];
  let sql = `SELECT * FROM custom_field_definitions WHERE org_id=? AND entity_type=?`;
  if (!includeInactive) sql += ' AND is_active=1';
  if (schoolId != null) { sql += ' AND (school_id IS NULL OR school_id=?)'; params.push(schoolId); }
  sql += ' ORDER BY sort_order ASC, id ASC';
  const rows = await query(sql, params);
  return rows.map(hydrateDef);
}

async function getDef(orgId, entityType, id) {
  const rows = await query(
    'SELECT * FROM custom_field_definitions WHERE org_id=? AND entity_type=? AND id=? LIMIT 1',
    [orgId, entityType, id]);
  return rows[0] ? hydrateDef(rows[0]) : null;
}

// ── Value validation ────────────────────────────────────────────────────────
// Validate a `custom:{field_key:value}` payload against the org's active defs.
//  - enforceRequired: on create, a required field must be present & non-blank;
//    on partial update it is false (an omitted field means "leave it alone").
//  - unknown keys are ignored (a form may post extra keys); only active defs count.
// Returns { ok, cleaned:{field_key:valueText}, message }.
async function validateCustom(orgId, entityType, custom = {}, { enforceRequired = false, schoolId = null } = {}) {
  if (!isEntity(entityType)) return { ok: false, message: `unknown entity type: ${entityType}` };
  const defs = await listDefs(orgId, entityType, { schoolId });
  const cleaned = {};
  const provided = custom && typeof custom === 'object' ? custom : {};

  for (const def of defs) {
    const has = Object.prototype.hasOwnProperty.call(provided, def.field_key);
    const raw = provided[def.field_key];

    if (!has || isBlank(raw)) {
      // multiselect blank = empty array is a legitimate "cleared" value; others skip
      if (enforceRequired && def.is_required) {
        return { ok: false, message: `${def.label} is required` };
      }
      // explicit blank on an update = clear the value (store empty)
      if (has) cleaned[def.field_key] = def.data_type === 'multiselect' ? '[]' : '';
      continue;
    }

    const type = TYPES[def.data_type] || TYPES.text;
    const r = type.validate(raw, def);
    if (!r.ok) return { ok: false, message: `${def.label}: ${r.message}` };
    cleaned[def.field_key] = r.value;
  }
  return { ok: true, cleaned };
}

// ── Value read / write ──────────────────────────────────────────────────────
// Merged, typed `custom` object for one entity. {} when the org has no fields.
async function readValues(orgId, entityType, entityId) {
  const defs = await listDefs(orgId, entityType);
  if (!defs.length) return {};
  const rows = await query(
    'SELECT field_key, value_text FROM custom_field_values WHERE org_id=? AND entity_type=? AND entity_id=?',
    [orgId, entityType, entityId]);
  const byKey = Object.fromEntries(rows.map((r) => [r.field_key, r.value_text]));
  const out = {};
  for (const def of defs) {
    if (!(def.field_key in byKey)) continue;
    const type = TYPES[def.data_type] || TYPES.text;
    out[def.field_key] = byKey[def.field_key] == null ? null : type.cast(byKey[def.field_key], def);
  }
  return out;
}

// Bulk read for list endpoints (Phase E): { entity_id: {custom} }.
async function readValuesBulk(orgId, entityType, entityIds = []) {
  const ids = [...new Set(entityIds.map(Number).filter(Boolean))];
  if (!ids.length) return {};
  const defs = await listDefs(orgId, entityType);
  const defByKey = Object.fromEntries(defs.map((d) => [d.field_key, d]));
  const rows = await query(
    `SELECT entity_id, field_key, value_text FROM custom_field_values
      WHERE org_id=? AND entity_type=? AND entity_id IN (${ids.map(() => '?').join(',')})`,
    [orgId, entityType, ...ids]);
  const out = {};
  for (const r of rows) {
    const def = defByKey[r.field_key];
    if (!def) continue;
    const type = TYPES[def.data_type] || TYPES.text;
    (out[r.entity_id] ||= {})[r.field_key] = r.value_text == null ? null : type.cast(r.value_text, def);
  }
  return out;
}

// Upsert cleaned values for one entity. Runs on `conn` when given (same txn as the
// entity write), else on the pool. NEVER throws for "no fields" — a plain no-op.
async function writeValues(orgId, entityType, entityId, cleaned = {}, conn = null) {
  const keys = Object.keys(cleaned);
  if (!keys.length) return;
  const run = conn ? conn.execute.bind(conn) : pool.execute.bind(pool);
  for (const key of keys) {
    await run(
      `INSERT INTO custom_field_values (org_id, entity_type, entity_id, field_key, value_text)
         VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE value_text=VALUES(value_text)`,
      [orgId, entityType, entityId, key, cleaned[key]]);
  }
}

// ── Blueprint seeding (T2.6 Phase C) ────────────────────────────────────────
// Seed an institution type's STARTER field definitions for a freshly-onboarded
// org. `fieldSets` = { entity_type: [ {field_key,label,data_type,options,section,
// sort_order,is_required,help_text}, ... ] } — the blueprint's field_sets_json.
//
// Seeded rows are is_system=1 (blueprint core — protected: deactivate, not delete).
// INSERT IGNORE on UNIQUE(org_id,entity_type,field_key): never clobbers a field the
// admin later customised, and re-running is a no-op. Runs on the onboard `conn` so
// it commits in the SAME transaction as the org row. Fail-soft: a bad/absent field
// set must never break onboarding (mirrors seedOrgFromBlueprint's posture).
async function seedFromBlueprint(conn, orgId, fieldSets = {}) {
  if (!fieldSets || typeof fieldSets !== 'object') return 0;
  const run = conn ? conn.execute.bind(conn) : pool.execute.bind(pool);
  let n = 0;
  for (const [entityType, defs] of Object.entries(fieldSets)) {
    if (!isEntity(entityType) || !Array.isArray(defs)) continue;
    const reserved = new Set(RESERVED_KEYS[entityType] || []);
    let order = 0;
    for (const d of defs) {
      const key = String(d?.field_key || '').trim().toLowerCase();
      const dataType = knownType(d?.data_type) ? d.data_type : 'text';
      order += 10;
      // skip malformed keys and anything shadowing a fixed column (custom is ADDITIVE)
      if (!/^[a-z][a-z0-9_]{1,63}$/.test(key) || reserved.has(key)) continue;
      const options = ['select', 'radio', 'multiselect'].includes(dataType) && Array.isArray(d.options) ? d.options
        : (Array.isArray(d.options_json) ? d.options_json : null);
      try {
        const [r] = await run(
          `INSERT IGNORE INTO custom_field_definitions
             (org_id, entity_type, field_key, label, data_type, options_json, section, help_text,
              sort_order, is_required, is_active, is_system)
           VALUES (?,?,?,?,?,?,?,?,?,?,1,1)`,
          [orgId, entityType, key, String(d.label || key), dataType,
           options ? JSON.stringify(options) : null, d.section || null, d.help_text || null,
           Number.isFinite(d.sort_order) ? d.sort_order : order, d.is_required ? 1 : 0]);
        if (r?.affectedRows) n += r.affectedRows;
      } catch { /* one bad def must not abort the rest */ }
    }
  }
  return n;
}

module.exports = {
  ENTITY_TYPES, DATA_TYPES, RESERVED_KEYS, isEntity, knownType,
  listDefs, getDef, hydrateDef,
  validateCustom, readValues, readValuesBulk, writeValues,
  seedFromBlueprint,
};
