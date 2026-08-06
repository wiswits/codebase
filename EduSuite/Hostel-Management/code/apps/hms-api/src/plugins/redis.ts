import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

let redisClient: Redis | null = null;

export const redisPlugin = fp(async (fastify) => {
  try {
    redisClient = new Redis({
      host: config.redisUrl.split('://')[1]?.split(':')[0] || 'localhost',
      port: parseInt(config.redisUrl.split(':')[2] || '6379'),
      password: config.redisPassword,
      db: config.redisDb,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('error', (error) => {
      fastify.log.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      fastify.log.info('Redis connected successfully');
    });

    fastify.decorate('redis', redisClient);

    // Close Redis connection on server stop
    fastify.addHook('onClose', async () => {
      if (redisClient) {
        await redisClient.quit();
        fastify.log.info('Redis connection closed');
      }
    });

  } catch (error) {
    fastify.log.warn('Redis connection failed, continuing without Redis:', error);
    // Create a mock Redis client
    const mockRedis = {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      incr: async () => 1,
      expire: async () => 1,
      ttl: async () => -1,
      exists: async () => 0,
      hget: async () => null,
      hset: async () => 1,
      hdel: async () => 1,
      hgetall: async () => ({}),
      sadd: async () => 1,
      srem: async () => 1,
      smembers: async () => [],
      pipeline: () => ({
        get: () => ({ exec: async () => [] }),
        set: () => ({ exec: async () => [] }),
        del: () => ({ exec: async () => [] }),
      }),
    };
    fastify.decorate('redis', mockRedis);
  }
}, {
  name: 'redis-plugin',
  dependencies: [],
});