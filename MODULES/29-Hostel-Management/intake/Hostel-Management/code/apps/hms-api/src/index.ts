import { buildApp } from './app';
import { config } from './config';

async function start() {
  try {
    const app = await buildApp();

    const address = await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    app.log.info(`🚀 Server listening at ${address}`);
    app.log.info(`📊 Environment: ${config.nodeEnv}`);
    app.log.info(`🛢️  Database: ${config.database.host}:${config.database.port}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();