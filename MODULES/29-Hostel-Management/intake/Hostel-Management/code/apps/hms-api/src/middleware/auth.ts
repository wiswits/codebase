import { FastifyRequest, FastifyReply } from 'fastify';
import { authPlugin } from '../plugins/auth';

export const authMiddleware = {
  // Validate JWT token
  validateToken: async (request: FastifyRequest, reply: FastifyReply) => {
    // This is handled by the auth plugin
    // The plugin adds the user to the request
    return;
  },

  // Check if user is authenticated
  isAuthenticated: (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
  },

  // Get current user
  getCurrentUser: (request: FastifyRequest) => {
    return request.user;
  },
};