'use strict';
// Curriculum Intelligence Engine — registry descriptor.
// Decision: ADR-013. Tables: migrations 051-053. Plan: docs/specs/CIE_IMPLEMENTATION_PLAN.md.
//
// Mounted after `curriculum.curriculum`, which it supersedes: that module reads
// platform_curriculum, a table migration 016 created and which was never applied
// on any database (verified against prod and dev, 2026-08-02). It stays mounted
// until its routes have no callers left — mark → migrate → remove, CLAUDE.md §15.
// The builder gets its OWN prefix rather than sharing `/api/cie`, and that is a
// correctness requirement, not tidiness. builder.routes.js applies `platformOnly`
// with `router.use(...)`, which runs for every request entering that router —
// including one that matches none of its routes and was meant for the read API
// below. Mounted on the same prefix it would 403 every school on `GET
// /api/cie/overview` before Express ever reached `cie.cie`.
//
// A separate prefix also keeps `GET /builder/concepts/search` clear of the read
// API's `GET /concepts/:code`, which would otherwise match "search" as a code.
module.exports = [
  {
    name: 'cie.builder',
    prefix: '/api/cie/builder',
    router: require('./builder.routes'),
  },
  {
    name: 'cie.myCurriculum',
    prefix: '/api/cie/my-curriculum',
    router: require('./myCurriculum.routes'),
  },
  // Each of these applies its own guard with `router.use(...)`, which runs for
  // every request that ENTERS the router — so each gets its own prefix for the
  // same reason cie.builder does. Sharing /api/cie would make one router's guard
  // reject requests meant for another.
  {
    name: 'cie.school',
    prefix: '/api/cie/school',
    router: require('./school.routes'),
  },
  {
    name: 'cie.assignments',
    prefix: '/api/cie/assignments',
    router: require('./assignments.routes'),
  },
  {
    name: 'cie.learn',
    prefix: '/api/cie/learn',
    router: require('./learn.routes'),
  },
  {
    name: 'cie.cie',
    prefix: '/api/cie',
    router: require('./cie.routes'),
  },
];
