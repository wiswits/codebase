// Pure payment-integrity checks — the security-critical money math extracted
// from payments.routes.js so it is unit-testable in isolation.

/**
 * A captured gateway payment binds to our order ONLY if amount (in paise),
 * status and currency all match. A valid signature alone does NOT bind amount.
 * @param {{amount:number|string, status:string, currency?:string}} captured  gateway response
 * @param {{amount:number|string}} order  our internal order (rupees)
 * @returns {{ok:boolean, reason?:string}}
 */
const verifyCapturedPayment = (captured, order) => {
  if (!captured || order == null) return { ok: false, reason: 'MISSING_INPUT' };
  const expectedPaise = Math.round(Number(order.amount) * 100);
  if (!Number.isFinite(expectedPaise) || expectedPaise <= 0) return { ok: false, reason: 'BAD_ORDER_AMOUNT' };
  if (Number(captured.amount) !== expectedPaise) return { ok: false, reason: 'AMOUNT_MISMATCH' };
  if (captured.status !== 'captured') return { ok: false, reason: 'NOT_CAPTURED' };
  if (captured.currency && captured.currency !== 'INR') return { ok: false, reason: 'CURRENCY_MISMATCH' };
  return { ok: true };
};

/**
 * Webhook reconcile guard: the captured amount (paise) must equal the order
 * amount (rupees × 100) before we mark an order paid.
 */
const webhookAmountMatches = (paidPaise, orderRupees) =>
  Number(paidPaise) === Math.round(Number(orderRupees) * 100);

module.exports = { verifyCapturedPayment, webhookAmountMatches };
