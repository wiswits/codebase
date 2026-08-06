import { FastifyInstance } from 'fastify';
import { registerHierarchyRoutes } from './hierarchy';
import { registerAllocationRoutes } from './allocation';
import { registerAttendanceRoutes } from './attendance';
import { registerLeaveRoutes } from './leave';
import { registerComplaintRoutes } from './complaints';
import { registerReportRoutes } from './reports';
import { meRoutes } from './me/permissions';
import { internalRoutes } from './internal/student-exit';

export async function registerV1Routes(fastify: FastifyInstance) {
  // Register all route groups
  await fastify.register(registerHierarchyRoutes, { prefix: '/hierarchy' });
  await fastify.register(registerAllocationRoutes, { prefix: '/allocation' });
  await fastify.register(registerAttendanceRoutes, { prefix: '/attendance' });
  await fastify.register(registerLeaveRoutes, { prefix: '/leave' });
  await fastify.register(registerComplaintRoutes, { prefix: '/complaints' });
  await fastify.register(registerReportRoutes, { prefix: '/reports' });
  await fastify.register(meRoutes);
  await fastify.register(internalRoutes);
}