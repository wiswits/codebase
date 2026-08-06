module.exports = [
  {
    // The subscription feed. MUST be registered before 'calendar.calendar':
    // Express matches mounts in registration order, and /api/calendar opens
    // with authenticate() — which would swallow the unauthenticated .ics URL
    // a Google or Apple Calendar client fetches. Same rule, same reason, as
    // certificates.certmgmt-public.
    name: 'calendar.feed',
    prefix: '/api/calendar/feed',
    router: require('./feed.routes'),
  },
  {
    name: 'calendar.calendar',
    prefix: '/api/calendar',
    router: require('./calendar.routes'),
  },
];
