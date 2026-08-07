'use strict';
/*
 * turnover.service.js — THE INSTRUMENT THAT WATCHES THE REGISTRATION THRESHOLD.
 *
 * ── WHAT THIS IS, AND WHAT IT IS EMPHATICALLY NOT ───────────────────────────
 * WISWITS Edutech Pvt. Ltd. is not GST-registered today. Below the registration
 * threshold that is the CORRECT state, and the invoices are right to carry no tax:
 * `tax_enabled = 0`, `tax_rate_bp = 0`, every tax field empty, invoices byte-identical
 * to what they were before migration 037 built the container.
 *
 * The risk this file exists to remove is not in the code. It is that the threshold is
 * crossed QUIETLY, months pass, and the liability is discovered late — with interest and
 * penalty, and with invoices already issued that cannot be reissued. The cure for that is
 * not a rule engine. It is a number somebody sees.
 *
 * So this file MEASURES and WARNS. It does not:
 *   · state a rule            — the threshold is a setting, read from the database
 *   · compute a liability     — no rate is applied to anything, anywhere in this file
 *   · claim to be the statutory figure — what counts toward "aggregate turnover" is a
 *     definition question for a CA, and every response says so in one plain sentence
 *   · block, gate or enforce anything
 *
 * Nobody here is a tax adviser. This is a smoke detector, not a fire code.
 *
 * ── WHY `client_invoices`, AND NOTHING ELSE ─────────────────────────────────
 * It is the only table that records money WISWITS has actually been paid.
 *   · `client_payment_orders` / fee tables are TENANT money — a parent paying a school.
 *     Summing it as our turnover would be wrong by orders of magnitude. `owner.revenue`
 *     already carries that warning; it is repeated here because it is the single easiest
 *     mistake to make on this screen.
 *   · `client_subscriptions.amount` is what we EXPECT to bill, not what arrived, and it
 *     is in legacy RUPEES.
 *   · `client_billing_events` is a webhook ledger — provider events, many of which move
 *     no money and some of which are replays. It is a trail, not a total.
 * Only `client_invoices` rows that reached `status = 'paid'` represent money received.
 *
 * ── WHICH COLUMN IS "TURNOVER" ──────────────────────────────────────────────
 * `amount_paise`. `writeInvoice` sets it to `tax.taxablePaise` — the value of the supply
 * BEFORE tax — and `total_paise` to the taxable value plus tax. So `amount_paise` is the
 * value of supply both today (tax off, where all three columns are equal) and on the day
 * the rate is switched on. Summing `total_paise` would start silently including tax in
 * the turnover figure the moment registration happens, which is the exact month the
 * number most needs to be right.
 *
 * Everything is paise, integer, all the way to the edge. Rupees appear only in display
 * strings built at the very end.
 */

const db = require('../../config/db');
const logger = require('../../utils/logger');
const { istToday } = require('../../utils/schoolDay');

const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);

// ── THE ₹1 MANDATE IS NOT A SALE ────────────────────────────────────────────
// `pricing.FIRST_CHARGE_PAISE` is 100 — the UPI Autopay authorisation that proves a real
// institution with a real bank account. It is a fraud filter, not revenue.
//
// It DOES reach this table. The authorisation rides as a gateway add-on, and Razorpay
// emits `subscription.charged` for it like any other charge, so `writeInvoice` records a
// 100-paise invoice with `status = 'paid'`. Nothing in the charge handler guards against
// it. Counting it would put a ₹1 "sale" in a turnover total — small in rupees, fatal to
// whether anyone believes the tile.
const MANDATE_PAISE = 100;

// ── WHAT A FAKE PAYMENT LOOKS LIKE ──────────────────────────────────────────
// Nothing on the invoice row records which gateway mode produced it. The only tell is
// the shape of `payment_ref`, and these are the prefixes this codebase mints for money
// that was never real:
//   pay_SIM…     POST /api/billing/simulate (refused once live keys exist)
//   pay_PROVE…   scripts/prove_payment_path.js
//   pay_SMOKE…   scripts/prelaunch_smoke.js
//   pay_VERIFY…  scripts/verify_billing_flow.js
//   pay_MOCK…    razorpayService mock mode (parent-fee path today, cheap to guard anyway)
//
// ── WHY A DENY-LIST AND NOT `payment_ref REGEXP '^pay_[A-Za-z0-9]{14}$'` ────
// An allow-list is tighter and it fails in the wrong direction. If the gateway ever
// changes its id format, an allow-list stops counting REAL money — turnover silently
// under-reports, the threshold is crossed with the tile still reading "comfortable", and
// that is precisely the disaster this file exists to prevent. A deny-list fails the other
// way: an unrecognised fake gets counted, the figure reads high, and somebody talks to
// their CA a month early. Between a false alarm and a missed one, take the false alarm.
//
// Anchored to the start, not `%SIM%` anywhere: a real Razorpay id is `pay_` plus 14
// random alphanumerics, the collation here is case-insensitive, and a substring match
// would quietly drop roughly one real payment in every few thousand for containing
// "sim". Under-reporting by accident is the failure this whole file is about.
// `DEMO-%` is here for a reason the others are not: demo rows are seeded on purpose,
// by a human, on the day of a customer meeting — the one moment nobody is auditing the
// tax figure. `scripts/seed_demo_commerce.js` writes ₹90,590 of walkthrough invoices,
// and without this line every rupee of it counted toward the ₹20 lakh registration
// threshold. Caught by that script asserting the figure did not move, and failing.
const FAKE_REF_PREFIXES = ['pay\\_SIM%', 'pay\\_PROVE%', 'pay\\_SMOKE%', 'pay\\_VERIFY%', 'pay\\_MOCK%', 'DEMO-%'];
const NOT_FAKE_SQL = `(payment_ref IS NULL OR (${FAKE_REF_PREFIXES.map(() => 'payment_ref NOT LIKE ?').join(' AND ')}))`;

// A default only for a database that has not run migration 039. The real value lives in
// `platform_billing_config.turnover_threshold_paise` — a setting, so that a
// special-category state or a changed rule is an UPDATE, never a deploy.
const FALLBACK_THRESHOLD_PAISE = 2000000 * 100;

// Where the bands sit. Deliberately generous: the point of `approaching` is to leave time
// to talk to a CA and gather paperwork, not to raise an alarm on the last day.
const BAND_APPROACHING = 0.70;
const BAND_IMMINENT = 0.90;

const RANK = { comfortable: 0, approaching: 1, imminent: 2, crossed: 3 };

/* ───────────────────────────── THE FINANCIAL YEAR ───────────────────────────── */

/**
 * Indian financial year boundaries for an IST calendar day: 1 April – 31 March.
 *
 * The day is taken from `istToday()`, never from `new Date()` on the server. Production
 * runs UTC, and between 18:30 and 24:00 UTC the IST calendar day is already tomorrow —
 * so on the night of 31 March a server-local computation puts the year's last payments
 * into the wrong financial year. `schoolDay.js` exists because that exact class of bug
 * ("present_today: 12 with nobody marked") already shipped once here.
 *
 * @param {number} [back=0] financial years back from the current one.
 * @returns {{label:string, start:string, endExclusive:string, end:string}} 'YYYY-MM-DD'.
 */
function financialYear(back = 0) {
  const today = istToday();                       // 'YYYY-MM-DD' in IST
  const year = parseInt(today.slice(0, 4), 10);
  const month = parseInt(today.slice(5, 7), 10);
  // Jan/Feb/Mar belong to the financial year that STARTED the previous April.
  const startYear = (month >= 4 ? year : year - 1) - back;
  return {
    label: `${startYear}-${String(startYear + 1).slice(-2)}`,  // '2026-27'
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
    // Half-open upper bound. `paid_at` is a TIMESTAMP, so `<= '2026-03-31'` silently
    // drops everything paid after midnight on the last day of the year.
    endExclusive: `${startYear + 1}-04-01`,
  };
}

/* ─────────────────────────────── THE MEASUREMENT ─────────────────────────────── */

// One WHERE clause, defined once, used by the current year, the previous year AND the row
// dump in the prove script — so the figure and the evidence for the figure cannot diverge.
//
// `status = 'paid'` is the whole test for "received". A fully refunded invoice becomes
// `refunded` and drops out here on its own; a partially refunded one stays `paid` and is
// reported with its refund shown separately (see `measure`).
const PAID_INVOICE_WHERE = `
      status = 'paid'
      AND org_id <> ?
      AND total_paise > ?
      AND ${NOT_FAKE_SQL}
      AND COALESCE(paid_at, issued_at, created_at) >= ?
      AND COALESCE(paid_at, issued_at, created_at) < ?`;

const paidParams = (fy) => [
  PLATFORM_ORG_ID, MANDATE_PAISE, ...FAKE_REF_PREFIXES, fy.start, fy.endExclusive,
];

/* ── WHAT WAS INVOICED, NOT ONLY WHAT ARRIVED ─────────────────────────────────
 * This watch counted `status = 'paid'` alone. That is the LATEST-warning option
 * available, and this is an alarm: being early costs a conversation, being late
 * costs interest and penalty on tax already due.
 *
 * Two ways it warned late. A part-paid invoice contributed nothing at all until
 * its final rupee arrived — so ₹25,500 of JD PUBLIC's ₹51,000, genuinely received
 * and sitting in the bank, was invisible here. And a school invoiced in March that
 * pays in May moved the figure into the WRONG YEAR entirely.
 *
 * There is also a substantive point I am not qualified to settle: aggregate turnover
 * is generally reckoned on supplies MADE rather than money collected, which would
 * make the invoiced figure the one that matters and the received figure a comfort.
 * That is his CA's ruling, not this file's — so it reports BOTH, drives the warning
 * from whichever is higher, and names which one did it. The conservative reading is
 * the only one it is safe to be wrong in.
 *
 * `draft` is excluded (not issued, so no supply), and so are `void`, `failed` and
 * `refunded`. Dated by the INVOICE date, because that is when the supply was made.
 */
const INVOICED_WHERE = `
      status IN ('issued', 'part_paid', 'paid')
      AND org_id <> ?
      AND total_paise > ?
      AND ${NOT_FAKE_SQL}
      AND COALESCE(issued_at, created_at) >= ?
      AND COALESCE(issued_at, created_at) < ?`;

/**
 * Money actually received from customers in one financial year.
 *
 * Deliberately plain SQL: no window function, no CTE, and no aggregate alias in ORDER BY.
 * Local development is MySQL and the servers are MariaDB, and an aggregate alias in
 * ORDER BY is a CONFIRMED divergence between them in this repo — a query that is green on
 * a laptop and 500s on staging. There is nothing here that both engines do not agree on.
 */
async function sumFor(fy) {
  const rows = await db.query(
    `SELECT
       COUNT(*)                        AS invoices,
       COUNT(DISTINCT org_id)          AS customers,
       COALESCE(SUM(amount_paise), 0)  AS taxable_paise,
       COALESCE(SUM(tax_paise), 0)     AS tax_paise,
       COALESCE(SUM(refunded_paise), 0) AS refunded_paise,
       COALESCE(SUM(CASE WHEN dispute_status = 'lost' THEN total_paise ELSE 0 END), 0) AS disputed_paise
     FROM client_invoices
     WHERE ${PAID_INVOICE_WHERE}`,
    paidParams(fy));
  const r = rows[0] || {};
  return {
    invoices: Number(r.invoices || 0),
    customers: Number(r.customers || 0),
    // The headline. Value of supply, excluding any tax, in paise.
    receivedPaise: Number(r.taxable_paise || 0),
    taxCollectedPaise: Number(r.tax_paise || 0),
    // Money that came back. Reported, never subtracted — see `measure`.
    refundedPaise: Number(r.refunded_paise || 0),
    disputedPaise: Number(r.disputed_paise || 0),
  };
}

/**
 * Value INVOICED in one financial year — supplies made, whatever has been collected.
 * Same exclusions as `sumFor`, dated by the invoice rather than by the payment.
 */
async function sumInvoicedFor(fy) {
  const rows = await db.query(
    `SELECT
       COUNT(*)                          AS invoices,
       COUNT(DISTINCT org_id)            AS customers,
       COALESCE(SUM(amount_paise), 0)    AS taxable_paise,
       COALESCE(SUM(received_paise), 0)  AS received_paise
     FROM client_invoices
     WHERE ${INVOICED_WHERE}`,
    paidParams(fy));
  const r = rows[0] || {};
  return {
    invoicedPaise: Number(r.taxable_paise || 0),
    invoices: Number(r.invoices || 0),
    customers: Number(r.customers || 0),
    // What has actually arrived against those invoices — the part-paid money that the
    // `status = 'paid'` figure cannot see. Reported so the gap is a number, not a feeling.
    receivedAgainstPaise: Number(r.received_paise || 0),
  };
}

/** The rows behind the figure — evidence, for the prove script and for a human. */
async function rowsFor(fy, limit = 200) {
  return db.query(
    `SELECT id, org_id, invoice_number, plan_slug, amount_paise, tax_paise, total_paise,
            refunded_paise, status, payment_ref,
            COALESCE(paid_at, issued_at, created_at) AS counted_at
       FROM client_invoices
      WHERE ${PAID_INVOICE_WHERE}
      ORDER BY counted_at ASC
      LIMIT ${Number(limit) | 0}`,
    paidParams(fy));
}

/** What was deliberately left out, and why — so the exclusions are auditable, not folklore. */
async function excludedFor(fy) {
  const rows = await db.query(
    `SELECT
       COALESCE(SUM(status <> 'paid'), 0)                        AS not_paid,
       COALESCE(SUM(status = 'paid' AND org_id = ?), 0)          AS internal_org,
       COALESCE(SUM(status = 'paid' AND NOT ${NOT_FAKE_SQL}), 0) AS simulated,
       COALESCE(SUM(status = 'paid' AND total_paise <= ?), 0)    AS mandate_or_zero
     FROM client_invoices
     WHERE COALESCE(paid_at, issued_at, created_at) >= ?
       AND COALESCE(paid_at, issued_at, created_at) < ?`,
    [PLATFORM_ORG_ID, ...FAKE_REF_PREFIXES, MANDATE_PAISE, fy.start, fy.endExclusive]);
  const r = rows[0] || {};
  return {
    notPaid: Number(r.not_paid || 0),
    internalOrg: Number(r.internal_org || 0),
    simulated: Number(r.simulated || 0),
    mandateOrZero: Number(r.mandate_or_zero || 0),
  };
}

/* ─────────────────────────────── THE SETTING ─────────────────────────────── */

async function readConfig() {
  try {
    const row = await db.queryOne(
      `SELECT turnover_threshold_paise, turnover_alert_state, turnover_alert_at
         FROM platform_billing_config WHERE id = 1`);
    if (!row) return { thresholdPaise: FALLBACK_THRESHOLD_PAISE, alertState: 'comfortable', alertAt: null, configured: false };
    return {
      thresholdPaise: Number(row.turnover_threshold_paise) || FALLBACK_THRESHOLD_PAISE,
      alertState: row.turnover_alert_state || 'comfortable',
      alertAt: row.turnover_alert_at || null,
      configured: true,
    };
  } catch (e) {
    // Pre-039 database, or a DB blip. A settings table that cannot be read must never
    // take down the page — the answer degrades to the default and says it is unconfigured.
    if (e.code !== 'ER_BAD_FIELD_ERROR' && e.code !== 'ER_NO_SUCH_TABLE') {
      logger.warn(`turnover: falling back to default threshold (${e.code || e.message})`);
    }
    return { thresholdPaise: FALLBACK_THRESHOLD_PAISE, alertState: 'comfortable', alertAt: null, configured: false };
  }
}

/* ────────────────────────── STATUS, PROJECTION, WORDS ────────────────────────── */

const rupees = (paise) => `₹${Math.round(Number(paise || 0) / 100).toLocaleString('en-IN')}`;

function bandFor(receivedPaise, thresholdPaise) {
  if (!thresholdPaise || thresholdPaise <= 0) return 'comfortable';
  const pct = receivedPaise / thresholdPaise;
  if (pct >= 1) return 'crossed';
  if (pct >= BAND_IMMINENT) return 'imminent';
  if (pct >= BAND_APPROACHING) return 'approaching';
  return 'comfortable';
}

/**
 * At the rate money has arrived so far this year, which month would the threshold be
 * reached? Straight-line, and it says so — a SaaS book that lands one large annual
 * customer does not grow in a straight line, and this is a prompt to look, not a forecast.
 */
function project(receivedPaise, thresholdPaise, fy) {
  const today = istToday();
  const dayMs = 86400000;
  const elapsedDays = Math.max(1,
    Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${fy.start}T00:00:00Z`)) / dayMs) + 1);
  const perDay = receivedPaise / elapsedDays;
  const remaining = thresholdPaise - receivedPaise;

  if (remaining <= 0) return { crossingMonth: null, note: 'Already past the level being watched.', perDayPaise: Math.round(perDay) };
  if (perDay <= 0) return { crossingMonth: null, note: 'No money has been received this financial year, so there is no rate to project from.', perDayPaise: 0 };

  const daysToCross = Math.ceil(remaining / perDay);
  const crossAt = new Date(Date.parse(`${today}T00:00:00Z`) + daysToCross * dayMs);
  const month = crossAt.toLocaleString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const withinFy = crossAt.getTime() < Date.parse(`${fy.endExclusive}T00:00:00Z`);

  return {
    crossingMonth: month,
    withinFinancialYear: withinFy,
    perDayPaise: Math.round(perDay),
    note: withinFy
      ? `At the rate money has arrived so far this year, the level would be reached around ${month}.`
      : `At the rate money has arrived so far this year, the level would not be reached before this financial year ends. On this trend it lands around ${month}.`,
  };
}

/** Written for a founder reading a dashboard, not for an accountant reading a return. */
function sentenceFor(status, received, threshold, pct) {
  const of = `${rupees(received)} of the ${rupees(threshold)} you are watching (${pct}%)`;
  switch (status) {
    case 'crossed':
      return `Turnover this financial year has passed the level you are watching — ${of}. `
        + 'Talk to your CA now rather than at the end of the year: invoices already issued cannot be reissued, '
        + 'and the cost of finding this late is interest and penalty on top of the tax.';
    case 'imminent':
      return `You are very close to the level you are watching — ${of}. `
        + 'This is the point to have the registration actually in hand, because the switch has to happen on a '
        + 'date boundary and the paperwork takes longer than the decision does.';
    case 'approaching':
      return `You have reached ${of}. `
        + 'Nothing is wrong and nothing needs to change today. This is the point to ask your CA to start the '
        + 'registration, so that the date you switch is a date you chose.';
    default:
      return `You are comfortably below the level you are watching — ${of}. `
        + 'Nothing to do. This figure updates itself; you will be told before it matters.';
  }
}

/* ─────────────────────────────── THE ANSWER ─────────────────────────────── */

/**
 * The whole measurement. Read-only: this function does not write anything, anywhere.
 * @returns {Promise<object>} the payload the endpoint and the prove script both use.
 */
async function measure() {
  const fy = financialYear(0);
  const prev = financialYear(1);
  const cfg = await readConfig();

  const [current, previous, excluded, currentInvoiced, previousInvoiced] = await Promise.all([
    sumFor(fy), sumFor(prev), excludedFor(fy),
    sumInvoicedFor(fy), sumInvoicedFor(prev),
  ]);

  const threshold = cfg.thresholdPaise;
  // ── THE STATUS IS DRIVEN BY THE GROSS FIGURE, ON PURPOSE ──────────────────
  // Refunds and lost chargebacks are reported on their own lines and NOT subtracted.
  // Whether money returned to a customer reduces aggregate turnover is a definition
  // question, and answering it in code is exactly what this file promised not to do.
  // Not subtracting also warns earlier, which is the only direction in which being
  // wrong here is harmless.
  const received = current.receivedPaise;

  // ── THE WARNING FOLLOWS THE HIGHER OF THE TWO ────────────────────────────
  // See INVOICED_WHERE. Supplies made and money received answer different questions,
  // one of them is the statutory one, and this file does not get to decide which.
  // So it watches whichever is further along and says so on the response.
  const invoiced = currentInvoiced.invoicedPaise;
  const watched = Math.max(received, invoiced);
  const watchedBasis = invoiced > received ? 'invoiced' : 'received';

  const pct = threshold > 0 ? Math.round((watched / threshold) * 1000) / 10 : 0;
  const status = bandFor(watched, threshold);

  return {
    financialYear: {
      label: fy.label, start: fy.start, end: fy.end,
      note: 'Indian financial year: 1 April to 31 March, on the IST calendar.',
    },
    // Supplies MADE this year, whatever has been collected against them. Reported
    // beside `received` because they answer different questions and only a CA can
    // say which one the threshold is reckoned on.
    invoiced: {
      paise: invoiced,
      display: rupees(invoiced),
      invoices: currentInvoiced.invoices,
      customers: currentInvoiced.customers,
      receivedAgainstPaise: currentInvoiced.receivedAgainstPaise,
      receivedAgainstDisplay: rupees(currentInvoiced.receivedAgainstPaise),
      // Money genuinely in the bank against invoices not yet fully settled — invisible
      // to the `paid`-only figure, and the gap that made this change necessary.
      notYetInReceivedPaise: Math.max(0, currentInvoiced.receivedAgainstPaise - received),
      notYetInReceivedDisplay: rupees(Math.max(0, currentInvoiced.receivedAgainstPaise - received)),
      previousYearPaise: previousInvoiced.invoicedPaise,
      previousYearDisplay: rupees(previousInvoiced.invoicedPaise),
      note: 'Invoices issued this year, dated by the invoice. Drafts, cancelled and '
        + 'refunded invoices are excluded.',
    },
    // Which of the two the warning above is following, and why there are two.
    watched: {
      basis: watchedBasis,
      paise: watched,
      display: rupees(watched),
      note: watchedBasis === 'invoiced'
        ? 'Following what has been invoiced, because it is the higher of the two. Turnover is '
          + 'generally reckoned on supplies made rather than money collected, but which figure '
          + 'your registration turns on is a question for your CA.'
        : 'Following what has been received, because it is the higher of the two. If your CA '
          + 'reckons turnover on invoices raised rather than money collected, watch that figure '
          + 'instead — it is reported beside this one.',
    },
    received: {
      paise: received,
      display: rupees(received),
      invoices: current.invoices,
      customers: current.customers,
      refundedPaise: current.refundedPaise,
      refundedDisplay: rupees(current.refundedPaise),
      disputedLostPaise: current.disputedPaise,
      disputedLostDisplay: rupees(current.disputedPaise),
      taxCollectedPaise: current.taxCollectedPaise,
    },
    previousFinancialYear: {
      label: prev.label,
      paise: previous.receivedPaise,
      display: rupees(previous.receivedPaise),
      invoices: previous.invoices,
    },
    threshold: {
      paise: threshold,
      display: rupees(threshold),
      configured: cfg.configured,
      note: cfg.configured
        ? 'This figure is a setting, not something built into the app. Change it in platform billing settings.'
        : 'Showing the built-in default — the setting could not be read. Run migration 039.',
    },
    percentOfThreshold: pct,
    status,
    headline: sentenceFor(status, received, threshold, pct),
    projection: project(received, threshold, fy),

    // ── SAY ON SCREEN EXACTLY WHAT THIS NUMBER IS MADE OF ───────────────────
    counts: [
      'Invoices to customers that were actually paid.',
      'The value of the supply before any tax (today that is the whole invoice, because no tax is charged).',
      'Dated by when the invoice was paid, on the IST calendar.',
    ],
    excludes: [
      `Rehearsal money — simulated, mock and test-script payments (${excluded.simulated} invoice(s) this year).`,
      `Anything not actually paid — draft, issued, failed, void or fully refunded (${excluded.notPaid} this year).`,
      `Our own internal organisation, org ${PLATFORM_ORG_ID} (${excluded.internalOrg} this year).`,
      `₹1 mandate authorisations and zero-value rows (${excluded.mandateOrZero} this year).`,
      'Fees a parent pays a school. That is the school\'s money passing through, never ours.',
      'Refunds and lost chargebacks are shown separately and are NOT subtracted from the figure above.',
    ],
    caveat:
      'This is a measurement of money received through this platform, not a statutory figure. '
      + 'What counts toward the registration threshold — and which threshold applies — is a question '
      + 'for your CA, and both the threshold and the tax settings are values you enter, not rules in the code.',
    limitation:
      'One gap worth knowing: nothing on an invoice records which gateway mode produced it. Simulated and '
      + 'test-script payments are recognised by the reference they carry, but a payment made with the '
      + 'gateway on TEST keys looks exactly like a live one. If test keys are ever pointed at this database, '
      + 'that money will be counted here. Closing it properly means recording the gateway mode on the '
      + 'invoice at the moment it is written.',
    generatedAt: new Date().toISOString(),
  };
}

/* ──────────────────────────────── THE ALERT ──────────────────────────────── */

/**
 * Tell the platform owner ONCE per state.
 *
 * The dedupe is the whole design. A warning that fires on every page load is a warning
 * that trains the one person who needs to act to click it away — which is how `dunning.js`
 * arrived at the same conclusion and the same shape (a state column on the row the alert
 * is about, checked before the send, written after it).
 *
 * Falling BACK a band (a new financial year resets the total to zero on 1 April) rewrites
 * the state silently, with no notification. Without that, the year's first `approaching`
 * would never fire again after the first time it ever fired.
 *
 * This writes no money row. It touches one settings column and inserts notifications.
 */
async function maybeAlert(result, req = null) {
  const status = result.status;
  let stored = 'comfortable';
  try {
    const row = await db.queryOne('SELECT turnover_alert_state FROM platform_billing_config WHERE id = 1');
    stored = row?.turnover_alert_state || 'comfortable';
  } catch {
    return { fired: false, reason: 'no settings row' };   // pre-039; nothing to dedupe against
  }

  const now = RANK[status] ?? 0;
  const was = RANK[stored] ?? 0;
  if (now === was) return { fired: false, reason: 'already at this state' };

  if (now < was) {
    await db.query(
      'UPDATE platform_billing_config SET turnover_alert_state = ? WHERE id = 1', [status]);
    return { fired: false, reason: 'state fell back, reset quietly' };
  }

  // `comfortable` is not news.
  if (status === 'comfortable') return { fired: false, reason: 'nothing to report' };

  // The durable record, whatever else succeeds. dunning.js does the same, for the same
  // reason: notification delivery is best-effort, a log line is not.
  logger.error(
    `TURNOVER ALERT: ${result.percentOfThreshold}% of ${result.threshold.display} `
    + `(${result.received.display} received in FY ${result.financialYear.label}) — state ${stored} → ${status}`);

  let sent = 0;
  try {
    const notif = require('../../services/notificationService');
    // Keys are `body` / `action_url` / `priority` — the ONLY ones notificationService
    // destructures. dunning.js passes `message` / `link` / `severity` and every one of
    // its notifications has therefore been written with an empty body. Not copied here.
    const res = await notif.sendToAdmins(PLATFORM_ORG_ID, {
      type: 'turnover_threshold',
      title: status === 'crossed'
        ? 'Turnover has passed the level you are watching'
        : `Turnover is ${result.percentOfThreshold}% of the level you are watching`,
      body: result.headline,
      action_url: '/superadmin/billing',
      icon: 'TrendingUp',
      priority: status === 'comfortable' ? 'normal' : (status === 'approaching' ? 'high' : 'urgent'),
      meta: {
        financial_year: result.financialYear.label,
        received_paise: result.received.paise,
        threshold_paise: result.threshold.paise,
        percent: result.percentOfThreshold,
        status,
      },
    });
    sent = Number(res?.sent || 0);
  } catch (e) {
    logger.error(`turnover alert notify failed: ${e.message}`);
  }

  if (!sent) {
    // Do NOT record the state. `send()` swallows its own errors and returns null, so
    // marking "told" on a delivery that never happened would suppress this alert
    // permanently — the one failure mode worse than not having built it.
    logger.error(
      `turnover alert reached NOBODY in org ${PLATFORM_ORG_ID} — state left at '${stored}' so it retries`);
    return { fired: false, reason: 'no recipient', notified: 0 };
  }

  await db.query(
    'UPDATE platform_billing_config SET turnover_alert_state = ?, turnover_alert_at = NOW() WHERE id = 1',
    [status]);

  try {
    const { audit } = require('../../utils/audit');
    // `client_audit_logs.org_id` is NOT NULL, and `audit()` reads it off `req.user`. Called
    // from a cron or a script there IS no request, so a bare `audit(null, …)` silently
    // fails its own insert and the alert leaves no audit trail at all — which the prove
    // run caught. The platform org is the correct owner of a platform-level alert.
    const actor = req || { user: { org_id: PLATFORM_ORG_ID, user_id: null } };
    await audit(actor, 'TURNOVER_ALERT', 'platform_billing_config', 1,
      { old_data: { state: stored }, new_data: { state: status, percent: result.percentOfThreshold } });
  } catch { /* audit is fire-and-forget by contract */ }

  return { fired: true, from: stored, to: status, notified: sent };
}

module.exports = {
  measure, maybeAlert, financialYear,
  // exported for the prove script, so the evidence uses the same predicate as the figure
  rowsFor, sumFor, readConfig, bandFor,
  PLATFORM_ORG_ID, MANDATE_PAISE, BAND_APPROACHING, BAND_IMMINENT,
};
