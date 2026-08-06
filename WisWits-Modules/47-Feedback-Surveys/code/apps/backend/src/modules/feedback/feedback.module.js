module.exports = [
  {
    // Teacher Feedback v1 (SUG-0009)
    name: 'feedback.feedback',
    prefix: '/api/feedback',
    router: require('./feedback.routes'),
  },
];
