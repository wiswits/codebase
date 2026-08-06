import { FastifyInstance } from 'fastify';
import { occupancyReportRoutes } from './occupancy';
import { attendanceReportRoutes } from './attendance';
import { revenueReportRoutes } from './revenue';

export async function registerReportRoutes(fastify: FastifyInstance) {
  await fastify.register(occupancyReportRoutes, { prefix: '/reports' });
  await fastify.register(attendanceReportRoutes, { prefix: '/reports' });
  await fastify.register(revenueReportRoutes, { prefix: '/reports' });
}