import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { databaseConfig } from '../config/database';
import type { Database } from './types';

let db: Kysely<Database> | null = null;

export function getDb(): Kysely<Database> {
  if (!db) {
    const pool = new Pool(databaseConfig);
    db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool,
        onConnectionLost: async () => {
          console.warn('Database connection lost, attempting to reconnect...');
        },
      }),
    });
  }
  return db;
}

export const db = getDb();

export * from './types';