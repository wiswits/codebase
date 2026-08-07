import { FastifyInstance } from 'fastify';
import { hostelRoutes } from './hostel';
import { buildingRoutes } from './building';
import { wingRoutes } from './wing';
import { floorRoutes } from './floor';
import { roomRoutes } from './room';
import { bedRoutes } from './bed';

export async function registerHierarchyRoutes(fastify: FastifyInstance) {
  await fastify.register(hostelRoutes, { prefix: '/hostels' });
  await fastify.register(buildingRoutes, { prefix: '/buildings' });
  await fastify.register(wingRoutes, { prefix: '/wings' });
  await fastify.register(floorRoutes, { prefix: '/floors' });
  await fastify.register(roomRoutes, { prefix: '/rooms' });
  await fastify.register(bedRoutes, { prefix: '/beds' });
}