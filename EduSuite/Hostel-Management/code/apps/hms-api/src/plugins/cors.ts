import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { config } from '../config';

export const corsPlugin = fp(async (fastify) => {
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: config.corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 hours
  });
}, {
  name: 'cors-plugin',
  dependencies: [],
});