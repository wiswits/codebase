module.exports = [
  {
    // Institution Blueprints + terminology (Sprint A1/A2).
    // INTENTIONAL prefix≠folder-name: the public surface is /api/institution,
    // the implementation domain is modules/blueprints.
    name: 'blueprints.institution',
    prefix: '/api/institution',
    router: require('./blueprints.routes'),
  },
];
