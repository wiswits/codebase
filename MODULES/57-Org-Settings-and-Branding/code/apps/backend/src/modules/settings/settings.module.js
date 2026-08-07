module.exports = [
  {
    // Org settings + branding + logo upload
    name: 'settings.settings',
    prefix: '/api/settings',
    router: require('./settings.routes'),
  },
];
