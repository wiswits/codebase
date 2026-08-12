const express = require('express');
const router  = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { success, error } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const logger = require('../../utils/logger');
const rzp = require('../../services/razorpayService');
const { verifyCapturedPayment, webhookAmountMatches } = require('./payment-integrity');
const { audit } = require('../../utils/audit');
const { encrypt: encSecret } = require('../../services/ai/crypto');
// A gateway refund has to reach the FEE books too, not just the order — see
// the refund route below for the bug that made this necessary.
const feeLedger = require('../../services/feeLedger');

// Finance-only guard for admin/money-moving endpoints.
const FINANCE = ['owner', 'admin', 'principal', 'accountant'];
const notifSvc = require('../../services/notificationService');

// Product policy: students never see or initiate fee payments — parents do.
const denyStudents = (req, res, next) =>
  req.user?.role_slug === 'student'
    ? error(res, 'Payments are not available on the student portal', 403)
    : next();

// ─── Payment config ────────────────────────────────────────────────────────
router.get('/config', authenticate, async (req, res) => {
  try {
    const o = req.user.org_id;
    const cfg = await queryOne('SELECT * FROM client_payment_config WHERE org_id=?', [o]);
    /*
     * `online_visible` decides whether this school is shown the Online Payments
     * surface at all. A gateway in MOCK mode is a testing harness — order
     * counters, a Collect Payment button, and simulated charges — and a paying
     * school must not be handed one (migration 062).
     *
     * live            → visible, it is a real feature
     * mock + enabled  → visible, somebody switched it on deliberately
     * mock otherwise  → hidden
     *
     * Computed HERE rather than in the page, so every surface that asks gets
     * the same answer and a future caller cannot forget the rule.
     */
    if (!cfg) return success(res, { mode: 'mock', razorpay_key_id: null, upi_id: null, online_enabled: null, online_visible: false });
    // Never return secrets to client
    return success(res, {
      mode: cfg.razorpay_mode,
      razorpay_key_id: cfg.razorpay_mode !== 'mock' ? cfg.razorpay_key_id : rzp.KEY_ID,
      upi_id: cfg.upi_id,
      upi_merchant_name: cfg.upi_merchant_name,
      gst_number: cfg.gst_number,
      online_enabled: cfg.online_enabled === null || cfg.online_enabled === undefined ? null : !!cfg.online_enabled,
      online_visible: cfg.razorpay_mode !== 'mock' || !!cfg.online_enabled,
    });
  } catch(e) { return error(res, e.message, 500); }
});

router.put('/config', authenticate, requireRole(...FINANCE), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { razorpay_mode, razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret, upi_id, upi_merchant_name, gst_number, online_enabled } = req.body;
    // Encrypt payment secrets at rest (AES-256-GCM) — same posture as AI keys.
    // A DB dump/backup leak must NOT expose live gateway secrets in plaintext.
    // NOTE: any future per-org signing MUST decrypt() these before use; runtime
    // signing currently uses the platform env secrets in razorpayService.
    const keySecretEnc = razorpay_key_secret ? encSecret(razorpay_key_secret) : null;
    const webhookSecretEnc = razorpay_webhook_secret ? encSecret(razorpay_webhook_secret) : null;
    await query(
      `INSERT INTO client_payment_config (org_id, razorpay_mode, razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret, upi_id, upi_merchant_name, gst_number, online_enabled)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         razorpay_mode=COALESCE(VALUES(razorpay_mode),razorpay_mode),
         razorpay_key_id=COALESCE(VALUES(razorpay_key_id),razorpay_key_id),
         razorpay_key_secret=COALESCE(VALUES(razorpay_key_secret),razorpay_key_secret),
         razorpay_webhook_secret=COALESCE(VALUES(razorpay_webhook_secret),razorpay_webhook_secret),
         upi_id=COALESCE(VALUES(upi_id),upi_id),
         upi_merchant_name=COALESCE(VALUES(upi_merchant_name),upi_merchant_name),
         gst_number=COALESCE(VALUES(gst_number),gst_number),
         online_enabled=COALESCE(VALUES(online_enabled),online_enabled)`,
      [o, razorpay_mode||null, razorpay_key_id||null, keySecretEnc, webhookSecretEnc, upi_id||null, upi_merchant_name||null, gst_number||null,
        online_enabled === undefined || online_enabled === null ? null : (online_enabled ? 1 : 0)]
    );
    return success(res, {}, 'Config saved');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── List orders (admin) ────────────────────────────────────────────────
router.get('/orders', authenticate, requireRole(...FINANCE), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { status, limit=50 } = req.query;
    let where = 'WHERE po.org_id=?';
    const p = [o];
    if (status) { where += ' AND po.status=?'; p.push(status); }

    const rows = await query(
      `SELECT po.*,
        CONCAT(su.first_name,' ',COALESCE(su.last_name,'')) AS student_name,
        s.admission_number,
        CONCAT(pu.first_name,' ',COALESCE(pu.last_name,'')) AS payer_name
       FROM client_payment_orders po
       LEFT JOIN client_students s ON s.id=po.student_id
       LEFT JOIN client_users su ON su.id=s.user_id
       LEFT JOIN client_users pu ON pu.id=po.payer_user_id
       ${where}
       ORDER BY po.created_at DESC
       LIMIT ?`,
      [...p, parseInt(limit)]
    );
    return success(res, { orders: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Parent: list their own fee orders ─────────────────────────────────
router.get('/my-orders', authenticate, denyStudents, async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;

    // Find student(s) this user is authorized to see
    let studentIds = [];
    // Is this user a student?
    const selfStudent = await queryOne('SELECT id FROM client_students WHERE org_id=? AND user_id=?', [o, uid]);
    if (selfStudent) studentIds.push(selfStudent.id);
    // Is this user a parent?
    const parentRow = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [o, uid]);
    if (parentRow) {
      const links = await query('SELECT student_id FROM client_parent_students WHERE org_id=? AND parent_id=? AND COALESCE(status,\'active\')=\'active\'', [o, parentRow.id]);
      links.forEach(l => studentIds.push(l.student_id));
    }

    if (studentIds.length === 0) return success(res, { orders: [] });

    const placeholders = studentIds.map(()=>'?').join(',');
    const rows = await query(
      `SELECT po.*,
        CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS student_name,
        s.admission_number
       FROM client_payment_orders po
       JOIN client_students s ON s.id=po.student_id
       JOIN client_users u ON u.id=s.user_id
       WHERE po.org_id=? AND po.student_id IN (${placeholders})
       ORDER BY po.created_at DESC LIMIT 50`,
      [o, ...studentIds]
    );
    return success(res, { orders: rows });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── CREATE ORDER (called from frontend when parent clicks Pay) ────────────
router.post('/create-order', authenticate, denyStudents, async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const { student_id, fee_assignment_id, amount, description } = req.body;

    if (!student_id || !amount || amount <= 0) return error(res, 'student_id and amount required', 400);

    // Determine payer type
    let payerType = 'admin';
    const selfStudent = await queryOne('SELECT id FROM client_students WHERE org_id=? AND user_id=?', [o, uid]);
    if (selfStudent && selfStudent.id === parseInt(student_id)) payerType = 'student';
    const parentRow = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [o, uid]);
    if (parentRow) {
      const link = await queryOne('SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parentRow.id, student_id]);
      if (link) payerType = 'parent';
    }

    // Ownership: only the student themselves, a linked parent, or finance staff
    // may create a payment order for a student. Blocks paying against arbitrary students.
    if (payerType === 'admin') {
      const staff = await queryOne(
        `SELECT 1 FROM client_user_roles ur JOIN client_roles r ON r.id = ur.role_id
         WHERE ur.user_id = ? AND r.base_role IN ('owner','admin','principal','accountant') LIMIT 1`,
        [uid]
      );
      if (!staff) return error(res, 'Not authorized to pay for this student', 403);
    }

    // Amount integrity: when tied to a fee assignment, the amount cannot exceed the
    // server-computed outstanding balance (client amount is not trusted).
    if (fee_assignment_id) {
      const fa = await queryOne(
        'SELECT final_amount FROM client_fee_assignments WHERE id=? AND org_id=? AND student_id=?',
        [fee_assignment_id, o, student_id]
      );
      if (!fa) return error(res, 'Invalid fee assignment for this student', 400);
      const paidRow = await queryOne(
        `SELECT COALESCE(SUM(amount),0) AS paid FROM client_fee_payments
         WHERE fee_assignment_id=? AND org_id=? AND status='completed'`,
        [fee_assignment_id, o]
      );
      const outstanding = Number(fa.final_amount) - Number(paidRow.paid);
      if (Number(amount) > outstanding + 0.5) {
        return error(res, 'Amount exceeds outstanding balance', 400);
      }
    }

    // Create internal order first
    const receiptRef = `RCP-${Date.now()}-${Math.random().toString(36).substring(2,5).toUpperCase()}`;
    const insertR = await query(
      `INSERT INTO client_payment_orders
         (org_id, student_id, payer_user_id, payer_type, fee_assignment_id, amount, description, status, expires_at)
       VALUES (?,?,?,?,?,?,?,'created',DATE_ADD(NOW(),INTERVAL 15 MINUTE))`,
      [o, student_id, uid, payerType, fee_assignment_id||null, amount, description||'Fee payment']
    );
    const internalId = insertR.insertId;

    // Hit Razorpay (or mock)
    let rzpOrder;
    try {
      rzpOrder = await rzp.createOrder({
        amount: parseFloat(amount),
        currency: 'INR',
        receipt: receiptRef,
        notes: {
          internal_order_id: internalId.toString(),
          student_id: student_id.toString(),
          org_id: o.toString(),
        },
      });
    } catch(rzpErr) {
      logger.error('Razorpay order creation failed:', rzpErr);
      await query('UPDATE client_payment_orders SET status="failed", error_description=? WHERE id=? AND org_id=?', [rzpErr.message, internalId, o]);
      return error(res, 'Could not create payment order: ' + rzpErr.message, 500);
    }

    // Update with Razorpay refs
    await query(
      `UPDATE client_payment_orders SET razorpay_order_id=?, razorpay_key_id=? WHERE id=? AND org_id=?`,
      [rzpOrder.id, rzp.KEY_ID, internalId, o]
    );

    // Log transaction
    await query(
      `INSERT INTO client_payment_transactions
        (org_id, payment_order_id, event_type, event_source, razorpay_order_id, status_before, status_after, response_data)
       VALUES (?,?,?,?,?,?,?,?)`,
      [o, internalId, 'order_created', 'api', rzpOrder.id, null, 'created', JSON.stringify(rzpOrder)]
    );

    return success(res, {
      internal_order_id: internalId,
      razorpay_order_id: rzpOrder.id,
      razorpay_key_id: rzp.KEY_ID,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      is_mock: rzp.MODE === 'mock',
      mode: rzp.MODE,
    }, 'Order created');
  } catch(e) { logger.error('Create order:',e); return error(res, e.message, 500); }
});

// ─── VERIFY PAYMENT (callback after frontend checkout completes) ───────────
router.post('/verify', authenticate, denyStudents, async (req, res) => {
  try {
    const o = req.user.org_id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = req.body;

    const order = await queryOne(
      'SELECT * FROM client_payment_orders WHERE id=? AND org_id=? AND razorpay_order_id=?',
      [internal_order_id, o, razorpay_order_id]
    );
    if (!order) return error(res, 'Order not found', 404);

    // IDEMPOTENCY: this order was already paid — return the existing receipt
    // instead of inserting another fee payment. Without this, a parent could
    // replay the (genuine) signature N times and wipe the whole fee balance.
    if (order.status === 'paid') {
      return success(res, {
        success: true, already_recorded: true,
        payment_id: order.razorpay_payment_id,
        receipt_number: order.receipt_number,
        fee_payment_id: order.fee_payment_id,
      }, 'Payment already recorded');
    }

    // Verify signature
    const valid = rzp.verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    // Log transaction
    await query(
      `INSERT INTO client_payment_transactions
        (org_id, payment_order_id, event_type, event_source, razorpay_order_id, razorpay_payment_id, status_before, status_after, signature_valid, raw_payload)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [o, internal_order_id, 'verify_attempt', 'callback', razorpay_order_id, razorpay_payment_id, order.status, valid?'paid':'failed', valid?1:0, JSON.stringify(req.body)]
    );

    if (!valid) {
      await query('UPDATE client_payment_orders SET status="failed", error_code="SIGNATURE_INVALID" WHERE id=? AND org_id=?', [internal_order_id, o]);
      return error(res, 'Signature verification failed', 400);
    }

    // Confirm the actual captured payment matches this order (amount, currency,
    // status) directly with the gateway — a valid signature alone does not bind
    // the amount. Skipped only in mock mode.
    if (rzp.MODE !== 'mock') {
      try {
        const captured = await rzp.fetchPayment(razorpay_payment_id);
        const check = verifyCapturedPayment(captured, order);
        if (!check.ok) {
          await query('UPDATE client_payment_orders SET status="failed", error_code=? WHERE id=? AND org_id=?', [check.reason, internal_order_id, o]);
          return error(res, 'Payment could not be confirmed (amount/status mismatch)', 400);
        }
      } catch (e) {
        logger.error('fetchPayment failed during verify:', e);
        return error(res, 'Could not confirm payment with gateway', 502);
      }
    }

    // Mark paid, create fee_payment record, generate receipt
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(internal_order_id).padStart(5,'0')}`;
    
    // Auto-pick fee_assignment if missing
    let assignmentId = order.fee_assignment_id;
    if (!assignmentId) {
      const open = await queryOne(
        `SELECT id FROM client_fee_assignments WHERE student_id=? AND org_id=? ORDER BY id DESC LIMIT 1`,
        [order.student_id, o]
      );
      assignmentId = open?.id || null;
    }

    // Insert into client_fee_payments + mark order paid ATOMICALLY —
    // a mid-sequence failure must not leave a payment without its order flip.
    const feeR = await transaction(async (conn) => {
      // Atomically CLAIM the order: only the first caller flips it to paid. A
      // concurrent replay / webhook racing on status='created' gets 0 rows and
      // does NOT insert a second fee payment. This is the race-safe root fix.
      const [claim] = await conn.execute(
        `UPDATE client_payment_orders SET status='paid', razorpay_payment_id=?, receipt_number=?, completed_at=NOW()
          WHERE id=? AND status<>'paid'`,
        [razorpay_payment_id, receiptNumber, internal_order_id]
      );
      if (claim.affectedRows === 0) return null; // already paid by a concurrent request
      const [ins] = await conn.execute(
        `INSERT INTO client_fee_payments
           (org_id, student_id, fee_assignment_id, amount, payment_mode, transaction_id, receipt_number, collected_by, notes, payment_date, status)
         VALUES (?,?,?,?,'online',?,?,?,?,CURDATE(),'completed')`,
        [o, order.student_id, assignmentId, order.amount, razorpay_payment_id, receiptNumber, req.user.user_id, `Razorpay: ${razorpay_payment_id}`]
      );
      await conn.execute(`UPDATE client_payment_orders SET fee_payment_id=? WHERE id=? AND org_id=?`, [ins.insertId, internal_order_id, o]);
      return ins;
    });

    if (!feeR) {
      // a concurrent verify/webhook already recorded it — return that receipt
      const paid = await queryOne('SELECT razorpay_payment_id, receipt_number, fee_payment_id FROM client_payment_orders WHERE id=? AND org_id=?', [internal_order_id, o]);
      return success(res, { success: true, already_recorded: true, payment_id: paid?.razorpay_payment_id, receipt_number: paid?.receipt_number, fee_payment_id: paid?.fee_payment_id }, 'Payment already recorded');
    }

    await audit(req, 'BILLING', 'payment_order', internal_order_id, { new_data: { event: 'verify', payment_id: razorpay_payment_id, amount: order.amount, receipt_number: receiptNumber, fee_payment_id: feeR.insertId } });

    // Notify parents
    try {
      await notifSvc.sendToParentsOfStudent(o, order.student_id, {
        type: 'fee_payment',
        title: `Payment received: ₹${parseFloat(order.amount).toLocaleString('en-IN')}`,
        body: `Receipt: ${receiptNumber}. Thank you.`,
        action_url: `/receipt/${feeR.insertId}`,
        icon: 'CheckCircle2',
        priority: 'normal',
      });
    } catch {}

    return success(res, {
      success: true,
      payment_id: razorpay_payment_id,
      receipt_number: receiptNumber,
      fee_payment_id: feeR.insertId,
    }, 'Payment verified and recorded');
  } catch(e) { logger.error('Verify payment:',e); return error(res, e.message, 500); }
});

// ─── MOCK: Simulate a successful payment (dev/pilot only) ──────────────────
router.post('/mock-complete/:internal_order_id', authenticate, async (req, res) => {
  try {
    if (rzp.MODE !== 'mock') return error(res, 'Only available in mock mode', 400);
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const order = await queryOne('SELECT * FROM client_payment_orders WHERE id=? AND org_id=?', [req.params.internal_order_id, o]);
    if (!order) return error(res, 'Order not found', 404);
    // Authorization: finance staff OR the payer of THIS order (so a parent can
    // simulate paying their OWN order in a pilot/mock-mode school — was FINANCE-
    // only, which 403'd the parent and made fee payment impossible in mock mode).
    const isStaff = await queryOne(
      `SELECT 1 FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id
       WHERE ur.user_id=? AND r.base_role IN ('owner','admin','principal','accountant') LIMIT 1`, [uid]);
    if (!isStaff && order.payer_user_id !== uid) return error(res, 'Not authorized for this order', 403);

    const mockPaymentId = rzp.generateMockPaymentId();
    const mockSig = rzp.generateMockSignature(order.razorpay_order_id, mockPaymentId);

    // Call verify endpoint internally
    req.body = {
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: mockSig,
      internal_order_id: order.id,
    };
    // Re-run verify logic
    const valid = rzp.verifyPaymentSignature({
      order_id: order.razorpay_order_id,
      payment_id: mockPaymentId,
      signature: mockSig,
    });
    if (!valid) return error(res, 'Mock signature failed (impossible)', 500);

    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(order.id).padStart(5,'0')}`;

    // Auto-pick a fee_assignment if order doesn't have one
    let assignmentId = order.fee_assignment_id;
    if (!assignmentId) {
      const open = await queryOne(
        `SELECT id FROM client_fee_assignments WHERE student_id=? AND org_id=? ORDER BY id DESC LIMIT 1`,
        [order.student_id, o]
      );
      assignmentId = open?.id || null;
    }

    // Atomic: fee payment + order flip + audit trail commit together or not at all
    const feeR = await transaction(async (conn) => {
      const [ins] = await conn.execute(
        `INSERT INTO client_fee_payments
          (org_id, student_id, fee_assignment_id, amount, payment_mode, transaction_id, receipt_number, collected_by, notes, payment_date, status)
         VALUES (?,?,?,?,'online',?,?,?,?,CURDATE(),'completed')`,
        [o, order.student_id, assignmentId, order.amount, mockPaymentId, receiptNumber, req.user.user_id, `MOCK Razorpay: ${mockPaymentId}`]
      );
      await conn.execute(
        `UPDATE client_payment_orders SET status='paid', razorpay_payment_id=?, fee_payment_id=?, receipt_number=?, method='upi', completed_at=NOW() WHERE id=? AND org_id=?`,
        [mockPaymentId, ins.insertId, receiptNumber, order.id, o]
      );
      await conn.execute(
        `INSERT INTO client_payment_transactions (org_id, payment_order_id, event_type, event_source, razorpay_payment_id, status_before, status_after, signature_valid, response_data)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [o, order.id, 'mock_complete', 'manual', mockPaymentId, order.status, 'paid', 1, JSON.stringify({ mock:true })]
      );
      return ins;
    });

    await audit(req, 'BILLING', 'payment_order', order.id, { new_data: { event: 'mock_complete', payment_id: mockPaymentId, amount: order.amount, receipt_number: receiptNumber, fee_payment_id: feeR.insertId } });

    try {
      await notifSvc.sendToParentsOfStudent(o, order.student_id, {
        type: 'fee_payment',
        title: `Payment received: ₹${parseFloat(order.amount).toLocaleString('en-IN')}`,
        body: `Receipt: ${receiptNumber}. Thank you.`,
        action_url: `/receipt/${feeR.insertId}`,
        icon: 'CheckCircle2',
      });
    } catch {}

    return success(res, {
      mocked: true,
      payment_id: mockPaymentId,
      receipt_number: receiptNumber,
      fee_payment_id: feeR.insertId,
    }, 'Mock payment completed');
  } catch(e) { logger.error('Mock complete:',e); return error(res, e.message, 500); }
});

// ─── WEBHOOK (called by Razorpay directly) — NO AUTH, signature-based ───────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body.toString ? req.body.toString() : JSON.stringify(req.body);
    
    const valid = rzp.verifyWebhookSignature(rawBody, signature);
    
    let payload;
    try { payload = JSON.parse(rawBody); } catch { payload = {}; }

    const eventId    = payload?.id || null;
    const rzpOrderId = payload?.payload?.payment?.entity?.order_id || null;
    const rzpPayId   = payload?.payload?.payment?.entity?.id || null;

    // Resolve the owning org from the matched order — never default to org 1.
    const matchedOrder = rzpOrderId
      ? await queryOne('SELECT * FROM client_payment_orders WHERE razorpay_order_id=?', [rzpOrderId])
      : null;

    // Replay protection: if this event id was already recorded, ack and stop.
    const dup = (valid && eventId)
      ? await queryOne('SELECT id FROM client_payment_transactions WHERE razorpay_event_id=? LIMIT 1', [eventId])
      : null;

    // Always log the webhook hit, valid or not
    await query(
      `INSERT INTO client_payment_transactions
        (org_id, event_type, event_source, razorpay_event_id, razorpay_payment_id, razorpay_order_id, signature_valid, raw_payload)
       VALUES (?,?,?,?,?,?,?,?)`,
      [matchedOrder?.org_id || null,
       payload?.event || 'webhook.unknown', 'webhook',
       eventId, rzpPayId, rzpOrderId,
       valid?1:0, rawBody.substring(0, 5000)]
    );

    if (!valid) return res.status(400).json({ error: 'Invalid signature' });
    if (dup) return res.status(200).json({ received: true, duplicate: true });

    // Handle payment.captured event
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      if (paymentEntity?.order_id) {
        const order = await queryOne('SELECT * FROM client_payment_orders WHERE razorpay_order_id=?', [paymentEntity.order_id]);
        if (order && order.status !== 'paid') {
          // Reconcile only if the captured amount matches the order amount.
          if (!webhookAmountMatches(paymentEntity.amount, order.amount)) {
            await query('UPDATE client_payment_orders SET error_code="AMOUNT_MISMATCH" WHERE id=? AND org_id=?', [order.id, order.org_id]);
            return res.status(200).json({ received: true, mismatch: true });
          }
          const receiptNumber = `RCP-${new Date().getFullYear()}-${String(order.id).padStart(5,'0')}`;
          let webhookAssignmentId = order.fee_assignment_id;
          if (!webhookAssignmentId) {
            const open = await queryOne('SELECT id FROM client_fee_assignments WHERE student_id=? AND org_id=? ORDER BY id DESC LIMIT 1', [order.student_id, order.org_id]);
            webhookAssignmentId = open?.id || null;
          }
          // Atomic reconcile: fee payment + order flip commit together
          const feeR = await transaction(async (conn) => {
            const [ins] = await conn.execute(
              `INSERT INTO client_fee_payments
                (org_id, student_id, fee_assignment_id, amount, payment_mode, transaction_id, receipt_number, notes, payment_date, status)
               VALUES (?,?,?,?,'online',?,?,?,CURDATE(),'completed')`,
              [order.org_id, order.student_id, webhookAssignmentId, order.amount, paymentEntity.id, receiptNumber, `Razorpay webhook: ${paymentEntity.id}`]
            );
            await conn.execute(
              `UPDATE client_payment_orders SET status='paid', razorpay_payment_id=?, fee_payment_id=?, receipt_number=?, method=?, completed_at=NOW() WHERE id=? AND org_id=?`,
              [paymentEntity.id, ins.insertId, receiptNumber, paymentEntity.method||'unknown', order.id, order.org_id]
            );
            return ins;
          });
          // Webhook has no req.user — attribute to the order's payer if known.
          await query('INSERT INTO client_audit_logs (org_id, user_id, action, entity_type, entity_id) VALUES (?,?,?,?,?)',
            [order.org_id, order.payer_user_id || null, 'PAYMENT_CONFIRMED', 'fee_payment', feeR.insertId]).catch(() => {});

          // Notify parents — the webhook is the ONLY path that runs when the
          // payer's browser never comes back (tab closed, network dropped, UPI
          // app switch that loses the callback). Razorpay still captures the
          // money and this handler still books it, so without this the family
          // has paid, the school has the receipt, and the parent is told
          // nothing. Every other success path already sends this; the webhook
          // was the one that did not.
          try {
            await notifSvc.sendToParentsOfStudent(order.org_id, order.student_id, {
              type: 'fee_payment',
              title: `Payment received: ₹${parseFloat(order.amount).toLocaleString('en-IN')}`,
              body: `Receipt: ${receiptNumber}. Thank you.`,
              action_url: `/receipt/${feeR.insertId}`,
              icon: 'CheckCircle2',
              priority: 'normal',
            });
          } catch (e) { logger.warn('Webhook parent notification failed:', e.message); }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch(e) { logger.error('Webhook:',e); return res.status(500).json({ error: e.message }); }
});

// ─── Refund ────────────────────────────────────────────────────────────────
router.post('/orders/:id/refund', authenticate, requireRole(...FINANCE), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { amount, reason } = req.body;
    const order = await queryOne('SELECT * FROM client_payment_orders WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!order) return error(res, 'Order not found', 404);
    if (order.status !== 'paid') return error(res, 'Only paid orders can be refunded', 400);

    const refundAmount = parseFloat(amount) || parseFloat(order.amount);
    // never refund more than was captured
    if (!(refundAmount > 0)) return error(res, 'Invalid refund amount', 400);
    if (refundAmount > parseFloat(order.amount) + 0.01) return error(res, `Refund cannot exceed the captured amount of ₹${parseFloat(order.amount).toFixed(2)}`, 400);
    const rzpRefund = await rzp.refund(order.razorpay_payment_id, { amount: refundAmount, reason });

    const r = await query(
      `INSERT INTO client_payment_refunds (org_id, payment_order_id, amount, razorpay_refund_id, reason, status, initiated_by, processed_at)
       VALUES (?,?,?,?,?,?,?, NOW())`,
      [o, order.id, refundAmount, rzpRefund.id, reason||null, rzpRefund.status || 'processed', req.user.user_id]
    );

    await query('UPDATE client_payment_orders SET status="refunded" WHERE id=? AND org_id=?', [order.id, o]);

    // ── The half that was missing, and it was the half that mattered ────────
    // This route called Razorpay, wrote client_payment_refunds and flipped the
    // ORDER's status — and never touched the `client_fee_payments` row the
    // order had created. So the money left the school's bank and every screen
    // in the product went on counting it as collected: the dashboard totals,
    // the day book, the collection rate, the student's own "paid so far", and
    // the defaulter list that should have had them back on it. The family read
    // as paid up for a fee they had been refunded.
    //
    // Marking the fee payment is all that is needed now, because every fee sum
    // in the product filters on `status='completed'` (services/feeLedger.js) —
    // one UPDATE puts every surface right at once.
    //
    // A PARTIAL refund is not expressible on the fee row (there is one amount,
    // not a refunded_amount), so only a full refund reverses it; a partial one
    // is recorded against the order and left for a human, rather than silently
    // writing off the whole receipt. Better to under-claim than to zero a fee
    // the school only partly returned.
    if (order.fee_payment_id && refundAmount >= parseFloat(order.amount) - 0.01) {
      await query(
        `UPDATE client_fee_payments
            SET status='refunded', reversal_reason=?, reversed_at=NOW(), reversed_by=?
          WHERE id=? AND org_id=? AND status='completed'`,
        [`Gateway refund${reason ? `: ${reason}` : ''}`.slice(0, 255), req.user.user_id, order.fee_payment_id, o]);
      // The student's dues have moved — put their assignment statuses right.
      const fp = await queryOne('SELECT student_id FROM client_fee_payments WHERE id=? AND org_id=?',
        [order.fee_payment_id, o]).catch(() => null);
      if (fp) await feeLedger.recomputeStudentStatuses(o, fp.student_id);
      await audit(req, 'FEE_PAYMENT_REVERSE', 'fee_payment', order.fee_payment_id, {
        old_data: { status: 'completed' },
        new_data: { status: 'refunded', amount: refundAmount, via: 'gateway', order_id: order.id },
      });
    }

    return success(res, {
      refund_id: r.insertId,
      razorpay_refund_id: rzpRefund.id,
      fee_payment_reversed: Boolean(order.fee_payment_id && refundAmount >= parseFloat(order.amount) - 0.01),
      mocked: rzp.MODE === 'mock',
    }, 'Refund initiated');
  } catch(e) { logger.error('Refund:',e); return error(res, e.message, 500); }
});

// ─── UPI QR intent (works without any gateway) ─────────────────────────────
router.post('/upi-intent', authenticate, denyStudents, async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const { student_id, amount, note, fee_assignment_id } = req.body;
    if (!student_id || !amount || amount <= 0) return error(res, 'student_id and amount required', 400);

    // SAME GUARDS AS /create-order (this path had NONE — a parent could raise a
    // UPI order against a non-linked / foreign-org child, corrupting their ledger
    // when an admin later confirmed it):
    // 1) student belongs to org  2) caller is a LINKED parent or finance staff
    // 3) amount capped to outstanding when tied to a fee assignment.
    const stu = await queryOne('SELECT id FROM client_students WHERE id=? AND org_id=?', [student_id, o]);
    if (!stu) return error(res, 'Student not found', 404);
    const isStaff = await queryOne(
      `SELECT 1 FROM client_user_roles ur JOIN client_roles r ON r.id=ur.role_id
       WHERE ur.user_id=? AND r.base_role IN ('owner','admin','principal','accountant') LIMIT 1`, [uid]);
    if (!isStaff) {
      const parentRow = await queryOne('SELECT id FROM client_parents WHERE org_id=? AND user_id=?', [o, uid]);
      const link = parentRow && await queryOne(
        'SELECT 1 FROM client_parent_students WHERE parent_id=? AND student_id=? AND COALESCE(status,\'active\')=\'active\'', [parentRow.id, student_id]);
      if (!link) return error(res, 'Not authorized to pay for this student', 403);
    }
    if (fee_assignment_id) {
      const fa = await queryOne('SELECT final_amount FROM client_fee_assignments WHERE id=? AND org_id=? AND student_id=?', [fee_assignment_id, o, student_id]);
      if (!fa) return error(res, 'Invalid fee assignment for this student', 400);
      const paidRow = await queryOne("SELECT COALESCE(SUM(amount),0) AS paid FROM client_fee_payments WHERE fee_assignment_id=? AND org_id=? AND status='completed'", [fee_assignment_id, o]);
      if (Number(amount) > (Number(fa.final_amount) - Number(paidRow.paid)) + 0.5) return error(res, 'Amount exceeds outstanding balance', 400);
    }

    const cfg = await queryOne('SELECT upi_id, upi_merchant_name FROM client_payment_config WHERE org_id=?', [o]);
    if (!cfg || !cfg.upi_id) return error(res, 'UPI ID not configured for this org', 400);

    const txnRef = `UPI${Date.now()}${Math.random().toString(36).substring(2,5).toUpperCase()}`;
    
    // Log as a payment order (will stay in 'created' until admin confirms)
    const insertR = await query(
      `INSERT INTO client_payment_orders (org_id, student_id, payer_user_id, payer_type, fee_assignment_id, amount, description, status, meta)
       VALUES (?,?,?,?,?,?,?,'created',?)`,
      [o, student_id, req.user.user_id, 'parent', fee_assignment_id||null, amount, note||'UPI payment', JSON.stringify({ type:'upi_direct', txnRef })]
    );

    const intent = rzp.generateUpiIntent({
      upi_id: cfg.upi_id,
      merchant_name: cfg.upi_merchant_name || 'School',
      amount: parseFloat(amount),
      note: `Fees ${note||''}`.trim(),
      transaction_ref: txnRef,
    });

    return success(res, {
      internal_order_id: insertR.insertId,
      upi_intent: intent,
      upi_id: cfg.upi_id,
      merchant_name: cfg.upi_merchant_name,
      amount,
      txn_ref: txnRef,
      note: 'After paying, admin will verify and mark as paid',
    });
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Admin: confirm UPI payment manually ───────────────────────────────────
router.post('/orders/:id/manual-confirm', authenticate, requireRole(...FINANCE), async (req, res) => {
  try {
    const o = req.user.org_id;
    const { transaction_ref, notes } = req.body;
    const order = await queryOne('SELECT * FROM client_payment_orders WHERE id=? AND org_id=?', [req.params.id, o]);
    if (!order) return error(res, 'Order not found', 404);
    if (order.status === 'paid') return error(res, 'Already paid', 400);

    // RACE GUARD: atomically claim the order before recording the fee payment.
    // Two concurrent confirms used to both read 'created' and both insert a
    // fee_payment (double collection). The conditional UPDATE lets only one win.
    const claim = await query(
      "UPDATE client_payment_orders SET status='paid', method='upi', completed_at=NOW() WHERE id=? AND org_id=? AND status<>'paid'",
      [order.id, o]);
    if (!claim.affectedRows) return error(res, 'Already paid', 400);

    let manualAssignmentId = order.fee_assignment_id;
    if (!manualAssignmentId) {
      const open = await queryOne('SELECT id FROM client_fee_assignments WHERE student_id=? AND org_id=? ORDER BY id DESC LIMIT 1', [order.student_id, o]);
      manualAssignmentId = open?.id || null;
    }
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(order.id).padStart(5,'0')}`;
    const feeR = await query(
      `INSERT INTO client_fee_payments
        (org_id, student_id, fee_assignment_id, amount, payment_mode, transaction_id, receipt_number, collected_by, notes, payment_date, status)
       VALUES (?,?,?,?,'online',?,?,?,?,CURDATE(),'completed')`,
      [o, order.student_id, manualAssignmentId, order.amount, transaction_ref||'manual', receiptNumber, req.user.user_id, notes || `Manual UPI confirmation`]
    );

    await query(
      `UPDATE client_payment_orders SET status='paid', razorpay_payment_id=?, fee_payment_id=?, receipt_number=?, method='upi', completed_at=NOW() WHERE id=? AND org_id=?`,
      [transaction_ref||'manual', feeR.insertId, receiptNumber, order.id, o]
    );

    await audit(req, 'BILLING', 'payment_order', order.id, { new_data: { event: 'manual_confirm', transaction_ref: transaction_ref||'manual', amount: order.amount, receipt_number: receiptNumber, fee_payment_id: feeR.insertId } });

    try {
      await notifSvc.sendToParentsOfStudent(o, order.student_id, {
        type: 'fee_payment',
        title: `Payment received: ₹${parseFloat(order.amount).toLocaleString('en-IN')}`,
        body: `Receipt: ${receiptNumber}. Thank you.`,
        action_url: `/receipt/${feeR.insertId}`,
        icon: 'CheckCircle2',
      });
    } catch {}

    return success(res, { receipt_number: receiptNumber, fee_payment_id: feeR.insertId }, 'Payment confirmed');
  } catch(e) { return error(res, e.message, 500); }
});

// ─── Stats ────────────────────────────────────────────────────────────────
router.get('/stats', authenticate, requireRole(...FINANCE), async (req, res) => {
  try {
    const o = req.user.org_id;
    const row = await queryOne(
      `SELECT
        COUNT(*) AS total,
        SUM(status='paid') AS paid,
        SUM(status='created') AS pending,
        SUM(status='failed') AS failed,
        SUM(status='refunded') AS refunded,
        SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) AS total_paid_amount,
        SUM(CASE WHEN DATE(completed_at)=CURDATE() AND status='paid' THEN amount ELSE 0 END) AS collected_today
       FROM client_payment_orders WHERE org_id=?`, [o]
    );
    return success(res, row);
  } catch(e) { return error(res, e.message, 500); }
});

module.exports = router;
