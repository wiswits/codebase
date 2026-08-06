import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';
import { createComplaintSchema } from '@shared/schemas/complaint';
import { config } from '../../../config';

export async function complaintCRUDRoutes(fastify: FastifyInstance) {
  // GET complaints
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.COMPLAINT_READ),
      ensureTenantIsolation('complaint'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid().optional(),
        status: z.enum(['open', 'assigned', 'in_progress', 'resolved', 'closed']).optional(),
        assignedToMe: z.boolean().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, status, assignedToMe, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    let query = db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('org_id', '=', orgId);

    if (hostelId) {
      query = query.where('hostel_id', '=', hostelId);
    }

    if (status) {
      query = query.where('status', '=', status);
    }

    if (assignedToMe) {
      query = query.where('assigned_to', '=', userId);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    const complaints = await query.execute();
    const hasMore = complaints.length > limit;
    const data = hasMore ? complaints.slice(0, -1) : complaints;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // GET complaint by ID
  fastify.get('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.COMPLAINT_READ),
      ensureTenantIsolation('complaint'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const orgId = request.tenant.orgId;

    const complaint = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!complaint) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Complaint not found',
        },
      });
    }

    return complaint;
  });

  // POST create complaint
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.COMPLAINT_CREATE),
      ensureTenantIsolation('complaint'),
    ],
    schema: {
      body: createComplaintSchema,
    },
  }, async (request, reply) => {
    const { category, description, photoKeys } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Get student's hostel
    const allocation = await db
      .selectFrom('hms.allocation')
      .select('hostel_id')
      .where('apex_student_id', '=', userId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Student has no active allocation',
        },
      });
    }

    const complaint = await db
      .insertInto('hms.complaint')
      .values({
        org_id: orgId,
        hostel_id: allocation.hostel_id,
        raised_by: userId,
        category,
        description,
        photo_keys: photoKeys || [],
        status: 'open',
      })
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'complaint.create',
        entity: 'complaint',
        entityId: complaint.id,
        after: complaint,
      });
    }

    // Emit notification
    // await emitNotification(complaint, 'complaint_created');

    return reply.status(201).send(complaint);
  });

  // POST update complaint status
  fastify.post('/:id/status', {
    preHandler: [
      requirePermission(PERMISSIONS.COMPLAINT_UPDATE),
      ensureTenantIsolation('complaint'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        status: z.enum(['open', 'assigned', 'in_progress', 'resolved', 'closed']),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    const existing = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Complaint not found',
        },
      });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      open: ['assigned'],
      assigned: ['in_progress'],
      in_progress: ['resolved'],
      resolved: ['closed', 'open'],
      closed: ['open'],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      return reply.status(409).send({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${existing.status} to ${status}`,
        },
      });
    }

    // Only raised_by can confirm closure
    if (status === 'closed' && existing.raised_by !== userId) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Only the student who raised the complaint can confirm closure',
        },
      });
    }

    const updateData: any = { status };

    if (status === 'resolved') {
      updateData.resolved_at = new Date();
    }

    if (status === 'closed') {
      updateData.closed_at = new Date();
    }

    const complaint = await db
      .updateTable('hms.complaint')
      .set(updateData)
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: `complaint.status_${status}`,
        entity: 'complaint',
        entityId: id,
        before: existing,
        after: complaint,
      });
    }

    // Auto-close after 7 days if no student response
    if (status === 'resolved') {
      // Schedule auto-close job
      // await scheduleAutoClose(id, config.autoCloseComplaintDays);
    }

    return complaint;
  });

  // POST confirm complaint resolution (student only)
  fastify.post('/:id/confirm', {
    preHandler: [
      requirePermission(PERMISSIONS.COMPLAINT_CREATE),
      ensureTenantIsolation('complaint'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    const existing = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'resolved')
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Resolved complaint not found',
        },
      });
    }

    // Verify student is the one who raised it
    if (existing.raised_by !== userId) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Only the student who raised the complaint can confirm resolution',
        },
      });
    }

    const complaint = await db
      .updateTable('hms.complaint')
      .set({
        status: 'closed',
        closed_at: new Date(),
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'complaint.confirm',
        entity: 'complaint',
        entityId: id,
        before: existing,
        after: complaint,
      });
    }

    return complaint;
  });
}