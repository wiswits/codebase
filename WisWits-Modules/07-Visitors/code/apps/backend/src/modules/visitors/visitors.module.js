'use strict';
// Visitor Management module — registry descriptor.
// Ported from EduSuite (intern build) via the module intake pipeline (docs/pipeline/).
module.exports = [
  {
    name: 'visitors.visitors',
    prefix: '/api/visitors',
    router: require('./visitors.routes'),
  },
];
