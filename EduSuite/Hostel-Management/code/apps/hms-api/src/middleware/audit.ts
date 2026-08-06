import { FastifyRequest, FastifyReply } from 'fastify';

export const auditMiddleware = {
  // Log action
  logAction: async (request: FastifyRequest, data: {
    action: string;
    entity: string;
    entityId: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
  }) => {
    if (request.audit) {
      await request.audit(data);
    }
  },

  // Create audit middleware for routes
  auditRoute: (entity: string, action?: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Store request data for audit
      (request as any)._auditEntity = entity;
      (request as any)._auditAction = action;
    };
  },
};