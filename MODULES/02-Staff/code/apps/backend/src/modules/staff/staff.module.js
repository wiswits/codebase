module.exports = [
  {
    // Staff Management (non-teaching logins) — was once left unmounted;
    // the registry's discovered-but-unlisted hard-fail now makes that
    // bug class impossible.
    name: 'staff.staff',
    prefix: '/api/staff',
    router: require('./staff.routes'),
  },
];
