// cms module — shared in-module helpers (not a route file; registry ignores it).
const { queryOne } = require('../../config/db');
// Delegates to rbac's userCan so the handler reads the SAME permission store as the
// route gate — see the note in modules/hr/shared.js. Was a local copy that read the
// legacy JSON column only.
const { userCan } = require('../../middleware/rbac');

const employeeFor = (orgId, userId) =>
  queryOne('SELECT * FROM client_hr_employees WHERE org_id=? AND user_id=?', [orgId, userId]);

const getAsset = (orgId, id) =>
  queryOne('SELECT * FROM client_cms_assets WHERE id=? AND org_id=?', [id, orgId]);

// Editor rights: own draft/changes_requested, or cms.asset.update_any.
async function canEditAsset(req, asset) {
  const emp = await employeeFor(req.user.org_id, req.user.user_id);
  if (emp && asset.created_by === emp.id) return { ok: true, emp };
  if (await userCan(req.user.user_id, 'cms.asset.update_any', req.user.org_id)) return { ok: true, emp };
  return { ok: false, emp };
}

// LaTeX rules (LOCKED): `$...$` is banned — reject at validation. `\frac` is
// linted — mandatory `\dfrac` — surfaced as warnings, not errors. Applied to
// every string anywhere in the payload.
function latexCheck(payload) {
  const errors = [], warnings = [];
  const walk = (v, path) => {
    if (typeof v === 'string') {
      if (/(^|[^\\])\$/.test(v)) errors.push(`${path}: '$' math delimiters are banned — use \\( \\) or \\[ \\]`);
      if (/\\frac\b/.test(v)) warnings.push(`${path}: use \\dfrac instead of \\frac`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(payload ?? {}, 'payload');
  return { errors, warnings };
}

const pad2 = (n) => String(n).padStart(2, '0');

module.exports = { userCan, employeeFor, getAsset, canEditAsset, latexCheck, pad2 };
