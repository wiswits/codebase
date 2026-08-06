module.exports = [
  {
    name: 'custom-fields.fields',
    prefix: '/api/fields',
    router: require('./customFields.routes'),
  },
];
