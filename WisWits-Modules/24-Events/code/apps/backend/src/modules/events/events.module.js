'use strict';
// Event Management module — registry descriptor.
// Ported from EduSuite (intern build) via the module intake pipeline (docs/pipeline/).
module.exports = [
  {
    name: 'events.events',
    prefix: '/api/events',
    router: require('./events.routes'),
  },
];
