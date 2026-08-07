'use strict';
const { query, transaction } = require('../../../config/db');

const SELECT_FIELDS = `
  id,
  mode,
  selector,
  selector_id    AS selectorId,
  selector_value AS selectorValue,
  applies_to     AS appliesTo
`;

async function listRules(orgId, eventId) {
  return query(
    `SELECT ${SELECT_FIELDS}
       FROM client_em_event_audience
      WHERE org_id = ? AND event_id = ?
      ORDER BY mode, selector, id`,
    [orgId, eventId]);
}

/**
 * Replace an event's whole rule set, in ONE transaction.
 *
 * Delete-then-insert without a transaction would leave the event addressed to
 * NOBODY if the insert failed — and "nobody" is not a visible failure. The
 * school would publish, nothing would arrive, and the only symptom would be
 * silence. Either the new sentence lands whole or the old one stays.
 */
async function replaceRules(orgId, eventId, rules, userId) {
  return transaction(async (tx) => {
    await tx.query('DELETE FROM client_em_event_audience WHERE org_id = ? AND event_id = ?',
      [orgId, eventId]);
    for (const r of rules) {
      await tx.query(
        `INSERT INTO client_em_event_audience
           (org_id, event_id, mode, selector, selector_id, selector_value, applies_to, created_by)
         VALUES (?,?,?,?,?,?,?,?)`,
        [orgId, eventId, r.mode || 'include', r.selector,
          r.selectorId ?? null, r.selectorValue || null, r.appliesTo || 'both', userId || null]);
    }
    return rules.length;
  });
}

/**
 * What the picker can offer. Everything here is org-scoped, and everything a
 * school can NAME in a rule must appear in exactly one of these lists — a
 * picker that offers an id the resolver cannot resolve is how an audience ends
 * up quietly smaller than the screen said.
 */
async function pickerOptions(orgId) {
  const [classes, sections, groups, roles, staffKinds] = await Promise.all([
    query(`SELECT c.id, c.name FROM client_classes c
            WHERE c.org_id = ? ORDER BY COALESCE(c.display_order, 9999), c.name`, [orgId]).catch(() => []),
    query(`SELECT s.id, s.name, s.class_id AS classId, c.name AS className
             FROM client_sections s
             JOIN client_classes c ON c.id = s.class_id AND c.org_id = s.org_id
            WHERE s.org_id = ? ORDER BY c.name, s.name`, [orgId]).catch(() => []),
    query(`SELECT g.id, g.name, g.kind FROM client_student_groups g
            WHERE g.org_id = ? AND g.status = 'active' ORDER BY g.name`, [orgId]).catch(() => []),
    // Only roles somebody actually HOLDS. Offering an empty role is offering a
    // rule that resolves to nobody.
    query(`SELECT r.slug, r.name, COUNT(ur.id) AS people
             FROM client_roles r
             JOIN client_user_roles ur ON ur.role_id = r.id AND ur.org_id = r.org_id
             JOIN client_users u ON u.id = ur.user_id AND u.org_id = ur.org_id AND u.is_active = 1
            WHERE r.org_id = ?
            GROUP BY r.slug, r.name
           HAVING people > 0
            ORDER BY r.name`, [orgId]).catch(() => []),
    query(`SELECT staff_kind AS value, COUNT(*) AS people
             FROM client_users
            WHERE org_id = ? AND is_active = 1 AND staff_kind IS NOT NULL
            GROUP BY staff_kind`, [orgId]).catch(() => []),
  ]);

  return { classes, sections, groups, roles, staffKinds };
}

module.exports = { listRules, replaceRules, pickerOptions };
