import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';
import { createAllocationSchema } from '@shared/schemas/allocation';

export async function allocationRoutes(fastify: FastifyInstance) {
  // GET allocations
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.ALLOCATION_READ),
      ensureTenantIsolation('allocation'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid().optional(),
        active: z.boolean().optional(),
        studentId: z.string().uuid().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, active, studentId, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.allocation.*',
        'hms.bed.bed_label',
        'hms.bed.rent_tier',
        'hms.room.room_number',
      ])
      .where('hms.allocation.org_id', '=', orgId);

    if (hostelId) {
      query = query.where('hms.allocation.hostel_id', '=', hostelId);
    }

    if (studentId) {
      query = query.where('hms.allocation.apex_student_id', '=', studentId);
    }

    if (active !== undefined) {
      if (active) {
        query = query.where('hms.allocation.vacated_at', 'is', null);
      } else {
        query = query.where('hms.allocation.vacated_at', 'is not', null);
      }
    }

    if (cursor) {
      query = query.where('hms.allocation.id', '>', cursor);
    }

    query = query.orderBy('hms.allocation.allocated_at', 'desc').limit(limit + 1);

    const allocations = await query.execute();
    const hasMore = allocations.length > limit;
    const data = hasMore ? allocations.slice(0, -1) : allocations;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // GET student residency
  fastify.get('/students/:studentId/residency', {
    preHandler: [
      requirePermission(PERMISSIONS.ALLOCATION_READ),
      ensureTenantIsolation('allocation'),
    ],
    schema: {
      params: z.object({
        studentId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { studentId } = request.params as { studentId: string };
    const orgId = request.tenant.orgId;

    const allocation = await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.allocation.*',
        'hms.bed.bed_label',
        'hms.bed.rent_tier',
        'hms.room.room_number',
        'hms.room.room_type',
      ])
      .where('hms.allocation.apex_student_id', '=', studentId)
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'No active allocation found for student',
        },
      });
    }

    return allocation;
  });

  // POST create allocation
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.ALLOCATION_CREATE),
      ensureTenantIsolation('allocation'),
    ],
    schema: {
      body: createAllocationSchema,
    },
  }, async (request, reply) => {
    const { apexStudentId, bedId, effectiveFrom } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Check if bed exists and is vacant
    const bed = await db
      .selectFrom('hms.bed')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .innerJoin('hms.hostel', 'hms.hostel.id', 'hms.building.hostel_id')
      .select([
        'hms.bed.*',
        'hms.hostel.id as hostel_id',
        'hms.hostel.type as hostel_type',
      ])
      .where('hms.bed.id', '=', bedId)
      .where('hms.bed.org_id', '=', orgId)
      .where('hms.bed.status', '=', 'vacant')
      .executeTakeFirst();

    if (!bed) {
      return reply.status(409).send({
        error: {
          code: 'BED_NOT_AVAILABLE',
          message: 'Bed is not available for allocation',
        },
      });
    }

    // Check if student already has active allocation
    const existingAllocation = await db
      .selectFrom('hms.allocation')
      .select('id')
      .where('apex_student_id', '=', apexStudentId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (existingAllocation) {
      return reply.status(409).send({
        error: {
          code: 'STUDENT_ALREADY_ALLOCATED',
          message: 'Student already has an active allocation',
        },
      });
    }

    // Check gender compatibility with hostel
    const student = await fetchStudentFromAPEX(apexStudentId);
    if (student.gender !== bed.hostel_type && bed.hostel_type !== 'coed') {
      return reply.status(422).send({
        error: {
          code: 'GENDER_MISMATCH',
          message: 'Student gender does not match hostel type',
        },
      });
    }

    // Check fee clearance
    if (!student.feeClearanceFlag) {
      return reply.status(422).send({
        error: {
          code: 'FEE_NOT_CLEARED',
          message: 'Student fees are not cleared',
        },
      });
    }

    // Create allocation
    const allocation = await db
      .insertInto('hms.allocation')
      .values({
        org_id: orgId,
        bed_id: bedId,
        apex_student_id: apexStudentId,
        hostel_id: bed.hostel_id,
        allocated_by: userId,
        allocated_at: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    // Update bed status
    await db
      .updateTable('hms.bed')
      .set({ status: 'occupied' })
      .where('id', '=', bedId)
      .where('org_id', '=', orgId)
      .execute();

    // Create fee charge via APEX
    // const feeCharge = await createFeeCharge(apexStudentId, bed.rent_tier, allocation.id);

    if (request.audit) {
      await request.audit({
        action: 'allocation.create',
        entity: 'allocation',
        entityId: allocation.id,
        after: allocation,
      });
    }

    return reply.status(201).send({
      allocation,
      bed,
      // rentPaise: feeCharge.amountPaise,
      // apexLedgerId: feeCharge.ledgerId,
    });
  });
}

// Helper function to fetch student from APEX
async function fetchStudentFromAPEX(studentId: string) {
  // In production, call APEX student API
  return {
    id: studentId,
    gender: 'boys',
    feeClearanceFlag: true,
  };
}