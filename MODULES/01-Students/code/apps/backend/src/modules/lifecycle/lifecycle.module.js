module.exports = [
  {
    // Lifecycle (LEAD->ALUMNI). Bare-/api catch mount: its routes overlap
    // every specific prefix, so it MUST register after all of them —
    // tail stage, first of the two tail mounts (before parent-link).
    name: 'lifecycle.lifecycle',
    prefix: '/api',
    router: require('./lifecycle.routes'),
    stage: 'tail',
  },
];
