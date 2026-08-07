'use strict';
/*
 * invoices.controller.js — the Owner Dashboard's invoice and payment ledger.
 *
 * Thin on purpose. Every rule about money lives in
 * `services/payments/invoiceLedger.js`; this file turns HTTP into a call, an audit line
 * out of the result, and a `LedgerError` into the sentence the founder needs to read.
 *
 * ── EVERY WRITE IS AUDITED UNDER `BILLING`, WITH BEFORE AND AFTER ───────────
 * Not "after" alone. The question an audit trail has to answer about money is what
 * CHANGED, and "this invoice is now paid" does not answer it. `old_data` therefore
 * carries the settlement state before the write and `new_data` the state after, so a
 * ₹51,000 invoice moving pending → part_paid → paid reads as two explicable steps.
 *
 * The audit rows land under the PLATFORM org, because these are WisWits' own invoices —
 * not the customer's activity, and they must not appear in the customer's audit trail.
 */

const svc = require('../../services/payments/invoiceLedger');
const logger = require('../../utils/logger');
const { audit } = require('../../utils/audit');
const { success, error } = require('../../utils/response');

const actorOf = (req) => ({ userId: req.user?.user_id || req.user?.id || null });

/**
 * One place that decides what the client is told when something goes wrong.
 *
 * A `LedgerError` is an EXPECTED refusal — "that is more than is outstanding" — and its
 * message is written for the person holding the bank statement, so it is passed through
 * verbatim. Anything else is a bug: it is logged with the route and answered generically,
 * because an unexpected exception's message is a SQL string or a stack detail.
 */
function fail(res, req, err, what) {
  if (err && err.expected) return error(res, err.message, err.status || 400);
  logger.error(`[owner.invoices] ${what}: ${err?.message}`);
  return error(res, 'Could not complete that. It has been logged.', 500);
}

/* ─────────────────────────────── READ ─────────────────────────────── */

// GET /api/owner/invoices
exports.list = async (req, res) => {
  try {
    const result = await svc.list({
      orgId: req.query.orgId,
      status: req.query.status,
      method: req.query.method,
      source: req.query.source,
      financialYear: req.query.financialYear || req.query.fy,
      from: req.query.from,
      to: req.query.to,
      q: req.query.q,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return success(res, result);
  } catch (err) { return fail(res, req, err, 'list'); }
};

// GET /api/owner/invoices/methods — the vocabulary, from the service, so the UI can
// never offer a method the ledger would refuse.
exports.methods = async (req, res) =>
  success(res, {
    methods: svc.METHOD_KEYS.map((key) => ({ key, label: svc.METHODS[key] })),
    sources: svc.SOURCES,
    // The two that may be recorded without a reference. Stated by the API rather than
    // duplicated as a rule in the form.
    referenceOptional: ['cash', 'adjustment'],
  });

// GET /api/owner/invoices/quote/:orgId — what resolveForOrg says this org owes, so the
// create form opens with the price the system already knows. Read-only.
exports.quote = async (req, res) => {
  try {
    const q = await svc.quote(Number(req.params.orgId), req.query.cycle);
    if (!q) {
      return success(res, {
        quote: null,
        note: 'This organisation has no subscription to price from, so the amount has to be entered.',
      });
    }
    return success(res, { quote: q });
  } catch (err) { return fail(res, req, err, 'quote'); }
};

// GET /api/owner/invoices/:id
exports.get = async (req, res) => {
  try {
    const inv = await svc.get(Number(req.params.id));
    if (!inv) return error(res, 'That invoice does not exist.', 404);
    return success(res, { invoice: inv });
  } catch (err) { return fail(res, req, err, 'get'); }
};

// GET /api/owner/invoices/:id/attachment
//
// Streamed through this guarded route and NEVER from a static mount. `backend/uploads/`
// is served publicly at /uploads and /api/uploads; an invoice names a school and an
// amount and must not be reachable by guessing a filename.
exports.attachment = async (req, res) => {
  try {
    const inv = await svc.get(Number(req.params.id));
    if (!inv) return error(res, 'That invoice does not exist.', 404);
    if (!inv.attachment) return error(res, 'This invoice has no attachment.', 404);

    const row = await require('../../config/db').queryOne(
      'SELECT attachment_path FROM client_invoices WHERE id = ?', [Number(req.params.id)]);
    const file = svc.documentPath(row?.attachment_path);
    if (!file) return error(res, 'That file is no longer available.', 404);

    res.set('Content-Type', inv.attachment.mime || 'application/octet-stream');
    // `private` matters: a shared cache holding someone's invoice is the same leak as a
    // public URL, arrived at differently.
    res.set('Cache-Control', 'private, no-store');
    res.set('Content-Disposition',
      `inline; filename="${String(inv.attachment.name || 'invoice').replace(/[^\w.-]/g, '_')}"`);
    return require('fs').createReadStream(file).pipe(res);
  } catch (err) { return fail(res, req, err, 'attachment'); }
};

/* ─────────────────────────────── WRITE ─────────────────────────────── */

// POST /api/owner/invoices — create a new invoice, priced from resolveForOrg.
exports.create = async (req, res) => {
  try {
    const inv = await svc.createInvoice(req.body || {}, actorOf(req));
    await audit(req, 'BILLING', 'client_invoice', inv.id, {
      // There is no "before" for a document that did not exist. Saying so explicitly
      // beats a null that could be read as "we did not record it".
      old_data: { existed: false },
      new_data: {
        action: 'invoice_created',
        source: 'manual',
        number: inv.sequenceNumber,
        org_id: inv.orgId,
        total_paise: inv.totalPaise,
        resolved_paise: inv.resolvedPaise,
        amount_reason: inv.amountReason,
        overridden: inv.overridden,
        due_date: inv.dueDate,
        status: inv.status,
      },
    });
    return success(res, { invoice: inv }, `Invoice ${inv.number} created.`, 201);
  } catch (err) { return fail(res, req, err, 'create'); }
};

// POST /api/owner/invoices/import — record an invoice already issued elsewhere.
exports.import = async (req, res) => {
  try {
    const inv = await svc.importInvoice(req.body || {}, actorOf(req));
    await audit(req, 'BILLING', 'client_invoice', inv.id, {
      old_data: { existed: false },
      new_data: {
        action: 'invoice_imported',
        source: 'imported',
        original_number: inv.number,
        stored_number: inv.sequenceNumber,
        // The claim this whole design rests on, written into the audit trail so it can
        // be verified later without reading the code.
        consumed_wiswits_sequence: false,
        org_id: inv.orgId,
        total_paise: inv.totalPaise,
        received_paise: inv.receivedPaise,
        status: inv.status,
        has_attachment: !!inv.attachment,
      },
    });
    return success(res, { invoice: inv }, `Invoice ${inv.number} imported.`, 201);
  } catch (err) { return fail(res, req, err, 'import'); }
};

// POST /api/owner/invoices/:id/payments — record money against an invoice.
exports.recordPayment = async (req, res) => {
  try {
    const r = await svc.recordPayment(
      { ...(req.body || {}), invoiceId: Number(req.params.id) }, actorOf(req));
    await audit(req, 'BILLING', 'client_invoice', r.invoiceId, {
      old_data: { status: r.before.status, received_paise: r.before.receivedPaise },
      new_data: {
        action: 'payment_recorded',
        number: r.number,
        org_id: r.orgId,
        status: r.after.status,
        received_paise: r.after.receivedPaise,
        outstanding_paise: r.after.outstandingPaise,
        total_paise: r.totalPaise,
        ...r.recorded,
      },
    });
    const inv = await svc.get(r.invoiceId);
    return success(res, { payment: r, invoice: inv },
      r.after.status === 'paid'
        ? `Recorded. Invoice ${r.number} is fully paid.`
        : `Recorded. ${r.after.outstandingDisplay} still outstanding on ${r.number}.`);
  } catch (err) { return fail(res, req, err, 'recordPayment'); }
};
