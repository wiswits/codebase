module.exports = [
  {
    // Question Bank (ADR-011). Prefix is the short public surface /api/qb.
    name: 'qbank.qbank',
    prefix: '/api/qb',
    router: require('./qbank.routes'),
  },
];
