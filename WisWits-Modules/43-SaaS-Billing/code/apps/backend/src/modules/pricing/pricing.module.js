// The pricing control plane — platform-owner writes plus one read-only customer view.
// Distinct from `plans.plans`, which is the legacy DISPLAY catalog (pricing_plans).
module.exports = [
  {
    name: 'pricing.pricing',
    prefix: '/api/pricing',
    router: require('./pricing.routes'),
  },
];
