import { FastifyInstance } from 'fastify';
import { complaintCRUDRoutes } from './crud';
import { complaintAssignRoutes } from './assign';
import { complaintUploadRoutes } from './upload';

export async function registerComplaintRoutes(fastify: FastifyInstance) {
  await fastify.register(complaintCRUDRoutes, { prefix: '/complaints' });
  await fastify.register(complaintAssignRoutes, { prefix: '/complaints' });
  await fastify.register(complaintUploadRoutes, { prefix: '/complaints' });
}