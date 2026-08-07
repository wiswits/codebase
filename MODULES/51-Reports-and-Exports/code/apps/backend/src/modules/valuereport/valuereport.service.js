'use strict';
/**
 * VALUE REPORT — what this institution actually GOT from WisWits this session.
 *
 * WHY IT EXISTS. At renewal a principal asks one question: "what did we actually
 * get for this?" Until now the only place that answer lived was a sales deck. So
 * it goes on the page they open all year — the billing page — above the price,
 * and the price becomes a receipt for something they can see.
 *
 * THE ONE RULE. Every number here is COUNTED from a real table. Nothing is
 * estimated, extrapolated, or rounded up in our favour. A single figure a
 * principal can disprove destroys the credibility of the whole page, so where
 * the data does not support a metric we leave the metric out rather than guess
 * at it. Each metric therefore carries three things:
 *   value  — the number itself
 *   raw    — the underlying counts, so the figure can be audited
 *   basis  — one sentence of plain English naming exactly what was counted,
 *            which the UI prints underneath. If a basis cannot be written
 *            honestly, the metric does not ship.
 *
 * DELIBERATELY NOT HERE — and these omissions are the point:
 *   • "hours saved" / "₹ saved". There is no table of hours. Any such figure is
 *     an assumed minutes-per-task multiplied by a count, i.e. an estimate wearing
 *     a number's clothes. It is also the single easiest figure for a sceptical
 *     principal to reject, which would poison the real ones sitting next to it.
 *   • announcements `push_count`. The column exists and is never written — it
 *     reads 0 for orgs that have published announcements. A metric sourced from
 *     a column nothing populates is a fabricated metric.
 *   • holiday-adjusted school days. `client_hr_holidays` is the HR calendar, not
 *     the school calendar. Subtracting it would SHRINK the denominator and
 *     flatter us. The working-day count below is therefore un-adjusted, which
 *     can only ever understate how completely attendance was marked.
 *
 * SCOPE. `org_id` on every query. For a multi-branch org with a branch active,
 * the branch-scopable metrics are scoped to it and the org-wide-only ones are
 * OMITTED — an org-wide figure printed under a branch heading is exactly the
 * kind of number that gets disproved. Single-branch orgs (the overwhelming
 * majority) scope to null and see everything.
 */
const { query, queryOne } = require('../../config/db');
const { istToday } = require('../../utils/schoolDay');
const cache = require('../../config/redis');

// §12 analytics caching rule. The billing page is opened by anxious people and
// has a performance budget; these are read-only aggregates over a whole session
// and nothing on this page changes minute to minute.
const CACHE_TTL_SECONDS = 300;

/* ───────────────────────────── formatting ──────────────────────────────── */

const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const count = (n) => (Number(n) || 0).toLocaleString('en-IN');
const num = (v) => {
  // mysql2 hands DECIMAL back as a string and SUM() over no rows as null.
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const day = (iso) =>
  new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

/* ───────────────────────────── the session ─────────────────────────────── */

/**
 * The session the report covers.
 *
 * Preferred source is the school's own current academic year. Plenty of orgs
 * have never created one (the local dev DB has several), so the fallback is the
 * standard Indian April–March session containing today — stated as an assumption
 * in `source` so the UI can say which one it used rather than implying the
 * school configured it.
 */
async function resolveSession(orgId) {
  const row = await queryOne(
    `SELECT name, start_date, end_date
       FROM academic_years
      WHERE org_id = ? AND is_current = 1
      ORDER BY start_date DESC
      LIMIT 1`,
    [orgId],
  );
  // start_date/end_date are DATE columns → 'YYYY-MM-DD' strings (db.js dateStrings).
  if (row && row.start_date && row.end_date) {
    return {
      label: row.name,
      start: row.start_date,
      end: row.end_date,
      source: 'academic_year',
      basis: 'your current academic session',
    };
  }
  const today = istToday();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const startYear = month >= 4 ? year : year - 1;
  return {
    label: `${startYear}-${String(startYear + 1).slice(2)}`,
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
    source: 'assumed_april_march',
    basis: 'the April–March session (no academic session is set up yet)',
  };
}

/* ─────────────────────────── working days ──────────────────────────────── */

/**
 * Working days elapsed in the session, from the school's attendance settings.
 *
 * `client_attendance_config.working_days_mask` is 7 characters, index 0 = Monday
 * through index 6 = Sunday. The shipped default '1111110' is Monday–Saturday
 * working with Sunday off, which is the only reading under which that default
 * makes sense for an Indian school.
 *
 * No holiday subtraction — see the header. The count runs from the session start
 * to whichever is earlier, today or the session end, so a school four months in
 * is measured against four months, never against a full year.
 */
const DEFAULT_WORKING_DAYS_MASK = '1111110';
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function countWorkingDays(startISO, endISO, mask) {
  const bits = /^[01]{7}$/.test(String(mask || '')) ? String(mask) : DEFAULT_WORKING_DAYS_MASK;
  // Date.UTC arithmetic on the calendar strings: a working day is a calendar
  // fact, so doing the loop in UTC keeps it free of any timezone shift.
  let cursor = Date.parse(`${startISO}T00:00:00Z`);
  const last = Date.parse(`${endISO}T00:00:00Z`);
  if (!Number.isFinite(cursor) || !Number.isFinite(last) || last < cursor) return { days: 0, bits };
  let days = 0;
  while (cursor <= last) {
    const d = new Date(cursor);
    // getUTCDay(): 0 = Sunday … 6 = Saturday. Shift so Monday is index 0.
    if (bits[(d.getUTCDay() + 6) % 7] === '1') days += 1;
    cursor += 86400000;
  }
  return { days, bits };
}

function describeWorkingWeek(bits) {
  const on = DAY_NAMES.filter((_, i) => bits[i] === '1');
  if (!on.length) return 'no working days set';
  // Contiguous runs read as a range ("Mon–Sat"); anything else lists the days.
  const indexes = DAY_NAMES.map((_, i) => i).filter((i) => bits[i] === '1');
  const contiguous = indexes.every((v, i) => i === 0 || v === indexes[i - 1] + 1);
  return contiguous && on.length > 2 ? `${on[0]}–${on[on.length - 1]}` : on.join(', ');
}

/* ────────────────────── optional-table presence ────────────────────────── */

/**
 * Certificates ship in migration 018 and are live on production, but an
 * environment that has not run that migration simply has no such table. Asking
 * information_schema once is cheaper and far more honest than wrapping the query
 * in a catch that would also swallow a genuine SQL error.
 */
async function tablesPresent(names) {
  const holes = names.map(() => '?').join(',');
  const rows = await query(
    `SELECT TABLE_NAME AS t
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${holes})`,
    names,
  );
  return new Set(rows.map((r) => r.t));
}

/* ───────────────────────────── the report ──────────────────────────────── */

/**
 * Build the report. `schoolId` is the active branch or null.
 * Returns the shape the UI renders; see the route for the envelope.
 */
async function buildReport(orgId, schoolId) {
  const session = await resolveSession(orgId);
  const today = istToday();
  // Never measure a school against days that have not happened yet.
  const upto = today < session.end ? today : session.end;
  const windowEnd = `${upto} 23:59:59`;
  const windowStart = `${session.start} 00:00:00`;

  const branchScoped = Boolean(schoolId);
  const present = await tablesPresent(['client_cert_issued', 'client_whatsapp_messages']);

  // Branch predicates. Fee payments and attendance sessions carry no school_id of
  // their own, so they are scoped through the row that does — the same subquery
  // shape fees.routes.js already uses, kept identical on purpose so branch
  // filtering means one thing across the product.
  const feeBranch = branchScoped
    ? ' AND fp.student_id IN (SELECT id FROM client_students WHERE org_id = ? AND school_id = ?)'
    : '';
  const sectionBranch = branchScoped
    ? ' AND section_id IN (SELECT id FROM client_sections WHERE org_id = ? AND school_id = ?)'
    : '';
  const branchParams = branchScoped ? [orgId, schoolId] : [];

  const metrics = [];

  /* 1 — FEES COLLECTED, and the share parents paid online.
     `status = 'completed'` because a pending or refunded row is not money the
     school collected. The online figure is derived by joining the fee payment to
     the online order that CREATED it (client_payment_orders.fee_payment_id, set
     by payments.routes.js on verify/mock-complete), which makes the online amount
     a strict subset of the collected amount by construction — it can never
     exceed it, whatever anyone records by hand. Deriving it from payment_mode
     instead would count a UPI transfer the office typed in by hand as "paid
     online through WisWits", which is not what happened. */
  const fees = await queryOne(
    `SELECT COUNT(*) AS payments, COALESCE(SUM(fp.amount), 0) AS amount
       FROM client_fee_payments fp
      WHERE fp.org_id = ?
        AND fp.status = 'completed'
        AND fp.payment_date BETWEEN ? AND ?${feeBranch}`,
    [orgId, session.start, upto, ...branchParams],
  );
  const online = await queryOne(
    `SELECT COUNT(*) AS payments, COALESCE(SUM(fp.amount), 0) AS amount
       FROM client_fee_payments fp
       JOIN client_payment_orders po
         ON po.fee_payment_id = fp.id AND po.org_id = fp.org_id
      WHERE fp.org_id = ?
        AND fp.status = 'completed'
        AND po.status = 'paid'
        AND fp.payment_date BETWEEN ? AND ?${feeBranch}`,
    [orgId, session.start, upto, ...branchParams],
  );
  const collected = num(fees?.amount);
  const onlineAmount = num(online?.amount);
  const onlinePct = collected > 0 ? Math.round((onlineAmount / collected) * 100) : 0;
  metrics.push({
    key: 'fees_collected',
    label: 'Fees collected',
    value: collected,
    display: inr(collected),
    detail:
      num(fees?.payments) === 0
        ? null
        : `${count(fees.payments)} payment${num(fees.payments) === 1 ? '' : 's'} recorded` +
          (onlineAmount > 0 ? ` · ${onlinePct}% paid online by parents` : ''),
    basis:
      `Fee payments recorded in WisWits between ${day(session.start)} and ${day(upto)}, ` +
      'completed only.' +
      (onlineAmount > 0
        ? ` The online share is the part parents paid through the app (${inr(onlineAmount)}).`
        : ''),
    raw: {
      table: 'client_fee_payments',
      payments: num(fees?.payments),
      amount_inr: collected,
      online_payments: num(online?.payments),
      online_amount_inr: onlineAmount,
      online_pct: onlinePct,
    },
  });

  /* 2 — DAYS ATTENDANCE WAS MARKED, out of working days elapsed.
     One attendance session is one class section on one date, so DISTINCT date is
     "days on which this school marked attendance at all" — not a per-class
     figure dressed up as a school figure. */
  const cfg = await queryOne(
    'SELECT working_days_mask FROM client_attendance_config WHERE org_id = ?',
    [orgId],
  );
  const { days: workingDays, bits } = countWorkingDays(session.start, upto, cfg?.working_days_mask);
  const att = await queryOne(
    `SELECT COUNT(DISTINCT date) AS days
       FROM client_attendance_sessions
      WHERE org_id = ? AND date BETWEEN ? AND ?${sectionBranch}`,
    [orgId, session.start, upto, ...branchParams],
  );
  const markedDays = num(att?.days);
  metrics.push({
    key: 'attendance_days',
    label: 'Days attendance marked',
    value: markedDays,
    display: count(markedDays),
    detail: workingDays > 0 ? `of ${count(workingDays)} working days so far` : null,
    basis:
      `Days with at least one attendance session recorded, against a ` +
      `${describeWorkingWeek(bits)} working week from your attendance settings. ` +
      'Holidays are not deducted, so the working-day figure is the higher one.',
    raw: {
      table: 'client_attendance_sessions',
      marked_days: markedDays,
      working_days: workingDays,
      working_days_mask: bits,
      holidays_deducted: false,
    },
  });

  /* 3 — MESSAGES DELIVERED TO FAMILIES.
     Notifications are per-recipient rows, so a count of rows is a count of
     deliveries — not a count of "sends" that fanned out to an unknown audience.
     WhatsApp counts only messages the provider accepted or delivered; queued and
     failed are not deliveries. Notifications carry no school_id, so a branch view
     drops this metric rather than showing the org-wide number under a branch. */
  if (!branchScoped) {
    const notif = await queryOne(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN recipient_role = 'parent'  THEN 1 ELSE 0 END) AS to_parents,
         SUM(CASE WHEN recipient_role = 'student' THEN 1 ELSE 0 END) AS to_students
       FROM client_notifications
      WHERE org_id = ? AND created_at BETWEEN ? AND ?`,
      [orgId, windowStart, windowEnd],
    );
    let whatsapp = 0;
    if (present.has('client_whatsapp_messages')) {
      const wa = await queryOne(
        `SELECT COUNT(*) AS sent
           FROM client_whatsapp_messages
          WHERE org_id = ?
            AND status IN ('sent', 'delivered', 'read')
            AND created_at BETWEEN ? AND ?`,
        [orgId, windowStart, windowEnd],
      );
      whatsapp = num(wa?.sent);
    }
    const toParents = num(notif?.to_parents);
    const toStudents = num(notif?.to_students);
    const total = num(notif?.total) + whatsapp;
    const parts = [];
    if (toParents) parts.push(`${count(toParents)} to parents`);
    if (toStudents) parts.push(`${count(toStudents)} to students`);
    if (whatsapp) parts.push(`${count(whatsapp)} on WhatsApp`);
    metrics.push({
      key: 'messages_delivered',
      label: 'Messages delivered',
      value: total,
      display: count(total),
      detail: parts.length ? parts.join(' · ') : null,
      basis:
        'One row per person reached: in-app notifications delivered to parents, ' +
        'students and staff, plus WhatsApp messages the provider accepted. ' +
        'Queued and failed messages are not counted.',
      raw: {
        tables: ['client_notifications', 'client_whatsapp_messages'],
        notifications_total: num(notif?.total),
        to_parents: toParents,
        to_students: toStudents,
        whatsapp_sent: whatsapp,
      },
    });
  }

  /* 4 — REPORT CARDS PUBLISHED TO FAMILIES.
     A publish row is one exam for one class section. Multiplying it out by the
     students actively enrolled in that section gives the number of families who
     got a report card, which is what a principal means by "report cards". Stated
     as such in the basis, because it is derived from the CURRENT enrolment. */
  const rc = await queryOne(
    `SELECT COUNT(*) AS cards, COUNT(DISTINCT p.id) AS publishes
       FROM client_reportcard_publishes p
       JOIN client_enrollments e
         ON e.org_id = p.org_id AND e.section_id = p.section_id AND e.status = 'active'
      WHERE p.org_id = ?
        AND p.published = 1
        AND p.published_at BETWEEN ? AND ?${branchScoped
          ? ' AND p.section_id IN (SELECT id FROM client_sections WHERE org_id = ? AND school_id = ?)'
          : ''}`,
    [orgId, windowStart, windowEnd, ...branchParams],
  );
  const cards = num(rc?.cards);
  metrics.push({
    key: 'report_cards',
    label: 'Report cards published',
    value: cards,
    display: count(cards),
    detail: num(rc?.publishes)
      ? `across ${count(rc.publishes)} class result${num(rc.publishes) === 1 ? '' : 's'}`
      : null,
    basis:
      'Exam results published to a class section, counted once per student ' +
      'currently enrolled in that section.',
    raw: {
      tables: ['client_reportcard_publishes', 'client_enrollments'],
      cards: cards,
      publishes: num(rc?.publishes),
    },
  });

  /* 5 — CERTIFICATES ISSUED. Only issued ones: a draft is not a certificate a
     student was given, and a revoked one was taken back. Certificates carry no
     school_id, so a branch view drops it. */
  if (!branchScoped && present.has('client_cert_issued')) {
    const cert = await queryOne(
      `SELECT COUNT(*) AS issued
         FROM client_cert_issued
        WHERE org_id = ? AND status = 'issued' AND issue_date BETWEEN ? AND ?`,
      [orgId, session.start, upto],
    );
    const issued = num(cert?.issued);
    metrics.push({
      key: 'certificates',
      label: 'Certificates issued',
      value: issued,
      display: count(issued),
      detail: null,
      basis: 'Certificates issued from WisWits this session. Drafts and revoked certificates are not counted.',
      raw: { table: 'client_cert_issued', issued },
    });
  }

  /* 6 — PEOPLE USING THE PLATFORM.
     `client_users.last_login` holds the MOST RECENT sign-in, so anyone who signed
     in during the session necessarily has last_login on or after the session
     start. Counting those rows is therefore exact — "accounts that have signed in
     since the session began" — not a sample or an approximation. The sign-in
     total alongside it is the count of LOGIN rows in the audit trail. Neither is
     branch-scopable (client_users has no school_id), so a branch view drops it. */
  if (!branchScoped) {
    const people = await queryOne(
      `SELECT COUNT(*) AS people
         FROM client_users
        WHERE org_id = ? AND is_active = 1 AND last_login >= ?`,
      [orgId, windowStart],
    );
    const signins = await queryOne(
      `SELECT COUNT(*) AS signins
         FROM client_audit_logs
        WHERE org_id = ?
          AND entity_type = 'user'
          AND action IN ('LOGIN', 'OTP_LOGIN')
          AND created_at BETWEEN ? AND ?`,
      [orgId, windowStart, windowEnd],
    );
    const signedIn = num(people?.people);
    metrics.push({
      key: 'people_signed_in',
      label: 'People signed in',
      value: signedIn,
      display: count(signedIn),
      detail: num(signins?.signins) ? `${count(signins.signins)} sign-ins recorded` : null,
      basis:
        'Active accounts — staff, students and parents — whose most recent sign-in ' +
        'falls inside this session.',
      raw: {
        tables: ['client_users', 'client_audit_logs'],
        people: signedIn,
        signins: num(signins?.signins),
      },
    });
  }

  return {
    session: {
      label: session.label,
      start: session.start,
      end: session.end,
      upto,
      source: session.source,
      basis: session.basis,
    },
    branch_scoped: branchScoped,
    branch_id: schoolId || null,
    // TRUE only when something real happened. A school in its first week has a
    // perfectly valid report full of honest zeros, and the UI must show it a
    // sentence rather than a wall of 0s in 48px type.
    has_history: metrics.some((m) => Number(m.value) > 0),
    metrics,
    generated_at: new Date().toISOString(),
  };
}

/** Cached entry point. Redis absent → straight through, never a failure. */
async function getValueReport(orgId, schoolId) {
  const key = `valuereport:v1:${orgId}:${schoolId || 'org'}`;
  const hit = await cache.get(key);
  if (hit) return { ...hit, cached: true };
  const report = await buildReport(orgId, schoolId);
  await cache.set(key, report, CACHE_TTL_SECONDS);
  return { ...report, cached: false };
}

module.exports = {
  getValueReport,
  // exported for scripts/prove_value_report.js — it must measure the real
  // queries, not a cached copy of them
  buildReport,
  countWorkingDays,
  CACHE_TTL_SECONDS,
};
