module.exports = [
  {
    // F2 — dashboard widgets API (PLATFORM_STANDARDS §9).
    // INTENTIONAL versioned prefix: /api/v1/widgets is the only versioned
    // prefix in the app (per PLATFORM_STANDARDS) — do NOT "normalize" it
    // to /api/widgets.
    name: 'widgets.widgets',
    prefix: '/api/v1/widgets',
    router: require('./widgets.routes'),
  },
];
