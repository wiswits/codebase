const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const server = app.listen(env.PORT, () => {
  logger.info(`WisWits backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection', { message: err.message, stack: err.stack });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = server;
