import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';
import { createLeaveRequestSchema } from '@shared/schemas/leave';

export async function leaveRequestRoutes(fastify: FastifyInstance) {
  // GET leave requests
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.LEAVE_READ),
      ensureTenantIsolation('leave'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid().optional(),
        status: z.enum(['pending_parent', 'pending_warden', 'approved', 'rejected', 'cancelled']).optional(),
        studentId: z.string().uuid().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, status, studentId, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('org_id', '=', orgId);

    if (hostelId) {
      query = query.where('hostel_id', '=', hostelId);
    }

    if (status) {
      query = query.where('status', '=', status);
    }

    if (studentId) {
      query = query.where('apex_student_id', '=', studentId);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    const leaves = await query.execute();
    const hasMore = leaves.length > limit;
    const data = hasMore ? leaves.slice(0, -1) : leaves;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // POST create leave request
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.LEAVE_CREATE),
      ensureTenantIsolation('leave'),
    ],
    schema: {
      body: createLeaveRequestSchema,
    },
  }, async (request, reply) => {
    const { apexStudentId, fromTs, toTs, reason } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Verify student has active allocation
    const allocation = await db
      .selectFrom('hms.allocation')
      .select('hostel_id')
      .where('apex_student_id', '=', apexStudentId)
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

    // Check if there's an overlapping leave request
    const overlapping = await db
      .selectFrom('hms.leave_request')
      .select('id')
      .where('apex_student_id', '=', apexStudentId)
      .where('org_id', '=', orgId)
      .where('status', 'in', ['pending_parent', 'pending_warden', 'approved'])
      .where((eb) => 
        eb.or([
          eb.and([
            eb('from_ts', '<=', new Date(fromTs)),
            eb('to_ts', '>=', new Date(fromTs)),
          ]),
          eb.and([
            eb('from_ts', '<=', new Date(toTs)),
            eb('to_ts', '>=', new Date(toTs)),
          ]),
          eb.and([
            eb('from_ts', '>=', new Date(fromTs)),
            eb('to_ts', '<=', new Date(toTs)),
          ]),
        ])
      )
      .executeTakeFirst();

    if (overlapping) {
      return reply.status(409).send({
        error: {
          code: 'OVERLAPPING_LEAVE',
          message: 'Student already has an overlapping leave request',
        },
      });
    }

    // Get hostel config for parent approval requirement
    const config = await db
      .selectFrom('hms.hostel_config')
      .select('parent_approval_required')
      .where('hostel_id', '=', allocation.hostel_id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    const parentApprovalRequired = config?.parent_approval_required ?? true;
    const initialStatus = parentApprovalRequired ? 'pending_parent' : 'pending_warden';

    const leave = await db
      .insertInto('hms.leave_request')
      .values({
        org_id: orgId,
        hostel_id: allocation.hostel_id,
        apex_student_id: apexStudentId,
        from_ts: new Date(fromTs),
        to_ts: new Date(toTs),
        reason,
        status: initialStatus,
      })
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'leave.create',
        entity: 'leave',
        entityId: leave.id,
        after: leave,
      });
    }

    // Emit notification event
    // await emitNotification(leave, 'leave_request_created');

    return reply.status(201).send(leave);
  });

  // POST cancel leave request
  fastify.post('/:id/cancel', {
    preHandler: [
      requirePermission(PERMISSIONS.LEAVE_CREATE),
      ensureTenantIsolation('leave'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const orgId = request.tenant.orgId;

    const leave = await db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', 'in', ['pending_parent', 'pending_warden'])
      .executeTakeFirst();

    if (!leave) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Pending leave request not found',
        },
      });
    }

    // Only allow cancellation before from_ts
    if (new Date(leave.from_ts) < new Date()) {
      return reply.status(422).send({
        error: {
          code: 'LEAVE_ALREADY_STARTED',
          message: 'Cannot cancel leave that has already started',
        },
      });
    }

    const updatedLeave = await db
      .updateTable('hms.leave_request')
      .set({ status: 'cancelled' })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'leave.cancel',
        entity: 'leave',
        entityId: id,
        before: leave,
        after: updatedLeave,
      });
    }

    return {
      success: true,
      leave: updatedLeave,
    };
  });
}