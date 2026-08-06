module.exports = [
  {
    // Public self-registration. The strict 8/15min limiter lives on the WRITER
    // route inside the router (register-org), not on this mount — mounting it
    // here made the wizard's own read-only lookups spend the signup budget, so
    // an honest customer could be told "Too many registration attempts" on
    // their first real attempt. See middleware/rateLimits.js.
    name: 'onboarding.onboarding',
    prefix: '/api/onboarding',
    router: require('./onboarding.routes'),
  },
];
