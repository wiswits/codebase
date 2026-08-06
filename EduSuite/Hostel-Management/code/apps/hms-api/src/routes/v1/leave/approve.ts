import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

export async function leaveApproveRoutes(fastify: FastifyInstance) {
  // POST parent decision
  fastify.post('/:id/parent-decision', {
    preHandler: [
      requirePermission(PERMISSIONS.LEAVE_APPROVE),
      ensureTenantIsolation('leave'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: decisionSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { decision, reason } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    const leave = await db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'pending_parent')
      .executeTakeFirst();

    if (!leave) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Leave request awaiting parent approval not found',
        },
      });
    }

    // Verify parent is authorized
    if (!request.user.parentOf?.includes(leave.apex_student_id)) {
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to approve this leave request',
        },
      });
    }

    let updatedLeave;
    if (decision === 'approved') {
      // Check if warden approval is required (always required after parent approval)
      updatedLeave = await db
        .updateTable('hms.leave_request')
        .set({
          status: 'pending_warden',
          parent_decided_by: userId,
          parent_decided_at: new Date(),
        })
        .where('id', '=', id)
        .where('org_id', '=', orgId)
        .returningAll()
        .executeTakeFirst();

      // Emit notification for warden
      // await emitNotification(updatedLeave, 'leave_warden_approval_required');

    } else {
      // Rejected
      updatedLeave = await db
        .updateTable('hms.leave_request')
        .set({
          status: 'rejected',
          parent_decided_by: userId,
          parent_decided_at: new Date(),
          reject_reason: reason || null,
        })
        .where('id', '=', id)
        .where('org_id', '=', orgId)
        .returningAll()
        .executeTakeFirst();

      // Emit notification for student
      // await emitNotification(updatedLeave, 'leave_rejected');
    }

    if (request.audit) {
      await request.audit({
        action: `leave.parent_${decision}`,
        entity: 'leave',
        entityId: id,
        before: leave,
        after: updatedLeave,
      });
    }

    return updatedLeave;
  });

  // POST warden decision
  fastify.post('/:id/warden-decision', {
    preHandler: [
      requirePermission(PERMISSIONS.LEAVE_APPROVE),
      ensureTenantIsolation('leave'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: decisionSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { decision, reason } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

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
          message: 'Leave request awaiting approval not found',
        },
      });
    }

    let updatedLeave;
    if (decision === 'approved') {
      updatedLeave = await db
        .updateTable('hms.leave_request')
        .set({
          status: 'approved',
          warden_decided_by: userId,
          warden_decided_at: new Date(),
        })
        .where('id', '=', id)
        .where('org_id', '=', orgId)
        .returningAll()
        .executeTakeFirst();

      // Generate gate pass
      const gatePass = await db
        .insertInto('hms.gate_pass')
        .values({
          org_id: orgId,
          leave_id: id,
          pass_code: generateGatePassCode(id),
          valid_from: leave.from_ts,
          valid_to: leave.to_ts,
        })
        .returningAll()
        .executeTakeFirst();

      // Emit notification with gate pass
      // await emitNotification({ ...updatedLeave, gatePass }, 'leave_approved');

    } else {
      // Rejected
      updatedLeave = await db
        .updateTable('hms.leave_request')
        .set({
          status: 'rejected',
          warden_decided_by: userId,
          warden_decided_at: new Date(),
          reject_reason: reason || null,
        })
        .where('id', '=', id)
        .where('org_id', '=', orgId)
        .returningAll()
        .executeTakeFirst();

      // Emit notification for student
      // await emitNotification(updatedLeave, 'leave_rejected');
    }

    if (request.audit) {
      await request.audit({
        action: `leave.warden_${decision}`,
        entity: 'leave',
        entityId: id,
        before: leave,
        after: updatedLeave,
      });
    }

    return updatedLeave;
  });
}

function generateGatePassCode(leaveId: string): string {
  const timestamp = Date.now().toString(36);
  const shortId = leaveId.split('-')[0];
  return `GP-${shortId}-${timestamp.toUpperCase()}`;
}