'use strict';
// Admissions — the document checklist and the admission-number series.
// The capabilities EduSuite's Registration Management had that this platform
// lacked, attached to the admissions pipeline we already run (public form ->
// client_leads -> CRM stages -> convert to student) rather than beside it.
// Brought in via the module intake pipeline (docs/pipeline/).
module.exports = [
  {
    name: 'admissions.admissions',
    prefix: '/api/admissions',
    router: require('./admissions.routes'),
  },
];
