// Dashboard domain descriptors — both surfaces (home since B2, dashboard
// since B8). Their MOUNT_ORDER positions are far apart, matching the
// original hand-wiring.
module.exports = [
  {
    name: 'dashboard.home',
    prefix: '/api/home',
    router: require('./home.routes'),
  },
  {
    name: 'dashboard.dashboard',
    prefix: '/api/dashboard',
    router: require('./dashboard.routes'),
  },
];
