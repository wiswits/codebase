const express = require('express');
const router  = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { success, error, paginated } = require('../../utils/response');
const { authenticate }    = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requireRole }     = require('../../middleware/rbac');
const notifSvc = require('../../services/notificationService');
const { audit } = require('../../utils/audit');
const { parseMoney, moneyError } = require('../../utils/money');
// The ONE place fee money is defined. Every SUM below composes these instead of
// hand-rolling its own, because fifteen modules hand-rolling their own is how
// Analytics came to report a different defaulter count from the Fees module.
const {
  PAID_FOR_ASSIGNMENT, recomputeAssignmentStatus, recomputeStudentStatuses,
  buildSchedule, validateSchedule, writeSchedule, allocate, daysOverdue, ageBucket, PARTS_FOR_FREQUENCY,
  billableTotal,
} = require('../../services/feeLedger');
// multi-branch: fee rows carry student_id/class_id, not school_id, so we scope by
// joining to the already-branch-tagged client_students / client_classes.
const { getActiveSchool } = require('../../utils/activeSchool');
// ONE definition of "this student_id still belongs to a child who is here" —
// shared with the dashboard, reports and transport. See utils/headcount.js.
const { activeStudent } = require('../../utils/headcount');

// The payment modes the product supports. MUST stay in sync with the
// client_fee_payments.payment_mode ENUM (scripts/migrations/018_widen_payment_mode_enum.js)
// and with MODES in apps/web/src/components/fees/CollectionPanel.tsx. A value offered
// by the UI but absent from the ENUM fails the INSERT with MariaDB error 1265 and
// surfaces as an opaque 500 — that is exactly how 'upi' and 'card' were broken.
const PAYMENT_MODES = ['cash', 'upi', 'card', 'cheque', 'online', 'bank_transfer'];

// The lifecycle of a receipt. MUST stay in sync with the
// client_fee_payments.status ENUM (migrations/045_fee_schedule_and_reversals.sql),
// and it is load-bearing in a way payment_mode is not: EVERY collected-money sum
// in the product filters on `status='completed'` (services/feeLedger.js), so a
// value the code writes but the column cannot hold breaks reversal AND leaves
// the reversed money counted. Checked per-environment by scripts/enum_drift_check.js.
//   completed — money the school holds. The only value that counts.
//   refunded  — went back to the family (gateway refund, or a desk refund)
//   cancelled — entered by mistake; the money never moved
//   pending   — initiated, not yet landed
const PAYMENT_STATUSES = ['completed', 'pending', 'refunded', 'cancelled'];

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('finance'));
// Fees & payments are FINANCE data: restrict to elevated roles + accountant.
const requireFinance = requireRole('owner', 'admin', 'principal', 'accountant');

// Per-student fee reads: finance roles see all; a parent sees only their own
// children. Students NEVER see fee data (product policy) — and without this
// check any authenticated user could iterate studentId across the org (IDOR).
const FINANCE_ROLES = ['owner', 'admin', 'principal', 'accountant', 'super_admin', 'system_admin'];
async function canViewStudentFees(user, studentId, orgId) {
  if (FINANCE_ROLES.includes(user.role_slug)) return true;
  if (user.role_slug !== 'parent') return false;
  const parent = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [orgId, user.user_id]);
  if (!parent) return false;
  const link = await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parent.id, studentId]);
  return !!link;
}

// ═══ Generate receipt number ═══
async function generateReceiptNumber(orgId) {
  const year = new Date().getFullYear();
  await query(
    `INSERT INTO client_fee_counters (org_id, year, last_number) VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
    [orgId, year]);
  const row = await queryOne('SELECT last_number FROM client_fee_counters WHERE org_id=? AND year=?', [orgId, year]);
  return `RCP-${year}-${String(row.last_number).padStart(5, '0')}`;
}

// ═══ DASHBOARD / STATS ═══
router.get('/dashboard', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // branch scope: restrict fee rows to students of the active branch (null → all)
    const activeSchool = await getActiveSchool(req);
    const stuPred = activeSchool ? ' AND student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : '';
    const sp = () => activeSchool ? [orgId, activeSchool] : [];

    // `AND status='completed'` on every one of these: a refunded or voided
    // payment is money the school no longer holds, and counting it inflates
    // the collection rate, hides a due, and makes the tile disagree with the
    // student's own record. See services/feeLedger.js.
    const stats = await queryOne(`
      SELECT
        (SELECT COALESCE(SUM(final_amount),0) FROM client_fee_assignments WHERE org_id=?${stuPred}) total_assigned,
        (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE org_id=? AND status='completed'${stuPred}) total_collected,
        (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE org_id=? AND status='completed' AND DATE(payment_date)>=?${stuPred}) collected_this_month,
        (SELECT COALESCE(SUM(amount),0) FROM client_fee_payments WHERE org_id=? AND status='completed' AND DATE(payment_date)=?${stuPred}) collected_today,
        (SELECT COUNT(*) FROM client_fee_payments WHERE org_id=? AND status='completed' AND DATE(payment_date)=?${stuPred}) payments_today
    `, [orgId, ...sp(), orgId, ...sp(), orgId, monthStart, ...sp(), orgId, today, ...sp(), orgId, today, ...sp()]);

    // Defaulters + overdue, in one pass over the assignments.
    // `overdue` is only computable now that a fee has a due_date (migration
    // 045) — before it, the office could see WHO owed but never WHO IS LATE,
    // so there was no way to chase the right family first.
    const owing = await query(`
      SELECT fa.student_id,
             SUM(fa.final_amount) AS assigned,
             COALESCE(SUM(${PAID_FOR_ASSIGNMENT('fa')}),0) AS paid,
             MIN(CASE WHEN fa.due_date IS NOT NULL
                       AND fa.final_amount > ${PAID_FOR_ASSIGNMENT('fa')}
                      THEN fa.due_date END) AS earliest_unpaid_due
      FROM client_fee_assignments fa
      WHERE fa.org_id=?${activeSchool ? ' AND fa.student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)' : ''}
        -- A child the school has removed is not a defaulter. Without this the
        -- card read "24 students defaulting" in a school of 21 (WW-93, filed
        -- again as WW-123): four of the twenty-four were archived or pointed at
        -- a student row that no longer exists. An impossible number is not a
        -- rounding error to the office — it is a reason to distrust the page,
        -- and this is the page they chase families from.
        AND ${activeStudent('fa.student_id')}
      GROUP BY fa.student_id
      HAVING assigned > paid
    `, [orgId, ...sp()]);

    const overdueCount = owing.filter(r => r.earliest_unpaid_due && daysOverdue(r.earliest_unpaid_due) > 0).length;

    const totalAssigned = parseFloat(stats.total_assigned) || 0;
    const totalCollected = parseFloat(stats.total_collected) || 0;

    return success(res, {
      total_assigned: totalAssigned,
      total_collected: totalCollected,
      total_due: Math.max(0, totalAssigned - totalCollected),
      collected_this_month: parseFloat(stats.collected_this_month) || 0,
      collected_today: parseFloat(stats.collected_today) || 0,
      payments_today: stats.payments_today || 0,
      defaulter_count: owing.length,
      overdue_count: overdueCount,
      collection_rate: totalAssigned > 0 ? Math.round((totalCollected/totalAssigned)*100) : 0,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ FEE STRUCTURES ═══
router.get('/structures', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // branch scope: class-specific structures follow their class's branch;
    // org-wide (no class) structures stay visible in every branch.
    const activeSchool = await getActiveSchool(req);
    const brPred = activeSchool ? ' AND (fs.class_id IS NULL OR c.school_id=?)' : '';
    const structures = await query(`
      SELECT fs.*, c.name as class_name, ay.name as academic_year_name,
        (SELECT COUNT(*) FROM client_fee_components WHERE structure_id=fs.id) component_count,
        (SELECT COUNT(*) FROM client_fee_assignments WHERE fee_structure_id=fs.id) assigned_count
      FROM client_fee_structures fs
      LEFT JOIN client_classes c ON c.id=fs.class_id
      LEFT JOIN academic_years ay ON ay.id=fs.academic_year_id
      WHERE fs.org_id=? AND COALESCE(fs.status,'active')='active'${brPred}
      ORDER BY fs.created_at DESC`, activeSchool ? [orgId, activeSchool] : [orgId]);
    return success(res, { structures });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/structures/:id', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const structure = await queryOne(`
      SELECT fs.*, c.name as class_name, ay.name as academic_year_name
      FROM client_fee_structures fs
      LEFT JOIN client_classes c ON c.id=fs.class_id
      LEFT JOIN academic_years ay ON ay.id=fs.academic_year_id
      WHERE fs.id=? AND fs.org_id=?`, [id, orgId]);
    if (!structure) return error(res, 'Not found', 404);
    const components = await query(
      'SELECT * FROM client_fee_components WHERE structure_id=? ORDER BY sequence_no, id', [id]);
    return success(res, { structure, components });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/structures', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { name, class_id, amount, frequency='annual', components=[], installments_allowed=0, category } = req.body;
    if (!name) return error(res, 'name and amount required', 400);
    const cat = cleanCategory(category);
    if (cat === false) return error(res, `category must be one of: ${FEE_CATEGORIES.join(', ')}`, 400);
    const amt = parseMoney(amount);
    if (amt === null) return error(res, moneyError('Fee amount'), 400);
    // Component amounts are money too — validate each before it hits DECIMAL(10,2).
    const compAmounts = [];
    for (const comp of components) {
      const c = parseMoney(comp.amount ?? 0, { allowZero: true });
      if (c === null) return error(res, moneyError(`Amount for component "${comp.name || ''}"`, { allowZero: true }), 400);
      compAmounts.push(c);
    }

    // Get current academic year
    const ay = await queryOne('SELECT id FROM academic_years WHERE org_id=? AND is_current=1', [orgId]);

    // Structure + components commit atomically — no half-created structures
    const structureId = await transaction(async (conn) => {
      const [r] = await conn.execute(
        `INSERT INTO client_fee_structures (org_id, name, class_id, amount, frequency, academic_year_id, installments_allowed, status, category)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [orgId, name, class_id||null, amt, frequency, ay?.id||null, installments_allowed, 'active', cat === undefined ? null : cat]);

      for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        await conn.execute(
          'INSERT INTO client_fee_components (org_id, structure_id, name, amount, is_optional, due_date, sequence_no) VALUES (?,?,?,?,?,?,?)',
          [orgId, r.insertId, comp.name, compAmounts[i], comp.is_optional?1:0, comp.due_date||null, i+1]);
      }
      return r.insertId;
    });
    await audit(req, 'FEE_STRUCTURE_CREATE', 'fee_structure', structureId, { new_data: { name, class_id, amount: amt, frequency } });
    return success(res, { id: structureId }, 'Structure created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/structures/:id', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { name, class_id, amount, frequency, installments_allowed, components, category } = req.body;
    const cat = cleanCategory(category);
    if (cat === false) return error(res, `category must be one of: ${FEE_CATEGORIES.join(', ')}`, 400);

    const fs = await queryOne('SELECT * FROM client_fee_structures WHERE id=? AND org_id=?', [id, orgId]);
    if (!fs) return error(res, 'Not found', 404);

    // amount is optional on update, but if supplied it must be valid money.
    let amt = null;
    if (amount !== undefined && amount !== null && amount !== '') {
      amt = parseMoney(amount);
      if (amt === null) return error(res, moneyError('Fee amount'), 400);
    }
    const compAmounts = [];
    if (Array.isArray(components)) {
      for (const comp of components) {
        const c = parseMoney(comp.amount ?? 0, { allowZero: true });
        if (c === null) return error(res, moneyError(`Amount for component "${comp.name || ''}"`, { allowZero: true }), 400);
        compAmounts.push(c);
      }
    }

    // `category` is set only when the caller supplied the key, so an update that
    // does not mention it cannot silently clear it — while sending "" clears it
    // deliberately. COALESCE cannot express that difference.
    const catSet = cat === undefined ? '' : ', category=?';
    const catParam = cat === undefined ? [] : [cat];
    // org_id on the write itself, not only on the SELECT above (§6). The read
    // already proves ownership; the write should not depend on that proof
    // staying two lines away from it.
    await query(
      `UPDATE client_fee_structures SET name=COALESCE(?,name), class_id=?, amount=COALESCE(?,amount), frequency=COALESCE(?,frequency), installments_allowed=COALESCE(?,installments_allowed)${catSet} WHERE id=? AND org_id=?`,
      [name||null, class_id||null, amt, frequency||null, installments_allowed, ...catParam, id, orgId]);

    if (Array.isArray(components)) {
      await query('DELETE FROM client_fee_components WHERE structure_id=? AND org_id=?', [id, orgId]);
      for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        await query(
          'INSERT INTO client_fee_components (org_id, structure_id, name, amount, is_optional, due_date, sequence_no) VALUES (?,?,?,?,?,?,?)',
          [orgId, id, comp.name, compAmounts[i], comp.is_optional?1:0, comp.due_date||null, i+1]);
      }
    }
    await audit(req, 'FEE_STRUCTURE_UPDATE', 'fee_structure', id, { new_data: { name, class_id, amount: amt, frequency }, old_data: { name: fs.name, amount: fs.amount } });
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * WHAT WOULD DELETING THIS STRUCTURE ACTUALLY DO?
 *
 * The confirm dialog used to say "This fee structure will be permanently
 * deleted. This cannot be undone." It was wrong on both counts whenever the
 * structure was in use: the route ARCHIVED it and left every assignment on
 * every student billing exactly as before. A school could delete a fee, watch
 * it disappear from Structures, and still see it charged on the Assigned Fees
 * tab — which is what was reported.
 *
 * So the screen asks first, and the answer names people rather than counting
 * them: which students are affected, and how much of it is money already taken.
 */
router.get('/structures/:id/impact', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const fs = await queryOne('SELECT id, name FROM client_fee_structures WHERE id=? AND org_id=?', [id, orgId]);
    if (!fs) return error(res, 'Not found', 404);

    // org_id on the assignment side too — §6 says every tenant query is scoped,
    // and this one was reading across the whole table on a bare structure id.
    const rows = await query(
      `SELECT fa.id, fa.student_id, fa.final_amount,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
              COALESCE(p.paid, 0) AS paid
         FROM client_fee_assignments fa
         JOIN client_students cs ON cs.id = fa.student_id
         JOIN client_users u ON u.id = cs.user_id
         LEFT JOIN (SELECT fee_assignment_id, SUM(amount) AS paid
                      FROM client_fee_payments
                     WHERE org_id=? AND status='completed'
                     GROUP BY fee_assignment_id) p ON p.fee_assignment_id = fa.id
        WHERE fa.fee_structure_id=? AND fa.org_id=?
        ORDER BY u.first_name`,
      [orgId, id, orgId]);

    const paid = rows.filter(r => Number(r.paid) > 0);
    return success(res, {
      structure: fs.name,
      assigned: rows.length,
      unpaid_count: rows.length - paid.length,
      paid_count: paid.length,
      paid_total: paid.reduce((n, r) => n + Number(r.paid || 0), 0),
      // Named, capped — a dialog listing four hundred children helps nobody.
      students: rows.slice(0, 8).map(r => r.student_name.trim()).filter(Boolean),
      paid_students: paid.slice(0, 8).map(r => r.student_name.trim()).filter(Boolean),
    });
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/structures/:id', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const fs = await queryOne('SELECT id, name FROM client_fee_structures WHERE id=? AND org_id=?', [id, orgId]);
    if (!fs) return error(res, 'Not found', 404);

    /*
     * MONEY ALREADY TAKEN IS NEVER DELETED. An assignment with a completed
     * receipt against it has been counted in a closed day's collection and a
     * family holds the paper — removing it would orphan the payment and change
     * books that were already signed off. The same rule the single-assignment
     * delete enforces (see /assignments/:id), applied to the whole structure.
     *
     * So the cascade is deliberately PARTIAL, and the response says so:
     *   · unpaid assignments  → deleted with the structure
     *   · paid assignments    → kept, and the structure is archived instead
     * Silence here is what produced the original complaint: the structure went
     * away and the charges stayed, with nothing on screen to explain it.
     */
    const rows = await query(
      `SELECT fa.id, COALESCE(p.paid,0) AS paid
         FROM client_fee_assignments fa
         LEFT JOIN (SELECT fee_assignment_id, SUM(amount) AS paid
                      FROM client_fee_payments
                     WHERE org_id=? AND status='completed'
                     GROUP BY fee_assignment_id) p ON p.fee_assignment_id = fa.id
        WHERE fa.fee_structure_id=? AND fa.org_id=?`,
      [orgId, id, orgId]);

    const unpaid = rows.filter(r => Number(r.paid) === 0).map(r => r.id);
    const paidCount = rows.length - unpaid.length;

    if (unpaid.length) {
      await query(
        `DELETE FROM client_fee_assignments WHERE org_id=? AND id IN (${unpaid.map(() => '?').join(',')})`,
        [orgId, ...unpaid]);
    }

    if (paidCount > 0) {
      await query('UPDATE client_fee_structures SET status=? WHERE id=? AND org_id=?', ['archived', id, orgId]);
      await audit(req, 'FEE_STRUCTURE_DELETE', 'fee_structure', id, {
        new_data: { status: 'archived', unassigned: unpaid.length, kept_paid: paidCount },
      });
      return success(res, { removed: unpaid.length, kept_paid: paidCount, archived: true },
        `Removed from ${unpaid.length} student${unpaid.length === 1 ? '' : 's'}. ${paidCount} kept — money has already been collected against ${paidCount === 1 ? 'it' : 'them'}, so the fee is archived rather than deleted.`);
    }

    await query('DELETE FROM client_fee_components WHERE structure_id=? AND org_id=?', [id, orgId]);
    await query('DELETE FROM client_fee_structures WHERE id=? AND org_id=?', [id, orgId]);
    await audit(req, 'FEE_STRUCTURE_DELETE', 'fee_structure', id, {
      new_data: { status: 'deleted', unassigned: unpaid.length },
    });
    return success(res, { removed: unpaid.length, kept_paid: 0, archived: false },
      unpaid.length
        ? `Deleted, and removed from ${unpaid.length} student${unpaid.length === 1 ? '' : 's'}`
        : 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});


/*
 * ── THE CURRENT ENROLMENT, WITHOUT MULTIPLYING ROWS ─────────────────────────
 *
 * Every fee screen wants the same two facts about a child: which class and
 * which section. Six of them reached for them the same way —
 *
 *     LEFT JOIN client_enrollments e ON e.student_id = s.id AND e.status='active'
 *
 * — and that is a fan-out waiting to happen. A student carrying TWO active
 * enrolment rows makes the join emit two rows for one child, so every fee, every
 * payment and every outstanding amount attached to them is counted TWICE.
 *
 * It was not theoretical. On staging, one child with two active enrolments made
 *   · Assigned Fees list one fee as two
 *   · the Defaulters report claim ₹23,990 outstanding where ₹11,995 was owed
 *   · the Collection Report head "1 payments" over a table of 2
 *   · and /reminders/send address that family twice
 * while the dashboard tile — which never joined enrolments — quietly told the
 * truth the whole time.
 *
 * So the join is defined ONCE, here, and picks a single enrolment per student
 * (the most recent active one). Deliberately not DISTINCT, which hides a fan-out
 * in the rows while leaving it in the COUNT; and not GROUP BY, which
 * ONLY_FULL_GROUP_BY refuses on MariaDB for the columns these SELECTs need.
 *
 * Whether a child should HAVE two active enrolments is a different question,
 * and a real one — but a reporting screen must not double a school's money
 * while somebody answers it.
 */
const CURRENT_ENROLMENT_JOIN = `
      LEFT JOIN (SELECT e1.student_id, MAX(e1.id) AS enrolment_id
                   FROM client_enrollments e1
                  WHERE e1.status='active'
                  GROUP BY e1.student_id) cur ON cur.student_id = s.id
      LEFT JOIN client_enrollments e ON e.id = cur.enrolment_id`;

/*
 * The kinds of fee a school actually charges. Data, not schema (migration 063):
 * a school that wants "hostel" gets it by adding a string here, not by altering
 * a column. Anything unrecognised is refused by name rather than written blind.
 */
const FEE_CATEGORIES = ['tuition', 'admission', 'exam', 'transport', 'event', 'activity', 'other'];
const cleanCategory = (v) => {
  if (v === undefined) return undefined;              // not supplied — leave as is
  if (v === null || v === '') return null;            // deliberately cleared
  const c = String(v).trim().toLowerCase();
  return FEE_CATEGORIES.includes(c) ? c : false;      // false = invalid
};

// ═══ ASSIGNMENTS — putting a fee structure onto a student ══════════════════
//
// This is the ONE production write into client_fee_assignments (every other
// INSERT in the repo is a seed script), and it is the hinge the whole module
// turns on. Nothing downstream exists without a row here: /collect refuses with
// "this student has no outstanding fees", the dashboard totals are all ₹0, the
// defaulter report is empty, and the parent portal reads "No fee structures
// assigned yet". A school that has built its structures and enrolled its
// students is stuck at exactly this step until this route is called — which is
// how JD PUBLIC SCHOOL reported it.
//
// A discount may be applied at assignment time. `final_amount` is what the
// student actually owes; discount_percent/discount_amount record WHY it differs
// from the structure's list amount, and the parent portal already reads them.

/** Resolve the money a student owes from a structure's amount + an optional
 *  concession. One helper so assign and edit can never disagree about it. */
function resolveFinalAmount(base, { discount_percent, discount_amount }) {
  const amount = Number(base);
  const hasPct = discount_percent !== undefined && discount_percent !== null && discount_percent !== '';
  const hasAmt = discount_amount !== undefined && discount_amount !== null && discount_amount !== '';
  if (hasPct && hasAmt) return { err: 'Give a discount percentage OR a discount amount, not both' };

  let pct = 0, off = 0;
  if (hasPct) {
    pct = Number(discount_percent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return { err: 'Discount must be between 0% and 100%' };
    off = Math.round(amount * pct) / 100;
  } else if (hasAmt) {
    const d = parseMoney(discount_amount, { allowZero: true });
    if (d === null) return { err: moneyError('Discount amount', { allowZero: true }) };
    if (d > amount) return { err: `Discount ₹${d.toFixed(2)} is more than the fee of ₹${amount.toFixed(2)}` };
    off = d;
    pct = amount > 0 ? Math.round((off / amount) * 10000) / 100 : 0;
  }
  return { discount_percent: pct, discount_amount: off, final_amount: Math.round((amount - off) * 100) / 100 };
}

const MAX_ASSIGN_AT_ONCE = 2000;

router.post('/structures/:id/assign', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const {
      student_ids = [], section_id, class_id, discount_percent, discount_amount,
      start_date, installments, schedule: customSchedule,
    } = req.body;

    const fs = await queryOne('SELECT * FROM client_fee_structures WHERE id=? AND org_id=?', [id, orgId]);
    if (!fs) return error(res, 'Fee structure not found', 404);
    if ((fs.status || 'active') !== 'active') {
      return error(res, 'This fee structure is archived. Restore it before assigning it to students.', 400);
    }

    // ── HOW MUCH IS THE BILL ─────────────────────────────────────────────
    // Resolved BEFORE the concession, because for a monthly or quarterly fee
    // the bill depends on how many periods the plan covers: "₹700 monthly" is
    // ₹700 EACH month, so twelve instalments is ₹8,400, not ₹700 sliced twelve
    // ways. billableTotal() is the one place that decides — see feeLedger.js
    // for the production case (JD PUBLIC SCHOOL) that exposed it.
    const parts = installments === undefined || installments === null || installments === ''
      ? (PARTS_FOR_FREQUENCY[String(fs.frequency || 'annual').toLowerCase()] || 1)
      : Number(installments);
    if (!Number.isInteger(parts) || parts < 1 || parts > 24) {
      return error(res, 'Number of instalments must be a whole number between 1 and 24', 400);
    }
    // A school that hand-edits the plan sends its own rows; the bill is then
    // however many periods those rows cover, so the count comes from them.
    const planParts = Array.isArray(customSchedule) && customSchedule.length
      ? customSchedule.length : parts;
    const listTotal = billableTotal({ frequency: fs.frequency, amount: fs.amount, parts: planParts });

    const money = resolveFinalAmount(listTotal, { discount_percent, discount_amount });
    if (money.err) return error(res, money.err, 400);

    // ── WHEN is it due (KI-101) ──────────────────────────────────────────
    // A fee had no date of any kind. So "upcoming" was uncomputable, a
    // defaulter could not be aged, every reminder feature was blocked, and a
    // "monthly" ₹1,500 fee was a single ₹1,500 charge rather than twelve.
    //
    // The school picks when the first instalment falls due; it defaults to the
    // current academic year's start, which is what a school actually means by
    // "the April fee" — and only falls back to today when the year is unset.
    let startDate = String(start_date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      const ay = await queryOne(
        'SELECT start_date FROM academic_years WHERE org_id=? AND is_current=1', [orgId]).catch(() => null);
      const ayStart = ay?.start_date ? new Date(ay.start_date).toISOString().slice(0, 10) : null;
      // An academic year that started in the past is still the right anchor —
      // a fee assigned in August is the year's fee, and its April instalment
      // is legitimately already overdue. That is the truth, not a bug.
      startDate = ayStart || new Date().toISOString().slice(0, 10);
    }

    // A school that edited the plan sends it back verbatim — uneven amounts,
    // its own dates, its own labels ("Term 1", "Admission + April"). Almost no
    // Indian school bills in equal parts, so the generated split is a starting
    // point, not the answer. validateSchedule keeps the one rule that matters:
    // the plan must add up to the bill, or the register and the parent's portal
    // would quote different totals for the same fee.
    let schedule;
    if (Array.isArray(customSchedule) && customSchedule.length) {
      const v = validateSchedule(customSchedule, money.final_amount);
      if (v.err) return error(res, v.err, 400);
      schedule = v.rows;
    } else {
      schedule = buildSchedule({
        frequency: fs.frequency, totalAmount: money.final_amount, startDate, parts,
      });
    }
    // The assignment's own due_date is the LAST instalment, so "is this student
    // overdue at all" stays a single-column question for every report that does
    // not care about the breakdown.
    const assignmentDue = schedule[schedule.length - 1].due_date;

    // Branch scope: a fee is assigned to students of the branch the user is
    // looking at, never silently across every branch of the organization.
    const activeSchool = await getActiveSchool(req);
    const brPred = activeSchool ? ' AND s.school_id=?' : '';
    const brParam = activeSchool ? [activeSchool] : [];

    // TENANT GUARD: ids in the request body are never trusted. Every candidate
    // is re-read out of client_students scoped by org (and branch), so a finance
    // user cannot assign this school's fee to another school's student — which
    // would then surface that student in this org's dues and defaulter reports.
    let targets;
    if (student_ids.length) {
      const ids = [...new Set(student_ids.map(Number).filter(n => Number.isInteger(n) && n > 0))];
      if (!ids.length) return error(res, 'No valid students selected', 400);
      if (ids.length > MAX_ASSIGN_AT_ONCE) {
        return error(res, `Assign at most ${MAX_ASSIGN_AT_ONCE} students at a time`, 400);
      }
      const rows = await query(
        `SELECT s.id FROM client_students s
         WHERE s.org_id=? AND s.id IN (${ids.map(() => '?').join(',')})${brPred}`,
        [orgId, ...ids, ...brParam]);
      targets = rows.map(r => r.id);
      if (!targets.length) return error(res, 'None of the selected students belong to this school', 404);
    } else if (section_id) {
      const rows = await query(
        `SELECT s.id FROM client_students s
         JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
         WHERE s.org_id=? AND e.section_id=?${brPred}`, [orgId, section_id, ...brParam]);
      targets = rows.map(r => r.id);
    } else if (class_id) {
      const rows = await query(
        `SELECT s.id FROM client_students s
         JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
         JOIN client_sections sec ON sec.id=e.section_id
         WHERE s.org_id=? AND sec.class_id=?${brPred}`, [orgId, class_id, ...brParam]);
      targets = rows.map(r => r.id);
    } else {
      return error(res, 'Choose a class, a section, or at least one student to assign this fee to', 400);
    }

    if (!targets.length) {
      return error(res, 'No enrolled students found for that selection. Check that the class or section has students on its roll.', 400);
    }

    // Assigning the same structure twice would double what the family owes, so
    // an already-assigned student is SKIPPED, not duplicated — and the count is
    // reported back rather than swallowed, because "12 assigned, 30 already had
    // it" is the answer the office needs to trust the screen.
    const existing = await query(
      'SELECT student_id FROM client_fee_assignments WHERE org_id=? AND fee_structure_id=?', [orgId, id]);
    const already = new Set(existing.map(r => Number(r.student_id)));
    const toAssign = targets.filter(sid => !already.has(Number(sid)));
    const skipped = targets.length - toAssign.length;

    // One multi-row INSERT inside a transaction, not one round trip per student:
    // a 400-student class was 800 sequential queries, and a failure halfway
    // through left half a class assigned with no way to tell which half.
    //
    // The SCHEDULE is written in the SAME transaction. An assignment whose
    // due_date disagrees with its own instalments is worse than one with no
    // schedule at all — the register and the parent's screen would quote
    // different dates for the same fee.
    if (toAssign.length) {
      await transaction(async (conn) => {
        const exec = (sql, p) => conn.execute(sql, p);
        const CHUNK = 500;
        for (let i = 0; i < toAssign.length; i += CHUNK) {
          const slice = toAssign.slice(i, i + CHUNK);
          const [r] = await conn.execute(
            `INSERT INTO client_fee_assignments
               (org_id, student_id, fee_structure_id, discount_percent, discount_amount, final_amount, assigned_date, due_date, status)
             VALUES ${slice.map(() => '(?,?,?,?,?,?,CURDATE(),?,?)').join(',')}`,
            slice.flatMap(sid => [
              orgId, sid, id, money.discount_percent, money.discount_amount, money.final_amount,
              assignmentDue, 'pending',
            ]));
          // A multi-row INSERT reports the id of the FIRST row; InnoDB with the
          // default innodb_autoinc_lock_mode allocates the block contiguously,
          // so first+n identifies each row. Deriving them beats re-SELECTing by
          // student_id, which would race a concurrent assignment of the same
          // structure to an overlapping set of students.
          for (let k = 0; k < slice.length; k++) {
            await writeSchedule(exec, orgId, r.insertId + k, schedule);
          }
        }
      });
    }

    await audit(req, 'FEE_ASSIGN', 'fee_structure', id, {
      new_data: {
        structure: fs.name, assigned: toAssign.length, skipped,
        final_amount: money.final_amount, discount_amount: money.discount_amount,
        instalments: schedule.length, first_due: schedule[0].due_date, due_date: assignmentDue,
        student_ids: toAssign,
      },
    });

    const plan = schedule.length > 1
      ? ` · ${schedule.length} instalments from ${schedule[0].due_date}`
      : ` · due ${assignmentDue}`;
    const msg = toAssign.length === 0
      ? `All ${targets.length} selected students already have "${fs.name}"`
      : `"${fs.name}" assigned to ${toAssign.length} student${toAssign.length === 1 ? '' : 's'}`
        + (skipped ? ` · ${skipped} already had it` : '') + plan;
    return success(res, {
      assigned: toAssign.length, skipped,
      final_amount: money.final_amount,
      installments: schedule.length, first_due: schedule[0].due_date, due_date: assignmentDue,
      schedule,
    }, msg);
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ Editing and removing an assignment ═══════════════════════════════════
// Assigning by class is one click, so assigning the WRONG class is one click
// too. Without these two routes a mistake was permanent: there was no way to
// take a fee off a student, and no way to grant a concession after the fact.

router.put('/assignments/:id', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { discount_percent, discount_amount, status, schedule: customSchedule } = req.body;

    const fa = await queryOne(
      `SELECT fa.*, fs.name AS structure_name, fs.amount AS list_amount, fs.frequency
       FROM client_fee_assignments fa
       JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
       WHERE fa.id=? AND fa.org_id=?`, [id, orgId]);
    if (!fa) return error(res, 'Fee assignment not found', 404);

    // The plan as it stands. Read BEFORE the bill is resolved, because for a
    // monthly or quarterly fee the bill depends on how many periods the plan
    // covers.
    const existing = await query(
      'SELECT seq, label, due_date FROM client_fee_installments WHERE fee_assignment_id=? AND org_id=? ORDER BY seq', [id, orgId]);

    /*
     * THE BUG THIS LINE FIXES. This used to be
     *
     *     resolveFinalAmount(fa.list_amount, …)
     *
     * — the raw structure amount, straight past billableTotal(). For an annual
     * fee those are the same number, so it looked correct. For a MONTHLY or
     * QUARTERLY fee they are not: ₹1,500 monthly is a ₹18,000 bill, and this
     * reduced it to ₹1,500 the moment anybody edited the assignment. Moving one
     * due date because a family asked would have written off eleven months.
     *
     * It also refused the school's own plan: a three-term schedule adding up to
     * ₹24,000 was rejected as "over by ₹16,000" against a bill of ₹8,000.
     *
     * billableTotal()'s own header says the number must be identical in three
     * places — the assign API, the modal's preview, and anything that later
     * re-derives a bill. This is the third place, and it was the one that did
     * not ask.
     *
     * Parts come from the plan being written, or the plan already there, in
     * that order — the same rule POST /assign uses.
     */
    const planParts = Array.isArray(customSchedule) && customSchedule.length
      ? customSchedule.length
      : (existing.length || PARTS_FOR_FREQUENCY[String(fa.frequency || 'annual').toLowerCase()] || 1);
    const listTotal = billableTotal({ frequency: fa.frequency, amount: fa.list_amount, parts: planParts });

    const money = resolveFinalAmount(listTotal, { discount_percent, discount_amount });
    if (money.err) return error(res, money.err, 400);

    // A concession may not drop the bill below what the family has ALREADY paid
    // — that would silently create a credit balance, and WisWits has no
    // advance/credit concept (the same reason /collect refuses overpayment).
    const paidRow = await queryOne(
      `SELECT COALESCE(SUM(amount),0) AS paid FROM client_fee_payments WHERE fee_assignment_id=? AND status='completed'`, [id]);
    const paid = Number(paidRow.paid);
    if (money.final_amount < paid) {
      return error(res, `₹${paid.toFixed(2)} has already been collected against this fee, so it cannot be reduced to ₹${money.final_amount.toFixed(2)}. Refund the difference instead.`, 400);
    }

    const ALLOWED_STATUS = ['pending', 'partial', 'paid', 'overdue', 'waived'];
    if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
      return error(res, `Status must be one of: ${ALLOWED_STATUS.join(', ')}`, 400);
    }

    await query(
      `UPDATE client_fee_assignments
       SET discount_percent=?, discount_amount=?, final_amount=?, status=COALESCE(?,status)
       WHERE id=? AND org_id=?`,
      [money.discount_percent, money.discount_amount, money.final_amount, status ?? null, id, orgId]);

    // ── The plan ────────────────────────────────────────────────────────────
    // Two ways it changes, and they must not fight each other:
    //
    //  1. The school EDITED it — moved a due date because a family asked, or
    //     put the annual charges on Term 1. Taken verbatim, validated only for
    //     the one rule that matters (it must add up to the bill).
    //  2. A CONCESSION changed the total. The plan then still quotes the old
    //     bill, so it is rebuilt — but on the SAME dates, because a discount is
    //     no reason for a school's billing months to move.
    if (Array.isArray(customSchedule) && customSchedule.length) {
      const v = validateSchedule(customSchedule, money.final_amount);
      if (v.err) return error(res, v.err, 400);
      await writeSchedule((sql, p) => query(sql, p), orgId, id, v.rows);
      // The assignment is due by its LAST instalment — keep the two in step or
      // every overdue report reads a date the plan no longer contains.
      await query('UPDATE client_fee_assignments SET due_date=? WHERE id=? AND org_id=?',
        [v.rows[v.rows.length - 1].due_date, id, orgId]);
    } else if (existing.length) {
      const rebuilt = buildSchedule({
        frequency: fa.frequency || 'annual',
        totalAmount: money.final_amount,
        startDate: String(existing[0].due_date).slice(0, 10),
        parts: existing.length,
      });
      // keep the school's own dates and labels verbatim; only amounts change
      existing.forEach((e, i) => {
        if (!rebuilt[i]) return;
        rebuilt[i].due_date = String(e.due_date).slice(0, 10);
        if (e.label) rebuilt[i].label = e.label;
      });
      await writeSchedule((sql, p) => query(sql, p), orgId, id, rebuilt);
    }

    // A concession can settle an account outright ("owed 10,000, paid 6,000,
    // waive 4,000"). Without this the row stays 'partial' forever and the
    // family keeps appearing on the defaulter list the school just cleared.
    if (status === undefined) await recomputeAssignmentStatus(orgId, id);

    await audit(req, 'FEE_ASSIGNMENT_UPDATE', 'fee_assignment', id, {
      old_data: { final_amount: fa.final_amount, discount_amount: fa.discount_amount, status: fa.status },
      new_data: { final_amount: money.final_amount, discount_amount: money.discount_amount, status: status ?? fa.status },
    });
    return success(res, { final_amount: money.final_amount }, 'Fee updated');
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/assignments/:id', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;

    const fa = await queryOne(
      `SELECT fa.*, fs.name AS structure_name
       FROM client_fee_assignments fa
       LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
       WHERE fa.id=? AND fa.org_id=?`, [id, orgId]);
    if (!fa) return error(res, 'Fee assignment not found', 404);

    // Money already on the books is never deleted. A receipt has been handed to
    // a family and counted in the day's collection; removing the fee it was paid
    // against would orphan the payment and change a closed day's totals.
    const paidRow = await queryOne(
      `SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS total FROM client_fee_payments WHERE fee_assignment_id=? AND status='completed'`, [id]);
    if (Number(paidRow.cnt) > 0) {
      return error(res, `Cannot remove this fee — ₹${Number(paidRow.total).toFixed(2)} has already been collected against it on ${paidRow.cnt} receipt${Number(paidRow.cnt) === 1 ? '' : 's'}. Reduce the amount with a concession instead, or refund the payment first.`, 409);
    }

    await query('DELETE FROM client_fee_assignments WHERE id=? AND org_id=?', [id, orgId]);
    await audit(req, 'FEE_UNASSIGN', 'fee_assignment', id, {
      old_data: { student_id: fa.student_id, structure: fa.structure_name, final_amount: fa.final_amount },
    });
    return success(res, {}, `"${fa.structure_name || 'Fee'}" removed from this student`);
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ Reversing a receipt ══════════════════════════════════════════════════
//
// Until now a desk-collected payment could NEVER be corrected. There was no
// route that touched `client_fee_payments` after the INSERT — so a clerk who
// typed 50000 instead of 5000 had no way back, ever, and the only workaround
// was to leave a school's books permanently wrong.
//
// A reversal is NOT a delete. The receipt number was written in a book and
// handed to a family; deleting the row would leave a hole in the sequence and
// silently change a day's closed total with no trace of who did it. The row
// stays, marked, with a reason, an actor and a timestamp — and every money
// query in the product now ignores non-`completed` payments (feeLedger.js), so
// marking it is enough to make the books right everywhere at once.
//
// `cancelled` and `refunded` are deliberately different: a data-entry void
// never involved money, a refund means cash went back out of the drawer. A day
// book that merges them cannot be reconciled.
router.post('/payments/:id/reverse', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { reason, kind = 'cancelled' } = req.body;

    if (!['cancelled', 'refunded'].includes(kind)) {
      return error(res, 'A reversal is either "cancelled" (entered by mistake) or "refunded" (money returned)', 400);
    }
    const why = String(reason || '').trim();
    if (why.length < 3) {
      return error(res, 'Give a reason — an unexplained reversal is a hole in the day book', 400);
    }

    const p = await queryOne(
      `SELECT fp.*, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name
         FROM client_fee_payments fp
         LEFT JOIN client_students s ON s.id=fp.student_id
         LEFT JOIN client_users u ON u.id=s.user_id
        WHERE fp.id=? AND fp.org_id=?`, [id, orgId]);
    if (!p) return error(res, 'Payment not found', 404);
    if (p.status !== 'completed') {
      return error(res, `This receipt was already ${p.status}${p.reversal_reason ? ` — ${p.reversal_reason}` : ''}`, 409);
    }

    await query(
      `UPDATE client_fee_payments
          SET status=?, reversal_reason=?, reversed_at=NOW(), reversed_by=?
        WHERE id=? AND org_id=? AND status='completed'`,
      [kind, why.slice(0, 255), req.user.user_id, id, orgId]);

    // The student's dues have just moved. Recompute every one of their
    // assignments, not only the named one: a payment collected without naming
    // an assignment was auto-allocated to the oldest unpaid, and reversing it
    // can change which of them is now outstanding.
    await recomputeStudentStatuses(orgId, p.student_id);

    // The family was told "payment received" when this was collected. Being
    // told it was reversed is the other half of that promise — a parent who
    // finds the amount silently gone from their portal rings the office.
    try {
      await notifSvc.sendToParentsOfStudent(orgId, p.student_id, {
        type: 'fee_payment',
        title: kind === 'refunded'
          ? `Refund processed: ₹${Number(p.amount).toLocaleString('en-IN')}`
          : `Receipt cancelled: ₹${Number(p.amount).toLocaleString('en-IN')}`,
        body: `Receipt ${p.receipt_number || `#${p.id}`} — ${why}. Please contact the school office with any question.`,
        icon: 'IndianRupee',
        priority: 'high',
        sender_id: req.user.user_id,
        sender_role: 'admin',
      });
    } catch (e) { console.error('reversal notif failed:', e.message); }

    await audit(req, 'FEE_PAYMENT_REVERSE', 'fee_payment', id, {
      old_data: { status: 'completed', amount: p.amount, receipt_number: p.receipt_number },
      new_data: { status: kind, reason: why, student_id: p.student_id },
    });

    return success(res, { id: Number(id), status: kind },
      kind === 'refunded'
        ? `₹${Number(p.amount).toLocaleString('en-IN')} marked refunded — it no longer counts as collected`
        : `Receipt ${p.receipt_number || `#${p.id}`} cancelled — it no longer counts as collected`);
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ COLLECTIONS / PAYMENTS ═══
router.get('/student/:studentId', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { studentId } = req.params;
    if (!(await canViewStudentFees(req.user, studentId, orgId))) return error(res, 'Forbidden', 403);

    const student = await queryOne(`
      SELECT s.id, u.first_name, u.last_name, u.email, u.phone, s.admission_number,
        c.name class_name, sec.name section_name
      FROM client_students s
      JOIN client_users u ON u.id=s.user_id
      ${CURRENT_ENROLMENT_JOIN}
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      WHERE s.id=? AND s.org_id=?`, [studentId, orgId]);
    if (!student) return error(res, 'Student not found', 404);

    const assignments = await query(`
      SELECT fa.*, fs.name as structure_name, fs.frequency,
        COALESCE((SELECT SUM(amount) FROM client_fee_payments WHERE fee_assignment_id=fa.id AND status='completed'),0) as paid_amount,
        (fa.final_amount - COALESCE((SELECT SUM(amount) FROM client_fee_payments WHERE fee_assignment_id=fa.id AND status='completed'),0)) as pending_amount
      FROM client_fee_assignments fa
      JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
      WHERE fa.student_id=? AND fa.org_id=? ORDER BY fa.assigned_date DESC`, [studentId, orgId]);

    const payments = await query(`
      SELECT fp.*, fs.name as structure_name, 
        CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) as collector_name
      FROM client_fee_payments fp
      LEFT JOIN client_fee_assignments fa ON fa.id=fp.fee_assignment_id
      LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
      LEFT JOIN client_users u ON u.id=fp.collected_by
      WHERE fp.student_id=? AND fp.org_id=?
      ORDER BY fp.payment_date DESC, fp.id DESC`, [studentId, orgId]);

    const discounts = await query(
      'SELECT * FROM client_fee_discounts WHERE student_id=? AND org_id=? AND status=?',
      [studentId, orgId, 'active']);

    // The SCHEDULE — what is due, and when. Attached to its assignment, with
    // the student's payments spread across it oldest-first, which is how a
    // school actually applies money: ₹3,000 against a ₹1,500/month plan has
    // cleared April and May, not "20% of every month".
    const installments = assignments.length ? await query(
      `SELECT * FROM client_fee_installments
        WHERE org_id=? AND fee_assignment_id IN (${assignments.map(() => '?').join(',')})
        ORDER BY fee_assignment_id, seq`,
      [orgId, ...assignments.map(a => a.id)]) : [];

    const byAssignment = new Map();
    for (const i of installments) {
      if (!byAssignment.has(i.fee_assignment_id)) byAssignment.set(i.fee_assignment_id, []);
      byAssignment.get(i.fee_assignment_id).push(i);
    }
    for (const a of assignments) {
      const plan = byAssignment.get(a.id) || [];
      a.installments = allocate(plan, a.paid_amount);
      a.next_due = a.installments.find(i => i.status !== 'paid') || null;
      a.days_overdue = daysOverdue(a.next_due?.due_date || (Number(a.pending_amount) > 0 ? a.due_date : null));
    }

    const total_assigned = assignments.reduce((s, a) => s + parseFloat(a.final_amount||0), 0);
    // Sum ONLY completed payments. The per-fee `paid_amount` above already
    // excludes reversed ones, so summing the raw list here made the summary
    // tile contradict the very rows printed beneath it the moment a receipt
    // was cancelled — the student's own screen disagreeing with itself.
    const total_paid = payments
      .filter(p => (p.status || 'completed') === 'completed')
      .reduce((s, p) => s + parseFloat(p.amount||0), 0);
    const total_pending = total_assigned - total_paid;

    return success(res, {
      student, assignments, payments, discounts,
      summary: {
        total_assigned, total_paid, total_pending,
        // The single most useful number to an office on the phone to a parent.
        overdue_amount: assignments
          .filter(a => a.days_overdue > 0)
          .reduce((s, a) => s + Math.max(0, parseFloat(a.pending_amount) || 0), 0),
        next_due_date: assignments
          .map(a => a.next_due?.due_date).filter(Boolean).sort()[0] || null,
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/collect', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const collectorId = req.user.user_id;
    const { 
      student_id, fee_assignment_id, amount, 
      payment_mode='cash', transaction_id, notes 
    } = req.body;

    if (!student_id) return error(res, 'Student is required', 400);

    // MONEY GUARD (server-side is the real guard — the UI check is bypassable).
    // Rejects NaN / non-numeric / negative / zero / Infinity / absurd values
    // before anything reaches the DECIMAL(10,2) columns.
    const amt = parseMoney(amount);
    if (amt === null) return error(res, moneyError('Payment amount'), 400);

    // MODE GUARD — same class of bug as the payment amount, and it was WORSE:
    // client_fee_payments.payment_mode is an ENUM that did not contain 'upi' or
    // 'card', yet the Collect Fee UI offers both. Under STRICT_TRANS_TABLES the
    // INSERT died with error 1265 "Data truncated", masked by response.js into a
    // generic 500 — so collecting a fee by UPI or Card failed outright while Cash
    // worked, which is why it went unnoticed. Migration 018 widens the ENUM;
    // this validates the value so an unknown mode is a clean 400, never a 500.
    // Keep in sync with 018_widen_payment_mode_enum.js and CollectionPanel MODES.
    if (!PAYMENT_MODES.includes(payment_mode)) {
      return error(res, `Payment mode must be one of: ${PAYMENT_MODES.join(', ')}`, 400);
    }

    // TENANT GUARD: the student MUST belong to the caller's org. Without this a
    // finance user could post a payment against a foreign student_id, corrupting
    // books and leaking that student into this org's reports via the id joins.
    const stuOwn = await queryOne('SELECT id FROM client_students WHERE id=? AND org_id=?', [student_id, orgId]);
    if (!stuOwn) return error(res, 'Student not found', 404);

    // Use assignment_id if provided, else pick oldest pending
    let assignmentId = fee_assignment_id;
    if (assignmentId) {
      // a supplied assignment id must belong to this org AND this student
      const own = await queryOne('SELECT id FROM client_fee_assignments WHERE id=? AND org_id=? AND student_id=?', [assignmentId, orgId, student_id]);
      if (!own) return error(res, 'Fee assignment not found for this student', 404);
    } else {
      const oldest = await queryOne(`
        SELECT fa.id FROM client_fee_assignments fa
        WHERE fa.student_id=? AND fa.org_id=?
          AND fa.final_amount > COALESCE((SELECT SUM(amount) FROM client_fee_payments WHERE fee_assignment_id=fa.id AND status='completed'),0)
        ORDER BY fa.assigned_date ASC LIMIT 1`, [student_id, orgId]);
      assignmentId = oldest?.id;
    }

    const receipt_number = await generateReceiptNumber(orgId);

    // RACE GUARD: two clerks collecting against the same assignment at once
    // could both pass an unlocked balance check and double-insert a payment
    // past the outstanding amount. Lock the assignment row for the duration
    // of the balance check + insert so the second request re-reads the
    // post-commit balance instead of a stale one.
    // OVERPAYMENT GUARD: WisWits has no advance/credit-balance concept (no such
    // column or code path exists), so a payment may never exceed what is owed.
    // The cap is enforced against the specific assignment when we have one, and
    // against the student's whole outstanding balance when we do not — the
    // no-assignment branch used to skip the check entirely and accept any amount.
    const r = await transaction(async (conn) => {
      let outstanding;
      let scope;
      if (assignmentId) {
        const [[fa]] = await conn.execute(
          'SELECT final_amount FROM client_fee_assignments WHERE id=? AND org_id=? FOR UPDATE',
          [assignmentId, orgId]);
        if (!fa) throw Object.assign(new Error('Fee assignment not found for this student'), { status: 404 });
        const [[paidRow]] = await conn.execute(
          `SELECT COALESCE(SUM(amount),0) AS paid FROM client_fee_payments WHERE fee_assignment_id=? AND status='completed'`,
          [assignmentId]);
        outstanding = Number(fa.final_amount) - Number(paidRow.paid);
        scope = 'this fee';
      } else {
        // Lock every assignment of the student so a concurrent collection cannot
        // slip past a stale student-level balance.
        const [assigned] = await conn.execute(
          'SELECT COALESCE(SUM(final_amount),0) AS total FROM client_fee_assignments WHERE student_id=? AND org_id=? FOR UPDATE',
          [student_id, orgId]);
        const [[paidRow]] = await conn.execute(
          `SELECT COALESCE(SUM(amount),0) AS paid FROM client_fee_payments WHERE student_id=? AND org_id=? AND status='completed'`,
          [student_id, orgId]);
        outstanding = Number(assigned[0].total) - Number(paidRow.paid);
        scope = 'this student';
      }

      if (outstanding <= 0) {
        throw Object.assign(
          new Error(assignmentId ? 'This fee is already fully paid' : 'This student has no outstanding fees'),
          { status: 400 });
      }
      if (amt > outstanding + 0.01) {
        throw Object.assign(
          new Error(`Amount ₹${amt.toFixed(2)} exceeds the outstanding balance of ₹${outstanding.toFixed(2)} for ${scope}. Advance payments are not supported.`),
          { status: 400 });
      }

      const [ins] = await conn.execute(
        `INSERT INTO client_fee_payments
          (org_id, student_id, fee_assignment_id, amount, payment_mode, transaction_id, receipt_number, collected_by, notes, payment_date, status)
         VALUES (?,?,?,?,?,?,?,?,?,CURDATE(),?)`,
        [orgId, student_id, assignmentId||null, amt, payment_mode, transaction_id||null, receipt_number, collectorId, notes||null, 'completed']);
      return ins;
    }).catch(e => { if (e.status) throw e; throw Object.assign(e, { status: 500 }); });

    const payment = await queryOne(`
      SELECT fp.*, s.admission_number, u.first_name, u.last_name,
        fs.name as structure_name, CONCAT(COALESCE(cu.first_name,''),' ',COALESCE(cu.last_name,'')) as collector_name
      FROM client_fee_payments fp
      LEFT JOIN client_students s ON s.id=fp.student_id
      LEFT JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_fee_assignments fa ON fa.id=fp.fee_assignment_id
      LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
      LEFT JOIN client_users cu ON cu.id=fp.collected_by
      WHERE fp.id=?`, [r.insertId]);

    // Auto-notify parents of payment received
    try {
      if (student_id) {
        // Lookup student name for template interpolation
        const studentInfo = await queryOne(
          `SELECT CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name
           FROM client_students s JOIN client_users u ON u.id=s.user_id WHERE s.id=?`, [student_id]
        );

        await notifSvc.sendToParentsOfStudent(orgId, student_id, {
          type: 'fee_payment',
          title: `Payment received: ₹${amt.toLocaleString('en-IN')}`,
          body: `Receipt: ${receipt_number}. Thank you.`,
          // The notification says "Receipt: RCP-…" and used to open
          // /parent/report-card. A parent told their receipt is ready, who taps
          // it and lands on a report card, concludes the receipt does not
          // exist. The gateway paths (payments.routes.js) have always linked
          // /receipt/<fee_payment_id> correctly; only the DESK-collected path
          // was wrong — which in an Indian school is most payments.
          // r.insertId is the client_fee_payments row this notification is
          // about (same id used for the receipt lookup above and the audit
          // below), and /receipt/[id] reads exactly that table.
          action_url: `/receipt/${r.insertId}`,
          icon: 'IndianRupee',
          priority: 'normal',
          sender_id: req.user.user_id,
          sender_role: 'admin',
          meta: {
            amount: amt.toLocaleString('en-IN'),
            student_name: studentInfo?.student_name || 'your child',
            receipt_no: receipt_number || 'N/A',
            school_name: (await queryOne('SELECT name FROM client_organizations WHERE id=?',[req.user.org_id]).catch(()=>null))?.name || 'your school',
          },
        });
      }
    } catch(notifErr) { console.error('Payment notif failed:', notifErr); }

    // The fee this payment settled is no longer 'pending'. Nothing in the
    // codebase had EVER updated this column, so every assignment read
    // 'pending' forever — which is why Analytics counted fully-paid students
    // as defaulters and the Calendar showed "Fee due" for children who had
    // paid. Recomputed here, at the moment the money moves.
    await recomputeAssignmentStatus(orgId, assignmentId);

    await audit(req, 'FEE_COLLECT', 'fee_payment', r.insertId, { new_data: { student_id, amount: amt, payment_mode, receipt_number } });
    return success(res, { payment, receipt_number }, 'Payment collected', 201);
  } catch (e) { return error(res, e.message, e.status || 500); }
});

router.get('/payments/recent', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { limit=10 } = req.query;
    const activeSchool = await getActiveSchool(req);
    const brPred = activeSchool ? ' AND s.school_id=?' : '';
    const payments = await query(`
      SELECT fp.*, u.first_name, u.last_name, s.admission_number,
        fs.name as structure_name
      FROM client_fee_payments fp
      JOIN client_students s ON s.id=fp.student_id
      JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_fee_assignments fa ON fa.id=fp.fee_assignment_id
      LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
      WHERE fp.org_id=?${brPred}
      ORDER BY fp.payment_date DESC, fp.id DESC LIMIT ?`,
      activeSchool ? [orgId, activeSchool, parseInt(limit)] : [orgId, parseInt(limit)]);
    return success(res, { payments });
  } catch (e) { return error(res, e.message, 500); }
});

// The fee register: WHO owes WHAT, and how much of it has been paid.
//
// This existed as a bare `LIMIT 50` dump with no filters, no paging and no
// caller — so a school with 600 students could see 50 arbitrary rows and had no
// way to answer "show me Class 6-A" or "who has not paid anything yet". It is
// now the backing query for the Assigned Fees register in the Fees console.
router.get('/assignments', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // §17 forbids BUILDING SQL from user data, and every value that comes from
    // the request below is a bound parameter. `page`/`limit` are the exception
    // and are deliberately clamped to integers here rather than bound: mysql2's
    // prepared-statement path cannot bind LIMIT/OFFSET on MySQL 8.2+ (it fails
    // with "Incorrect arguments to mysqld_stmt_execute"), which is what a
    // developer runs locally even though production is MariaDB, where it works.
    // A bound LIMIT therefore makes this whole screen a local 500 and untestable
    // — found exactly that way by tests-db/fee-assignment-db.test.js. `parseInt`
    // + clamp leaves nothing but a bounded integer to interpolate; this is the
    // same shape already used in modules/owner/owner.controller.js.
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 200);
    const { structure_id, class_id, section_id, search, due } = req.query;

    const activeSchool = await getActiveSchool(req);
    let where = 'WHERE fa.org_id=?';
    const params = [orgId];
    if (activeSchool)  { where += ' AND s.school_id=?';        params.push(activeSchool); }
    if (structure_id)  { where += ' AND fa.fee_structure_id=?'; params.push(structure_id); }
    if (class_id)      { where += ' AND sec.class_id=?';        params.push(class_id); }
    if (section_id)    { where += ' AND e.section_id=?';        params.push(section_id); }
    if (search) {
      where += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR s.admission_number LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    // The paid total is a correlated subquery rather than a join+GROUP BY so the
    // HAVING below filters on the same expression the row displays — a student
    // can never be listed as "unpaid" beside a paid amount.
    const PAID = PAID_FOR_ASSIGNMENT('fa');
    // The buckets an office actually works in.
    //   unpaid/partial/paid — how much of the money has come in
    //   overdue/upcoming    — WHEN it was owed, which only became answerable
    //                         once a fee had a due_date (migration 045). These
    //                         two are the whole point of the schedule: "who is
    //                         late" is the question a fee desk opens with, and
    //                         it had no answer at all before.
    let having = '';
    if (due === 'unpaid')        having = `HAVING paid_amount <= 0`;
    else if (due === 'partial')  having = `HAVING paid_amount > 0 AND paid_amount < fa.final_amount`;
    else if (due === 'paid')     having = `HAVING paid_amount >= fa.final_amount`;
    else if (due === 'pending')  having = `HAVING paid_amount < fa.final_amount`;
    else if (due === 'overdue')  having = `HAVING paid_amount < fa.final_amount AND fa.due_date IS NOT NULL AND fa.due_date < CURDATE()`;
    else if (due === 'upcoming') having = `HAVING paid_amount < fa.final_amount AND fa.due_date IS NOT NULL AND fa.due_date >= CURDATE()`;

    /*
     * ── ONE ROW PER FEE, NOT ONE PER ENROLMENT ──────────────────────────────
     *
     * This joined `client_enrollments … status='active'` directly, so a student
     * carrying TWO active enrolment rows made every one of their fees appear
     * TWICE — same student, same fee, same amount, listed again.
     *
     * It was reported as "individual toh select nahi ho rahe", but the duplicate
     * was the louder half: the header counted "2 assigned fees" where there was
     * one, the CSV export carried the phantom, and selecting everything would
     * have asked the server to delete the same assignment twice. The dashboard
     * tile was right the whole time — ₹11,995 due, one fee's worth — which is
     * what makes this a LIST bug and not a money bug.
     *
     * The fix picks ONE enrolment per student (the most recent active one) so
     * the join can no longer multiply rows. Deliberately not `DISTINCT`, which
     * would paper over the fan-out while leaving it in the count query, and not
     * `GROUP BY`, which ONLY_FULL_GROUP_BY refuses on MariaDB for exactly the
     * columns this SELECT needs.
     */
    const FROM = `
      FROM client_fee_assignments fa
      LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
      LEFT JOIN client_students s  ON s.id=fa.student_id
      LEFT JOIN client_users u     ON u.id=s.user_id
      ${CURRENT_ENROLMENT_JOIN}
      LEFT JOIN client_sections sec    ON sec.id=e.section_id
      LEFT JOIN client_classes c       ON c.id=sec.class_id
      ${where}`;

    const rows = await query(
      `SELECT fa.id, fa.student_id, fa.fee_structure_id, fa.final_amount, fa.assigned_date,
              fa.due_date, fa.discount_percent, fa.discount_amount, fa.status,
              fs.name AS structure_name, fs.frequency, fs.amount AS list_amount,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS student_name,
              s.admission_number, c.name AS class_name, sec.name AS section_name,
              (SELECT COUNT(*) FROM client_fee_installments fi WHERE fi.fee_assignment_id=fa.id) AS installment_count,
              ${PAID} AS paid_amount,
              (fa.final_amount - ${PAID}) AS pending_amount
       ${FROM}
       ${having}
       ORDER BY fa.due_date IS NULL, fa.due_date ASC, fa.id DESC
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params);

    // Counting through the same FROM/HAVING keeps the total honest under every
    // filter — a count that ignores `due` makes the pager lie about how many
    // pages of defaulters there are. `due_date` is carried into the derived
    // SELECT because the overdue/upcoming HAVING references it, and relying on
    // an engine to resolve a HAVING column absent from the projection is the
    // kind of thing that works on MariaDB and fails on MySQL.
    const totalRow = await queryOne(
      having
        ? `SELECT COUNT(*) AS total FROM (SELECT fa.id, fa.final_amount, fa.due_date, ${PAID} AS paid_amount ${FROM} ${having}) t`
        : `SELECT COUNT(*) AS total ${FROM}`,
      params);

    // How late each one is, from the ONE definition of aging shared with the
    // defaulter report and the reminder run.
    for (const r of rows) {
      r.days_overdue = Number(r.pending_amount) > 0 ? daysOverdue(r.due_date) : 0;
      r.age_bucket = ageBucket(r.days_overdue);
    }

    return paginated(res, rows, Number(totalRow?.total || 0), page, limit);
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ THE GAP — students on the roll who are being charged NOTHING ═════════
//
// The register can only list students who HAVE a fee, so a student who was
// never assigned one is invisible in exactly the place you would look for them.
// That is the most likely way a school loses money, and it happens by ordinary
// accident: a child is admitted in August, nobody remembers to assign the class
// fee, and they quietly attend the whole year free. Nothing anywhere said so.
//
// Deliberately NOT auto-assigning on admission. Silently billing a family
// because someone saved a student record is the kind of surprise that ends in a
// phone call — and the right amount, start date and concession are decisions a
// person makes. So the product SURFACES the gap and makes fixing it one click,
// rather than guessing on the school's behalf.
router.get('/unassigned', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 200);
    const { class_id, section_id, search } = req.query;

    const activeSchool = await getActiveSchool(req);
    let where = `WHERE s.org_id=? AND u.is_active=1
                 AND NOT EXISTS (SELECT 1 FROM client_fee_assignments fa WHERE fa.student_id=s.id)`;
    const params = [orgId];
    if (activeSchool) { where += ' AND s.school_id=?';  params.push(activeSchool); }
    if (class_id)     { where += ' AND sec.class_id=?';  params.push(class_id); }
    if (section_id)   { where += ' AND e.section_id=?';  params.push(section_id); }
    if (search) {
      where += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR s.admission_number LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const FROM = `
      FROM client_students s
      JOIN client_users u ON u.id=s.user_id AND u.org_id=s.org_id
      ${CURRENT_ENROLMENT_JOIN}
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      ${where}`;

    const rows = await query(
      `SELECT s.id AS student_id, s.admission_number,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
              c.name AS class_name, c.id AS class_id, sec.name AS section_name, sec.id AS section_id,
              s.admission_date
       ${FROM}
       ORDER BY c.standard, sec.name, u.first_name
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`, params);

    const totalRow = await queryOne(`SELECT COUNT(*) AS total ${FROM}`, params);
    return paginated(res, rows, Number(totalRow?.total || 0), page, limit);
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/payments', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const { query: q } = require('../../config/db');
    const activeSchool = await getActiveSchool(req);
    // payments join to fee_assignments→students; scope by the paying student's branch
    const brPred = activeSchool ? ' AND s.school_id=?' : '';
    const rows = await q(
      `SELECT fp.id, fp.fee_assignment_id, fp.amount, fp.payment_mode, fp.payment_date, fp.receipt_number, fp.transaction_id,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as student_name,
              fs.name as structure_name
       FROM client_fee_payments fp
       LEFT JOIN client_fee_assignments fa ON fa.id = fp.fee_assignment_id
       LEFT JOIN client_fee_structures fs ON fs.id = fa.fee_structure_id
       LEFT JOIN client_students s ON s.id = fa.student_id
       LEFT JOIN client_users u ON u.id = s.user_id
       WHERE fp.org_id = ?${brPred}
       ORDER BY fp.payment_date DESC LIMIT ?`,
      activeSchool ? [orgId, activeSchool, limit] : [orgId, limit]
    );
    return res.json({ status: 'success', data: rows });
  } catch (e) {
    console.error('fees/payments:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
});


// ═══ DEFAULTERS ═══
router.get('/defaulters', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { class_id, min_amount=0 } = req.query;

    let where = 'WHERE fa.org_id=?';
    const params = [orgId];
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND s.school_id=?'; params.push(activeSchool); }
    if (class_id) {
      where += ' AND sec.class_id=?';
      params.push(class_id);
    }

    const rows = await query(`
      SELECT s.id as student_id, u.first_name, u.last_name, u.email, u.phone,
        s.admission_number, c.name class_name, sec.name section_name,
        SUM(fa.final_amount) as total_assigned,
        COALESCE(SUM(${PAID_FOR_ASSIGNMENT('fa')}),0) as total_paid,
        (SUM(fa.final_amount) - COALESCE(SUM(${PAID_FOR_ASSIGNMENT('fa')}),0)) as pending_amount,
        MIN(CASE WHEN fa.final_amount > ${PAID_FOR_ASSIGNMENT('fa')} THEN fa.due_date END) as earliest_due
      FROM client_fee_assignments fa
      JOIN client_students s ON s.id=fa.student_id
      JOIN client_users u ON u.id=s.user_id
      ${CURRENT_ENROLMENT_JOIN}
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      ${where}
      -- Every non-aggregated column is named here, not just s.id. Grouping by
      -- the primary key alone is legal on MariaDB (production) and a hard 500
      -- on MySQL, whose default sql_mode includes ONLY_FULL_GROUP_BY — so this
      -- report worked on the server and could not run on a developer's machine
      -- at all. Same engine-divergence class as the bound LIMIT (KI-172), and
      -- found the same way: by running the suite against a real local database.
      GROUP BY s.id, u.first_name, u.last_name, u.email, u.phone,
               s.admission_number, c.name, sec.name
      HAVING pending_amount > ?
      ORDER BY pending_amount DESC`, [...params, parseFloat(min_amount)]);

    // AGING — "who owes" was answerable before; "who is LATE, and by how long"
    // was not, because a fee had no due date (KI-101). An office with 200
    // defaulters and no aging chases them alphabetically; with it, the 90+
    // bucket gets called first. Computed here rather than in SQL so the bucket
    // boundaries live in ONE place (services/feeLedger.js) shared with the
    // dashboard and the reminder run.
    const defaulters = rows.map(d => {
      const days = daysOverdue(d.earliest_due);
      return { ...d, days_overdue: days, age_bucket: ageBucket(days) };
    });

    const aging = defaulters.reduce((acc, d) => {
      acc[d.age_bucket] = acc[d.age_bucket] || { count: 0, amount: 0 };
      acc[d.age_bucket].count += 1;
      acc[d.age_bucket].amount += parseFloat(d.pending_amount) || 0;
      return acc;
    }, {});

    return success(res, {
      defaulters,
      aging,
      total_pending: defaulters.reduce((s, d) => s + (parseFloat(d.pending_amount) || 0), 0),
      overdue_count: defaulters.filter(d => d.days_overdue > 0).length,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ REMINDERS ═══════════════════════════════════════════════════════════
//
// "Smart Fee Reminders" has been a `Coming Q2 2026` stub page since the module
// was written, and it could not have been anything else: a reminder needs a
// DATE to remind against, and until migration 045 a fee had none. With the
// schedule in place this is a short route rather than a feature.
//
// It reuses the notification service the whole product already runs on (the
// same path that tells a parent their receipt is ready), so there is no second
// delivery mechanism to keep alive. WhatsApp/SMS ride the same service when a
// tenant has them configured.
//
// Deliberately NOT automatic. A nightly job that messages families about money
// is the kind of thing that goes wrong at 3am and reaches 600 parents; the
// office presses the button, sees exactly who it went to, and the audit log
// records it. Automation can come later, on top of a route that is known good.
router.post('/reminders/send', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { student_ids, class_id, min_amount = 1, only_overdue = true, message } = req.body;

    const activeSchool = await getActiveSchool(req);
    let where = 'WHERE fa.org_id=?';
    const params = [orgId];
    if (activeSchool) { where += ' AND s.school_id=?'; params.push(activeSchool); }
    if (class_id)     { where += ' AND sec.class_id=?'; params.push(class_id); }
    if (Array.isArray(student_ids) && student_ids.length) {
      const ids = [...new Set(student_ids.map(Number).filter(n => Number.isInteger(n) && n > 0))];
      if (!ids.length) return error(res, 'No valid students selected', 400);
      // TENANT GUARD: the ids are re-resolved through the org-scoped WHERE
      // below rather than trusted, so a reminder can never be addressed to
      // another school's family.
      where += ` AND s.id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }

    const rows = await query(`
      SELECT s.id AS student_id,
             CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
             SUM(fa.final_amount) - COALESCE(SUM(${PAID_FOR_ASSIGNMENT('fa')}),0) AS pending_amount,
             MIN(CASE WHEN fa.final_amount > ${PAID_FOR_ASSIGNMENT('fa')} THEN fa.due_date END) AS earliest_due
      FROM client_fee_assignments fa
      JOIN client_students s ON s.id=fa.student_id
      JOIN client_users u ON u.id=s.user_id
      ${CURRENT_ENROLMENT_JOIN}
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      ${where}
      -- named in full, per ONLY_FULL_GROUP_BY — see the defaulter report above
      GROUP BY s.id, u.first_name, u.last_name
      HAVING pending_amount >= ?
      ORDER BY pending_amount DESC`, [...params, parseFloat(min_amount) || 1]);

    const targets = rows.filter(r => !only_overdue || daysOverdue(r.earliest_due) > 0);

    if (!targets.length) {
      // Not an error. "Nobody is overdue" is a good day at a school, and saying
      // so plainly beats a red toast that reads like a failure.
      return success(res, { sent: 0, skipped: rows.length }, only_overdue
        ? 'No overdue fees right now — nothing to remind about.'
        : 'No pending fees right now — nothing to remind about.');
    }

    const school = await queryOne('SELECT name FROM client_organizations WHERE id=?', [orgId]).catch(() => null);
    let sent = 0;
    const failed = [];
    for (const t of targets) {
      const days = daysOverdue(t.earliest_due);
      const amount = Number(t.pending_amount).toLocaleString('en-IN');
      try {
        await notifSvc.sendToParentsOfStudent(orgId, t.student_id, {
          type: 'fee_reminder',
          title: `Fee reminder: ₹${amount} pending`,
          body: message?.trim()
            || (days > 0
              ? `${t.student_name.trim()}'s fee of ₹${amount} was due on ${String(t.earliest_due).slice(0, 10)} (${days} day${days === 1 ? '' : 's'} ago). Please pay at your earliest convenience.`
              : `${t.student_name.trim()}'s fee of ₹${amount} is pending. Please pay by ${String(t.earliest_due || '').slice(0, 10) || 'the due date'}.`),
          action_url: '/fees',
          icon: 'IndianRupee',
          priority: days > 30 ? 'high' : 'normal',
          sender_id: req.user.user_id,
          sender_role: 'admin',
          meta: { amount, student_name: t.student_name.trim(), school_name: school?.name || 'your school' },
        });
        sent++;
      } catch (e) {
        // One family with no linked parent must not stop the other 199.
        failed.push({ student_id: t.student_id, reason: e.message });
      }
    }

    await audit(req, 'FEE_REMINDER_SEND', 'fee_reminder', null, {
      new_data: {
        sent, failed: failed.length, only_overdue,
        student_ids: targets.map(t => t.student_id),
        total_pending: targets.reduce((s, t) => s + Number(t.pending_amount), 0),
      },
    });

    return success(res, { sent, failed: failed.length, failures: failed.slice(0, 10), targets: targets.length },
      `Reminder sent to ${sent} famil${sent === 1 ? 'y' : 'ies'}`
      + (failed.length ? ` · ${failed.length} could not be reached (no parent linked)` : ''));
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ REPORTS ═══

/*
 * ── THE DAY BOOK ───────────────────────────────────────────────────────────
 *
 * The one question a school office asks at 4pm and this module could not
 * answer: what did we take today, and does it match the cash box?
 *
 * The dashboard has a "Today ₹0" tile and nothing behind it. The collection
 * report can be narrowed to a single day, but it lists receipts without ever
 * splitting them the two ways that matter at closing time:
 *
 *   BY MODE      — cash is the only line that has to equal a physical count.
 *                  Lumping ₹40,000 of UPI in with ₹2,000 of notes makes the
 *                  tally meaningless, which is why every school keeps them apart.
 *   BY COLLECTOR — cash passes through a PERSON. "Who took it" is the first
 *                  question when a drawer is short, and the platform recorded
 *                  `collected_by` on every receipt without ever showing it.
 *
 * Reversals are reported separately and NOT netted into the mode totals. A
 * receipt cancelled today may belong to money taken last week; folding it into
 * today's cash line would make the drawer disagree with the screen on a day
 * nobody did anything wrong. Gross in, reversals beside it, net stated plainly.
 */

/*
 * ── THE AUDIT SCREEN ───────────────────────────────────────────────────────
 *
 * Three questions an auditor asks that this module could not answer, and a
 * school could not answer for them:
 *
 *   1. WHAT WAS GIVEN AWAY. A concession is money the school chose not to
 *      collect. Every one of them was recorded and none of them were ever
 *      listed together, so "how much did we waive this year, and to whom" had
 *      no answer short of reading the fee list student by student.
 *
 *   2. WHAT WAS UNDONE. Reversing a receipt has been possible for a while.
 *      Nothing ever listed the reversals, which makes an undo with no register
 *      — the one hole an auditor goes looking for first.
 *
 *   3. IS THE RECEIPT BOOK INTACT. Receipt numbers are a SERIES. A duplicate
 *      means two families may hold the same receipt number; a gap means a
 *      receipt is unaccounted for. Both are tested on paper books everywhere
 *      and neither was checked here.
 *
 * `granted_by` on a concession comes from the audit trail, not from the fee
 * row: the assignment stores the discount, and only client_audit_logs knows
 * whose hand set it.
 */
router.get('/reports/audit', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { from_date, to_date } = req.query;

    let dateWhere = '';
    const dateParams = [];
    if (from_date) { dateWhere += ' AND DATE(fp.reversed_at)>=?'; dateParams.push(from_date); }
    if (to_date)   { dateWhere += ' AND DATE(fp.reversed_at)<=?'; dateParams.push(to_date); }

    const [concessions, reversals, dupes, series] = await Promise.all([
      // Every concession in force, and whose hand set it.
      query(
        `SELECT fa.id, fa.discount_amount, fa.discount_percent, fa.final_amount,
                fs.amount AS list_amount, fs.name AS structure_name,
                CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
                s.admission_number,
                (SELECT CONCAT(COALESCE(au.first_name,''),' ',COALESCE(au.last_name,''))
                   FROM client_audit_logs al
                   LEFT JOIN client_users au ON au.id=al.user_id
                  WHERE al.org_id=fa.org_id AND al.entity_type='fee_assignment'
                    AND al.entity_id=fa.id AND al.action='FEE_ASSIGNMENT_UPDATE'
                  ORDER BY al.id DESC LIMIT 1) AS granted_by,
                (SELECT al.created_at FROM client_audit_logs al
                  WHERE al.org_id=fa.org_id AND al.entity_type='fee_assignment'
                    AND al.entity_id=fa.id AND al.action='FEE_ASSIGNMENT_UPDATE'
                  ORDER BY al.id DESC LIMIT 1) AS granted_at
           FROM client_fee_assignments fa
           JOIN client_students s ON s.id=fa.student_id AND s.org_id=fa.org_id
           JOIN client_users u ON u.id=s.user_id
           LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
          WHERE fa.org_id=? AND COALESCE(fa.discount_amount,0) > 0
          ORDER BY fa.discount_amount DESC
          LIMIT 500`, [orgId]),

      query(
        `SELECT fp.id, fp.receipt_number, fp.amount, fp.status, fp.reversal_reason,
                fp.payment_date AS original_date, fp.reversed_at,
                CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
                CONCAT(COALESCE(ru.first_name,''),' ',COALESCE(ru.last_name,'')) AS reversed_by_name
           FROM client_fee_payments fp
           JOIN client_students s ON s.id=fp.student_id AND s.org_id=fp.org_id
           JOIN client_users u ON u.id=s.user_id
           LEFT JOIN client_users ru ON ru.id=fp.reversed_by
          WHERE fp.org_id=? AND fp.reversed_at IS NOT NULL${dateWhere}
          ORDER BY fp.reversed_at DESC
          LIMIT 500`, [orgId, ...dateParams]),

      // Two families holding one receipt number. Exact, and cheap.
      query(
        `SELECT receipt_number, COUNT(*) AS count
           FROM client_fee_payments
          WHERE org_id=? AND receipt_number IS NOT NULL AND receipt_number<>''
          GROUP BY receipt_number HAVING COUNT(*) > 1
          ORDER BY receipt_number`, [orgId]),

      query(
        `SELECT receipt_number FROM client_fee_payments
          WHERE org_id=? AND receipt_number IS NOT NULL AND receipt_number<>''
          ORDER BY id DESC LIMIT 5000`, [orgId]),
    ]);

    /*
     * Gaps are computed over the WHOLE series, not the filtered period: a
     * missing receipt either side of a date range is still a missing receipt,
     * and a period-scoped check would report a gap at every boundary and be
     * switched off within a week for crying wolf.
     *
     * The trailing digits are the sequence — RCPT-29-0001. Anything that does
     * not end in digits is left out rather than guessed at; a school that
     * numbers receipts some other way gets no gap report, which is honest,
     * instead of a list of imaginary holes.
     */
    const seq = series
      .map(r => String(r.receipt_number).match(/(\d+)\s*$/))
      .filter(Boolean)
      .map(m => parseInt(m[1], 10))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b);

    const gaps = [];
    for (let i = 1; i < seq.length && gaps.length < 50; i++) {
      const prev = seq[i - 1], curr = seq[i];
      if (curr > prev + 1) gaps.push({ after: prev, before: curr, missing: curr - prev - 1 });
    }

    const totalConcession = concessions.reduce((n, r) => n + Number(r.discount_amount || 0), 0);
    const totalReversed = reversals.reduce((n, r) => n + Number(r.amount || 0), 0);

    return success(res, {
      concessions,
      concession_total: totalConcession,
      concession_count: concessions.length,
      reversals,
      reversed_total: totalReversed,
      reversal_count: reversals.length,
      receipt_series: {
        checked: seq.length,
        duplicates: dupes,
        gaps,
        // Said plainly, because "no issues" and "we could not check" are
        // different answers and only one of them is reassuring.
        checkable: seq.length > 1,
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/reports/daybook', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    // Defaults to today in IST — a school closes its books on the local date,
    // and the server's UTC clock rolls over 5½ hours early.
    const date = String(req.query.date || new Date(Date.now() + 5.5 * 3600000).toISOString().split('T')[0]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return error(res, 'date must be YYYY-MM-DD', 400);

    const [byMode, byCollector, receipts, reversals] = await Promise.all([
      query(
        `SELECT fp.payment_mode AS mode, COUNT(*) AS count, COALESCE(SUM(fp.amount),0) AS total
           FROM client_fee_payments fp
          WHERE fp.org_id=? AND DATE(fp.payment_date)=? AND fp.status='completed'
          GROUP BY fp.payment_mode`, [orgId, date]),
      query(
        `SELECT fp.collected_by AS user_id,
                COALESCE(NULLIF(TRIM(CONCAT(COALESCE(cu.first_name,''),' ',COALESCE(cu.last_name,''))),''),'Not recorded') AS collector,
                COUNT(*) AS count, COALESCE(SUM(fp.amount),0) AS total
           FROM client_fee_payments fp
           LEFT JOIN client_users cu ON cu.id=fp.collected_by
          WHERE fp.org_id=? AND DATE(fp.payment_date)=? AND fp.status='completed'
          GROUP BY fp.collected_by, collector
          ORDER BY total DESC`, [orgId, date]),
      query(
        `SELECT fp.id, fp.receipt_number, fp.amount, fp.payment_mode, fp.created_at, fp.notes,
                CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
                s.admission_number, fs.name AS structure_name,
                CONCAT(COALESCE(cu.first_name,''),' ',COALESCE(cu.last_name,'')) AS collector_name
           FROM client_fee_payments fp
           JOIN client_students s ON s.id=fp.student_id AND s.org_id=fp.org_id
           JOIN client_users u ON u.id=s.user_id
           LEFT JOIN client_fee_assignments fa ON fa.id=fp.fee_assignment_id
           LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
           LEFT JOIN client_users cu ON cu.id=fp.collected_by
          WHERE fp.org_id=? AND DATE(fp.payment_date)=? AND fp.status='completed'
          ORDER BY fp.id ASC`, [orgId, date]),
      // Reversed ON this date, whenever the money originally came in.
      query(
        `SELECT fp.id, fp.receipt_number, fp.amount, fp.status, fp.reversal_reason,
                fp.payment_date AS original_date,
                CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
                CONCAT(COALESCE(ru.first_name,''),' ',COALESCE(ru.last_name,'')) AS reversed_by_name
           FROM client_fee_payments fp
           JOIN client_students s ON s.id=fp.student_id AND s.org_id=fp.org_id
           JOIN client_users u ON u.id=s.user_id
           LEFT JOIN client_users ru ON ru.id=fp.reversed_by
          WHERE fp.org_id=? AND DATE(fp.reversed_at)=? AND fp.status<>'completed'
          ORDER BY fp.reversed_at ASC`, [orgId, date]),
    ]);

    const collected = byMode.reduce((n, r) => n + Number(r.total || 0), 0);
    const reversedTotal = reversals.reduce((n, r) => n + Number(r.amount || 0), 0);
    const cash = byMode.find(r => r.mode === 'cash');

    /*
     * TWO DIFFERENT NUMBERS, AND THEY MUST NOT BE SUBTRACTED FROM EACH OTHER.
     *
     * `collected` counts completed receipts dated today, so a receipt reversed
     * at any point has ALREADY left it. Taking `reversed_today` off it again
     * subtracts the same money twice — which is exactly what the first cut of
     * this endpoint did, and what its test caught: ₹46,000 taken, ₹1,000
     * cancelled, and it reported ₹44,000.
     *
     * So the reconciliation is stated the way a day book actually reads:
     *   gross_today     — every receipt WRITTEN today, cancelled or not
     *   reversed_today  — cancelled today, whatever day the money came in
     *   collected       — what the school still holds from today's receipts
     *
     * `reversed_today` is beside the day, not inside it: a receipt cancelled
     * today may belong to money taken last week, and folding it into today's
     * cash line would make the drawer disagree with the screen on a day nobody
     * did anything wrong.
     */
    const grossRow = await queryOne(
      `SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
         FROM client_fee_payments
        WHERE org_id=? AND DATE(payment_date)=?`, [orgId, date]);

    return success(res, {
      date,
      collected,
      gross_today: Number(grossRow?.total || 0),
      gross_count: Number(grossRow?.count || 0),
      receipt_count: receipts.length,
      // The only figure that has to equal a physical count of notes.
      cash_in_hand: Number(cash?.total || 0),
      reversed_today: reversedTotal,
      reversal_count: reversals.length,
      by_mode: byMode,
      by_collector: byCollector,
      receipts,
      reversals,
    });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/reports/collection', requireFinance, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { from_date, to_date, mode } = req.query;

    let where = 'WHERE fp.org_id=?';
    const params = [orgId];
    // branch scope via student subquery — works in both the joined list query and
    // the summary query (which has no client_students join).
    const activeSchool = await getActiveSchool(req);
    if (activeSchool) { where += ' AND fp.student_id IN (SELECT id FROM client_students WHERE org_id=? AND school_id=?)'; params.push(orgId, activeSchool); }
    if (from_date) { where += ' AND DATE(fp.payment_date)>=?'; params.push(from_date); }
    if (to_date)   { where += ' AND DATE(fp.payment_date)<=?'; params.push(to_date); }
    if (mode)      { where += ' AND fp.payment_mode=?'; params.push(mode); }

    const payments = await query(`
      SELECT fp.*, u.first_name, u.last_name, s.admission_number,
        c.name class_name, sec.name section_name, fs.name structure_name,
        CONCAT(COALESCE(cu.first_name,''),' ',COALESCE(cu.last_name,'')) as collector_name
      FROM client_fee_payments fp
      JOIN client_students s ON s.id=fp.student_id
      JOIN client_users u ON u.id=s.user_id
      ${CURRENT_ENROLMENT_JOIN}
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      LEFT JOIN client_fee_assignments fa ON fa.id=fp.fee_assignment_id
      LEFT JOIN client_fee_structures fs ON fs.id=fa.fee_structure_id
      LEFT JOIN client_users cu ON cu.id=fp.collected_by
      ${where}
      ORDER BY fp.payment_date DESC, fp.id DESC
      LIMIT 500`, params);

    // The LIST above keeps reversed receipts visible on purpose — a receipt
    // that vanishes from the day book is how a clerk loses track of a
    // correction they made. The SUMMARY must exclude them, because that is the
    // figure the office reconciles against the cash box. Both facts on one
    // screen is the honest answer; showing only one of them is not.
    const OK = `CASE WHEN fp.status='completed' THEN fp.amount ELSE 0 END`;
    const summary = await queryOne(`
      SELECT COUNT(CASE WHEN fp.status='completed' THEN 1 END) as total_count,
        COALESCE(SUM(${OK}),0) as total_amount,
        SUM(CASE WHEN fp.payment_mode='cash'   THEN ${OK} ELSE 0 END) as cash_total,
        SUM(CASE WHEN fp.payment_mode='upi'    THEN ${OK} ELSE 0 END) as upi_total,
        SUM(CASE WHEN fp.payment_mode='card'   THEN ${OK} ELSE 0 END) as card_total,
        SUM(CASE WHEN fp.payment_mode='cheque' THEN ${OK} ELSE 0 END) as cheque_total,
        SUM(CASE WHEN fp.payment_mode='online' THEN ${OK} ELSE 0 END) as online_total,
        COUNT(CASE WHEN fp.status<>'completed' THEN 1 END) as reversed_count,
        COALESCE(SUM(CASE WHEN fp.status<>'completed' THEN fp.amount ELSE 0 END),0) as reversed_amount
      FROM client_fee_payments fp ${where}`, params);

    return success(res, { payments, summary });
  } catch (e) { return error(res, e.message, 500); }
});

// Backward-compat: old /dashboard handler was used by admin dashboard
// Explicit guard here — do not rely on the /dashboard route's guard surviving
// future edits; the indirection through router.handle() also makes this
// invisible to grep-based audits.
router.get('/', requireFinance, async (req, res) => {
  // same as dashboard
  req.url = '/dashboard';
  return router.handle(req, res, () => {});
});

module.exports = router;
// Exported so tests-db/schema-coupling.test.js can assert this against the real
// client_fee_payments.payment_mode ENUM instead of keeping a second copy.
module.exports.PAYMENT_MODES = PAYMENT_MODES;
// Same reason, and a sharper one: every fee total in the product filters on
// this column, so drift here silently mis-states money on every screen.
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
