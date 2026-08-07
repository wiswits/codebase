// Org domain — org.routes (routes stage) + manifest.route (preLimiter stage).
// NOTE: GET /api/org/ error-swallow is a deliberate standing flag — preserved
// as-is inside org.routes.js (see its comment), not this migration's concern.
module.exports = [
  {
    // The manifest must be reachable even when a client is rate-limited:
    // it mounts BEFORE the general limiter (preLimiter stage) — that special
    // ordering is its entire reason to exist as a separate route file.
    name: 'org.manifest',
    prefix: '/api',
    router: require('./manifest.route'),
    stage: 'preLimiter',
  },
  {
    name: 'org.org',
    prefix: '/api/org',
    router: require('./org.routes'),
  },
];
