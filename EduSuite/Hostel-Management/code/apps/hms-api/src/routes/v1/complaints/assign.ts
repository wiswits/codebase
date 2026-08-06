import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function complaintAssignRoutes(fastify: FastifyInstance) {
  // POST assign complaint
  fastify.post('/:id/assign', {
    preHandler: [
      requirePermission(PERMISSIONS.COMPLAINT_UPDATE),
      ensureTenantIsolation('complaint'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        userId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.body as { userId: string };
    const orgId = request.tenant.orgId;

    const existing = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'open')
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Open complaint not found',
        },
      });
    }

    const complaint = await db
      .updateTable('hms.complaint')
      .set({
        assigned_to: userId,
        status: 'assigned',
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'complaint.assign',
        entity: 'complaint',
        entityId: id,
        before: existing,
        after: complaint,
      });
    }

    // Emit notification to assigned user
    // await emitNotification({ ...complaint, assignedTo: userId }, 'complaint_assigned');

    return complaint;
  });
}