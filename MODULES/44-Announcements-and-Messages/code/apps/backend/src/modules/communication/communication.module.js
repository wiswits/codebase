// Communication domain — two route surfaces, today's order.
module.exports = [
  {
    name: 'communication.announcements',
    prefix: '/api/announcements',
    router: require('./announcements.routes'),
  },
  {
    name: 'communication.messages',
    prefix: '/api/messages',
    router: require('./messages.routes'),
  },
];
