import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { ensureTenantIsolation } from '../../../plugins/tenant';

const studentExitSchema = z.object({
  studentId: z.string().uuid(),
  reason: z.string().optional(),
  forceVacate: z.boolean().default(false),
});

export async function internalRoutes(fastify: FastifyInstance) {
  // POST internal student exit (called by APEX when student leaves school)
  fastify.post('/internal/student-exit', {
    preHandler: [ensureTenantIsolation('allocation')],
    schema: {
      body: studentExitSchema,
    },
  }, async (request, reply) => {
    const { studentId, reason, forceVacate } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Get active allocation
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('apex_student_id', '=', studentId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'No active allocation found for student',
        },
      });
    }

    // Force vacate - skip normal checks
    const updatedAllocation = await db
      .updateTable('hms.allocation')
      .set({
        vacated_at: new Date(),
        vacate_reason: reason || 'Student exited school (APEX internal)',
      })
      .where('id', '=', allocation.id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    // Update bed status
    await db
      .updateTable('hms.bed')
      .set({ status: 'vacant' })
      .where('id', '=', allocation.bed_id)
      .where('org_id', '=', orgId)
      .execute();

    // Process fee refund if applicable
    // await processFeeRefund(studentId, allocation.id);

    if (request.audit) {
      await request.audit({
        action: 'internal.student_exit',
        entity: 'allocation',
        entityId: allocation.id,
        before: allocation,
        after: updatedAllocation,
      });
    }

    return {
      success: true,
      allocation: updatedAllocation,
      message: `Student ${studentId} has been vacated from bed ${allocation.bed_id}`,
    };
  });

  // GET student residency (for APEX to check)
  fastify.get('/internal/students/:studentId/residency', {
    preHandler: [ensureTenantIsolation('allocation')],
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
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .innerJoin('hms.hostel', 'hms.hostel.id', 'hms.building.hostel_id')
      .select([
        'hms.allocation.id as allocation_id',
        'hms.allocation.allocated_at',
        'hms.bed.id as bed_id',
        'hms.bed.bed_label',
        'hms.bed.rent_tier',
        'hms.room.room_number',
        'hms.room.room_type',
        'hms.floor.floor_number',
        'hms.wing.code as wing_code',
        'hms.building.name as building_name',
        'hms.hostel.name as hostel_name',
        'hms.hostel.id as hostel_id',
      ])
      .where('hms.allocation.apex_student_id', '=', studentId)
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      return {
        isResident: false,
        allocation: null,
      };
    }

    return {
      isResident: true,
      allocation: {
        id: allocation.allocation_id,
        allocatedAt: allocation.allocated_at,
        bed: {
          id: allocation.bed_id,
          label: allocation.bed_label,
          rentTier: allocation.rent_tier,
        },
        room: {
          number: allocation.room_number,
          type: allocation.room_type,
        },
        floor: allocation.floor_number,
        wing: allocation.wing_code,
        building: allocation.building_name,
        hostel: {
          id: allocation.hostel_id,
          name: allocation.hostel_name,
        },
      },
    };
  });

  // GET occupancy summary (for APEX dashboard widget)
  fastify.get('/internal/occupancy/summary', {
    preHandler: [ensureTenantIsolation('allocation')],
  }, async (request, reply) => {
    const orgId = request.tenant.orgId;

    // Get total beds
    const totalBeds = await db
      .selectFrom('hms.bed')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    // Get occupied beds
    const occupiedBeds = await db
      .selectFrom('hms.bed')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .where('status', '=', 'occupied')
      .executeTakeFirst();

    // Get total students
    const totalStudents = await db
      .selectFrom('hms.allocation')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    // Get total hostels
    const totalHostels = await db
      .selectFrom('hms.hostel')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .where('is_active', '=', true)
      .executeTakeFirst();

    const total = Number(totalBeds?.count || 0);
    const occupied = Number(occupiedBeds?.count || 0);
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      totalBeds: total,
      occupiedBeds: occupied,
      vacantBeds: total - occupied,
      occupancyRate,
      totalStudents: Number(totalStudents?.count || 0),
      totalHostels: Number(totalHostels?.count || 0),
    };
  });

  // GET recent activity (for APEX dashboard)
  fastify.get('/internal/activity/recent', {
    preHandler: [ensureTenantIsolation('allocation')],
    schema: {
      querystring: z.object({
        limit: z.coerce.number().min(1).max(50).default(10),
      }),
    },
  }, async (request, reply) => {
    const { limit } = request.query as { limit: number };
    const orgId = request.tenant.orgId;

    // Get recent allocations
    const allocations = await db
      .selectFrom('hms.allocation')
      .select([
        'id',
        'allocated_at as timestamp',
        db.lit('allocation').as('type'),
        db.lit('Student allocated').as('message'),
      ])
      .where('org_id', '=', orgId)
      .orderBy('allocated_at', 'desc')
      .limit(limit)
      .execute();

    // Get recent vacates
    const vacates = await db
      .selectFrom('hms.allocation')
      .select([
        'id',
        'vacated_at as timestamp',
        db.lit('vacate').as('type'),
        db.lit('Student vacated').as('message'),
      ])
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is not', null)
      .orderBy('vacated_at', 'desc')
      .limit(limit)
      .execute();

    // Get recent leaves
    const leaves = await db
      .selectFrom('hms.leave_request')
      .select([
        'id',
        'created_at as timestamp',
        db.lit('leave').as('type'),
        db.lit('Leave request created').as('message'),
      ])
      .where('org_id', '=', orgId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();

    // Combine and sort
    const activities = [...allocations, ...vacates, ...leaves]
      .filter(a => a.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map(a => ({
        id: a.id,
        type: a.type,
        message: a.message,
        timestamp: a.timestamp,
      }));

    return activities;
  });
}