// Platform-owner surface (subscription plans) — distinct from tenant modules.
module.exports = [
  {
    name: 'plans.plans',
    prefix: '/api/plans',
    router: require('./plans.routes'),
  },
];
