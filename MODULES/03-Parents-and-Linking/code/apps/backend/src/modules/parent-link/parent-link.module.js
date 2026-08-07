module.exports = [
  {
    // Parent Linking. Bare-/api catch mount — tail stage, LAST mount of
    // the app (after lifecycle), matching the original hand-wiring.
    name: 'parent-link.parent-link',
    prefix: '/api',
    router: require('./parent-link.routes'),
    stage: 'tail',
  },
];
