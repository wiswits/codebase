// Quiz Portal — four sub-prefix surfaces under /api/quiz-portal/*.
// NOTE: 'attempts' (plural prefix) is served by attempt.routes.js (singular
// file name) — intentional, matches the original hand-wiring.
module.exports = [
  {
    name: 'quiz-portal.bank',
    prefix: '/api/quiz-portal/bank',
    router: require('./bank.routes'),
  },
  {
    name: 'quiz-portal.assessment',
    prefix: '/api/quiz-portal/assessment',
    router: require('./assessment.routes'),
  },
  {
    name: 'quiz-portal.attempts',
    prefix: '/api/quiz-portal/attempts',
    router: require('./attempt.routes'),
  },
  {
    name: 'quiz-portal.analytics',
    prefix: '/api/quiz-portal/analytics',
    router: require('./analytics.routes'),
  },
];
