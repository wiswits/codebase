import { PoolConfig } from 'pg';
import { config } from './index';

export const databaseConfig: PoolConfig = {
  connectionString: config.databaseUrl,
  min: config.databasePoolMin,
  max: config.databasePoolMax,
  idleTimeoutMillis: config.databaseIdleTimeout,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
};

export const getDatabaseUrl = () => config.databaseUrl;
export const getPoolConfig = () => databaseConfig;