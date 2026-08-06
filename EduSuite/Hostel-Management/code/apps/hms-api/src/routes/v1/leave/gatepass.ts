import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function gatePassRoutes(fastify: FastifyInstance) {
  // GET active gate passes (guard view - today only)
  fastify.get('/active', {
    preHandler: [
      requirePermission(PERMISSIONS.GATEPASS_READ),
      ensureTenantIsolation('gatepass'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = db
      .selectFrom('hms.gate_pass')
      .innerJoin('hms.leave_request', 'hms.leave_request.id', 'hms.gate_pass.leave_id')
      .select([
        'hms.gate_pass.*',
        'hms.leave_request.apex_student_id',
        'hms.leave_request.reason',
      ])
      .where('hms.gate_pass.org_id', '=', orgId)
      .where('hms.gate_pass.valid_from', '<=', new Date())
      .where('hms.gate_pass.valid_to', '>=', new Date());

    if (hostelId) {
      query = query.where('hms.leave_request.hostel_id', '=', hostelId);
    }

    if (cursor) {
      query = query.where('hms.gate_pass.id', '>', cursor);
    }

    query = query.orderBy('hms.gate_pass.valid_from', 'asc').limit(limit + 1);

    const gatePasses = await query.execute();
    const hasMore = gatePasses.length > limit;
    const data = hasMore ? gatePasses.slice(0, -1) : gatePasses;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // POST scan gate pass
  fastify.post('/:code/scan', {
    preHandler: [
      requirePermission(PERMISSIONS.GATEPASS_SCAN),
      ensureTenantIsolation('gatepass'),
    ],
    schema: {
      params: z.object({
        code: z.string(),
      }),
      body: z.object({
        direction: z.enum(['exit', 'entry']),
      }),
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const { direction } = request.body as { direction: 'exit' | 'entry' };
    const orgId = request.tenant.orgId;

    // Get gate pass
    const gatePass = await db
      .selectFrom('hms.gate_pass')
      .innerJoin('hms.leave_request', 'hms.leave_request.id', 'hms.gate_pass.leave_id')
      .select([
        'hms.gate_pass.*',
        'hms.leave_request.apex_student_id',
        'hms.leave_request.reason',
        'hms.leave_request.status as leave_status',
        'hms.leave_request.from_ts',
        'hms.leave_request.to_ts',
      ])
      .where('hms.gate_pass.pass_code', '=', code)
      .where('hms.gate_pass.org_id', '=', orgId)
      .where('hms.gate_pass.valid_from', '<=', new Date())
      .where('hms.gate_pass.valid_to', '>=', new Date())
      .executeTakeFirst();

    if (!gatePass) {
      return reply.status(404).send({
        error: {
          code: 'INVALID_GATE_PASS',
          message: 'Invalid or expired gate pass',
        },
      });
    }

    if (gatePass.leave_status !== 'approved') {
      return reply.status(409).send({
        error: {
          code: 'LEAVE_NOT_APPROVED',
          message: 'Leave request is not approved',
        },
      });
    }

    // Check if already scanned
    if (direction === 'exit' && gatePass.exit_scanned_at) {
      return reply.status(409).send({
        error: {
          code: 'ALREADY_SCANNED',
          message: 'Gate pass already scanned for exit',
        },
      });
    }

    if (direction === 'entry' && gatePass.entry_scanned_at) {
      return reply.status(409).send({
        error: {
          code: 'ALREADY_SCANNED',
          message: 'Gate pass already scanned for entry',
        },
      });
    }

    // Update gate pass
    const updateData = direction === 'exit' 
      ? { exit_scanned_at: new Date() }
      : { entry_scanned_at: new Date() };

    const updatedGatePass = await db
      .updateTable('hms.gate_pass')
      .set(updateData)
      .where('id', '=', gatePass.id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    // If entry is scanned, mark attendance for today
    if (direction === 'entry') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db
        .insertInto('hms.attendance')
        .values({
          org_id: orgId,
          hostel_id: gatePass.hostel_id || '', // Need to get hostel_id from allocation
          apex_student_id: gatePass.apex_student_id,
          attendance_date: today,
          status: 'present',
          method: 'qr',
          marked_by: request.user.apexUserId,
          marked_at: new Date(),
        })
        .onConflict((oc) =>
          oc.columns(['apex_student_id', 'attendance_date'])
            .doUpdateSet({
              status: 'present',
              method: 'qr',
              marked_by: request.user.apexUserId,
              marked_at: new Date(),
            })
        )
        .execute();
    }

    if (request.audit) {
      await request.audit({
        action: `gatepass.${direction}_scan`,
        entity: 'gatepass',
        entityId: gatePass.id,
        before: gatePass,
        after: updatedGatePass,
      });
    }

    return {
      valid: true,
      studentId: gatePass.apex_student_id,
      direction,
      scannedAt: new Date().toISOString(),
    };
  });
}