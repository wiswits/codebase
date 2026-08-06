import { FastifyInstance } from 'fastify';
import { attendanceBulkRoutes } from './bulk';
import { attendanceQRRoutes } from './qr-scan';
import { attendanceRosterRoutes } from './roster';

export async function registerAttendanceRoutes(fastify: FastifyInstance) {
  await fastify.register(attendanceBulkRoutes, { prefix: '/attendance' });
  await fastify.register(attendanceQRRoutes, { prefix: '/attendance' });
  await fastify.register(attendanceRosterRoutes, { prefix: '/attendance' });
}