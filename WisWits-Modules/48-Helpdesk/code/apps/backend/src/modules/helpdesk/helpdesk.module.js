module.exports = [
  {
    // Report-an-Issue helpdesk — the floating widget's API, the school view,
    // and the platform triage inbox (nested under /api/helpdesk/admin).
    // Supersedes the fire-and-forget `support.support` module (§15).
    name: 'helpdesk.helpdesk',
    prefix: '/api/helpdesk',
    router: require('./helpdesk.routes'),
  },
];
