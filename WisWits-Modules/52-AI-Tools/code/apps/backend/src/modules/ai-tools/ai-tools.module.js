const { aiRateLimit, sanitizeAiBody } = require('../../middleware/aiGuard');

module.exports = [
  {
    // SUG-0069 P2: AI abuse + prompt-injection guard. Middleware order
    // matters — rate limit first, then body sanitization, then the router.
    name: 'ai-tools.ai-tools',
    prefix: '/api/ai-tools',
    router: require('./aiTools.routes'),
    middleware: [aiRateLimit, sanitizeAiBody],
  },
];
