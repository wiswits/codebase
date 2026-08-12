// NOTE: the Razorpay webhook raw-body capture is NOT here — it is a
// body-parsing rule (app.use('/api/payments/webhook', express.raw(...))
// BEFORE express.json), hand-wired in server.js. Only the domain mount
// lives in the registry.
module.exports = [
  {
    name: 'payments.payments',
    prefix: '/api/payments',
    router: require('./payments.routes'),
  },
  {
    // WisWits charging institutions (subscriptions, invoices, the ₹1 mandate).
    // The OPPOSITE direction to payments.routes above, which is parents paying school
    // fees. Its webhook also needs the raw-body rule in server.js, for the same reason.
    name: 'payments.billing',
    prefix: '/api/billing',
    router: require('./billing.routes'),
  },
  {
    // Owner settings → payment gateway credentials. Platform-only.
    name: 'payments.config',
    prefix: '/api/payment-config',
    router: require('./paymentConfig.routes'),
  },
];
