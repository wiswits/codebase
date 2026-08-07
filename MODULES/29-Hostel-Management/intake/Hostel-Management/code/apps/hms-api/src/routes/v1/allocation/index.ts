import { FastifyInstance } from 'fastify';
import { allocationRoutes } from './allocate';
import { vacateRoutes } from './vacate';
import { transferRoutes } from './transfer';

export async function registerAllocationRoutes(fastify: FastifyInstance) {
  await fastify.register(allocationRoutes, { prefix: '/allocations' });
  await fastify.register(vacateRoutes, { prefix: '/allocations' });
  await fastify.register(transferRoutes, { prefix: '/transfers' });
}