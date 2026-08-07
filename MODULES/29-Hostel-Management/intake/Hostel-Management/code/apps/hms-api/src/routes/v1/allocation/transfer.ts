import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';
import { transferSchema, approveTransferSchema } from '@shared/schemas/allocation';

export async function transferRoutes(fastify: FastifyInstance) {
  // GET transfers
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.TRANSFER_READ),
      ensureTenantIsolation('transfer'),
    ],
    schema: {
      querystring: z.object({
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { status, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.transfer')
      .selectAll()
      .where('org_id', '=', orgId);

    if (status) {
      query = query.where('status', '=', status);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    const transfers = await query.execute();
    const hasMore = transfers.length > limit;
    const data = hasMore ? transfers.slice(0, -1) : transfers;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // POST create transfer request
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.TRANSFER_CREATE),
      ensureTenantIsolation('transfer'),
    ],
    schema: {
      body: transferSchema,
    },
  }, async (request, reply) => {
    const { allocationId, requestedBedId, reason } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Verify allocation exists
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('id', '=', allocationId)
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

    // Verify requested bed exists and is vacant
    const bed = await db
      .selectFrom('hms.bed')
      .selectAll()
      .where('id', '=', requestedBedId)
      .where('org_id', '=', orgId)
      .where('status', '=', 'vacant')
      .executeTakeFirst();

    if (!bed) {
      return reply.status(409).send({
        error: {
          code: 'BED_NOT_AVAILABLE',
          message: 'Requested bed is not available',
        },
      });
    }

    // Check if transfer already exists for this allocation
    const existingTransfer = await db
      .selectFrom('hms.transfer')
      .select('id')
      .where('allocation_id', '=', allocationId)
      .where('status', '=', 'pending')
      .executeTakeFirst();

    if (existingTransfer) {
      return reply.status(409).send({
        error: {
          code: 'TRANSFER_EXISTS',
          message: 'A pending transfer already exists for this allocation',
        },
      });
    }

    const transfer = await db
      .insertInto('hms.transfer')
      .values({
        org_id: orgId,
        allocation_id: allocationId,
        requested_bed_id: requestedBedId,
        requested_by: userId,
        reason: reason,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'transfer.create',
        entity: 'transfer',
        entityId: transfer.id,
        after: transfer,
      });
    }

    return reply.status(201).send(transfer);
  });

  // POST approve transfer
  fastify.post('/:id/approve', {
    preHandler: [
      requirePermission(PERMISSIONS.TRANSFER_APPROVE),
      ensureTenantIsolation('transfer'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: approveTransferSchema.optional(),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { newBedId } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Get transfer
    const transfer = await db
      .selectFrom('hms.transfer')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'pending')
      .executeTakeFirst();

    if (!transfer) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Pending transfer not found',
        },
      });
    }

    // Get allocation
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('id', '=', transfer.allocation_id)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Allocation not found',
        },
      });
    }

    const targetBedId = newBedId || transfer.requested_bed_id;

    // Verify target bed is available
    const targetBed = await db
      .selectFrom('hms.bed')
      .selectAll()
      .where('id', '=', targetBedId)
      .where('org_id', '=', orgId)
      .where('status', '=', 'vacant')
      .executeTakeFirst();

    if (!targetBed) {
      return reply.status(409).send({
        error: {
          code: 'BED_NOT_AVAILABLE',
          message: 'Target bed is not available',
        },
      });
    }

    // Get current bed
    const currentBed = await db
      .selectFrom('hms.bed')
      .selectAll()
      .where('id', '=', allocation.bed_id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    // Update allocation with new bed
    await db
      .updateTable('hms.allocation')
      .set({ bed_id: targetBedId })
      .where('id', '=', allocation.id)
      .where('org_id', '=', orgId)
      .execute();

    // Update bed statuses
    await db
      .updateTable('hms.bed')
      .set({ status: 'vacant' })
      .where('id', '=', currentBed.id)
      .where('org_id', '=', orgId)
      .execute();

    await db
      .updateTable('hms.bed')
      .set({ status: 'occupied' })
      .where('id', '=', targetBedId)
      .where('org_id', '=', orgId)
      .execute();

    // Update transfer status
    const updatedTransfer = await db
      .updateTable('hms.transfer')
      .set({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date(),
        approved_bed_id: targetBedId,
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'transfer.approve',
        entity: 'transfer',
        entityId: id,
        before: transfer,
        after: updatedTransfer,
      });
    }

    return {
      success: true,
      transfer: updatedTransfer,
      allocation,
    };
  });

  // POST reject transfer
  fastify.post('/:id/reject', {
    preHandler: [
      requirePermission(PERMISSIONS.TRANSFER_APPROVE),
      ensureTenantIsolation('transfer'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        reason: z.string().min(1),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason: string };
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    const transfer = await db
      .selectFrom('hms.transfer')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'pending')
      .executeTakeFirst();

    if (!transfer) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Pending transfer not found',
        },
      });
    }

    const updatedTransfer = await db
      .updateTable('hms.transfer')
      .set({
        status: 'rejected',
        approved_by: userId,
        approved_at: new Date(),
        reject_reason: reason,
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'transfer.reject',
        entity: 'transfer',
        entityId: id,
        before: transfer,
        after: updatedTransfer,
      });
    }

    return {
      success: true,
      transfer: updatedTransfer,
    };
  });
}