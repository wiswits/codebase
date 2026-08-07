import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';
import { vacateAllocationSchema } from '@shared/schemas/allocation';

export async function vacateRoutes(fastify: FastifyInstance) {
  // POST vacate allocation
  fastify.post('/:id/vacate', {
    preHandler: [
      requirePermission(PERMISSIONS.ALLOCATION_UPDATE),
      ensureTenantIsolation('allocation'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: vacateAllocationSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason, damageCharges } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Get allocation
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Active allocation not found',
        },
      });
    }

    // Get bed
    const bed = await db
      .selectFrom('hms.bed')
      .selectAll()
      .where('id', '=', allocation.bed_id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!bed) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Bed not found',
        },
      });
    }

    // Update allocation
    const updatedAllocation = await db
      .updateTable('hms.allocation')
      .set({
        vacated_at: new Date(),
        vacate_reason: reason,
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    // Update bed status
    await db
      .updateTable('hms.bed')
      .set({ status: 'vacant' })
      .where('id', '=', bed.id)
      .where('org_id', '=', orgId)
      .execute();

    // If damage charges exist, post to APEX fee module
    if (damageCharges && damageCharges > 0) {
      // await postDamageCharge(allocation.apex_student_id, damageCharges, allocation.id);
    }

    if (request.audit) {
      await request.audit({
        action: 'allocation.vacate',
        entity: 'allocation',
        entityId: id,
        before: allocation,
        after: updatedAllocation,
      });
    }

    return {
      success: true,
      allocation: updatedAllocation,
    };
  });
}