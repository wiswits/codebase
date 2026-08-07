import fp from 'fastify-plugin';
import { db } from '../db';
import { config } from '../config';

interface AuditLog {
  orgId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ip?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    audit: (data: Omit<AuditLog, 'orgId' | 'actorId' | 'actorRole' | 'ip'>) => Promise<void>;
  }
}

export const auditPlugin = fp(async (fastify) => {
  if (!config.auditEnabled) {
    fastify.log.info('Audit logging is disabled');
    return;
  }

  fastify.decorateRequest('audit', null);

  fastify.addHook('preHandler', async (request) => {
    if (!request.user) return;

    // Attach audit function to request
    request.audit = async (data: Omit<AuditLog, 'orgId' | 'actorId' | 'actorRole' | 'ip'>) => {
      try {
        await db
          .insertInto('hms.audit_log')
          .values({
            org_id: request.tenant.orgId,
            actor_id: request.user.apexUserId,
            actor_role: request.user.roles.join(','),
            action: data.action,
            entity: data.entity,
            entity_id: data.entityId,
            before: data.before ? JSON.stringify(data.before) : null,
            after: data.after ? JSON.stringify(data.after) : null,
            ip: request.ip,
            at: new Date(),
          })
          .execute();
      } catch (error) {
        fastify.log.error('Failed to write audit log:', error);
      }
    };
  });
}, {
  name: 'audit-plugin',
  dependencies: ['auth-plugin', 'tenant-plugin'],
});