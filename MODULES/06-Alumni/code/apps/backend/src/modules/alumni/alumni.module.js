'use strict';
// Alumni Directory module — registry descriptor.
// Ported from EduSuite (intern build) via the module intake pipeline (docs/pipeline/).
module.exports = [
  {
    name: 'alumni.alumni',
    prefix: '/api/alumni',
    router: require('./alumni.routes'),
  },
];
