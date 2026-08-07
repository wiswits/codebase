import fp from 'fastify-plugin';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { databaseConfig } from '../config/database';
import { Database } from '../db/types';

let db: Kysely<Database> | null = null;

declare module 'fastify' {
  interface FastifyInstance {
    db: Kysely<Database>;
  }
}

export const databasePlugin = fp(async (fastify) => {
  try {
    const pool = new Pool(databaseConfig);
    
    db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool,
        onConnectionLost: async () => {
          fastify.log.warn('Database connection lost, attempting to reconnect...');
          // Reconnection is handled by the pool
        },
      }),
    });

    // Test connection
    await db.selectFrom('pg_catalog.pg_tables').select('tablename').limit(1).execute();

    fastify.log.info('Database connected successfully');
    fastify.decorate('db', db);

    // Close database connection on server stop
    fastify.addHook('onClose', async () => {
      if (db) {
        await db.destroy();
        fastify.log.info('Database connection closed');
      }
    });

  } catch (error) {
    fastify.log.error('Database connection failed:', error);
    throw error;
  }
}, {
  name: 'database-plugin',
  dependencies: [],
});

export { db };