import { FastifyInstance } from 'fastify';
import { registerV1Routes } from './v1';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register v1 routes
  await fastify.register(registerV1Routes, { prefix: '/hms/v1' });
}