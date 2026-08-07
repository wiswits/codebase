// HRMS domain — leaves is the only mounted surface today (nested folder).
module.exports = [
  {
    name: 'hrms.leaves',
    prefix: '/api/leaves',
    router: require('./leaves/leaves.routes'),
  },
];
