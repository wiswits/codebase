import { FastifyInstance } from 'fastify';
import { leaveRequestRoutes } from './request';
import { leaveApproveRoutes } from './approve';
import { gatePassRoutes } from './gatepass';

export async function registerLeaveRoutes(fastify: FastifyInstance) {
  await fastify.register(leaveRequestRoutes, { prefix: '/leaves' });
  await fastify.register(leaveApproveRoutes, { prefix: '/leaves' });
  await fastify.register(gatePassRoutes, { prefix: '/gate-passes' });
}