// Platform-owner surface (WisWits internal) — distinct from tenant modules.
module.exports = [
  {
    name: 'owner.owner',
    prefix: '/api/owner',
    router: require('./owner.routes'),
  },
];
