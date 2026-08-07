import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function attendanceRosterRoutes(fastify: FastifyInstance) {
  // GET attendance roster with pre-filled status
  fastify.get('/roster', {
    preHandler: [
      requirePermission(PERMISSIONS.ATTENDANCE_READ),
      ensureTenantIsolation('attendance'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, date } = request.query as any;
    const orgId = request.tenant.orgId;

    // Get all active allocations in the hostel
    const allocations = await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.allocation.apex_student_id',
        'hms.room.room_number',
        'hms.bed.bed_label',
      ])
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.hostel_id', '=', hostelId)
      .where('hms.allocation.vacated_at', 'is', null)
      .execute();

    if (allocations.length === 0) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'No students allocated in this hostel',
        },
      });
    }

    // Get attendance for the date
    const attendance = await db
      .selectFrom('hms.attendance')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('attendance_date', '=', new Date(date))
      .execute();

    const attendanceMap = new Map(
      attendance.map(a => [a.apex_student_id, a])
    );

    // Build roster
    const roster = allocations.map(alloc => {
      const att = attendanceMap.get(alloc.apex_student_id);
      return {
        studentId: alloc.apex_student_id,
        studentName: alloc.apex_student_id, // In production, fetch from APEX
        roomNumber: alloc.room_number,
        bedLabel: alloc.bed_label,
        status: att?.status || null,
        attendanceId: att?.id || null,
      };
    });

    return roster;
  });

  // GET missing students (absent or on leave)
  fastify.get('/missing', {
    preHandler: [
      requirePermission(PERMISSIONS.ATTENDANCE_READ),
      ensureTenantIsolation('attendance'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, date } = request.query as any;
    const orgId = request.tenant.orgId;

    const dateObj = new Date(date);

    // Get all active allocations in the hostel
    const allocations = await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.allocation.apex_student_id',
        'hms.room.room_number',
      ])
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.hostel_id', '=', hostelId)
      .where('hms.allocation.vacated_at', 'is', null)
      .execute();

    const allocatedStudentIds = allocations.map(a => a.apex_student_id);

    // Get attendance for the date
    const attendance = await db
      .selectFrom('hms.attendance')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('attendance_date', '=', dateObj)
      .execute();

    const presentStudents = new Set(
      attendance.filter(a => a.status === 'present').map(a => a.apex_student_id)
    );

    // Get students on leave
    const leaves = await db
      .selectFrom('hms.leave_request')
      .select('apex_student_id')
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('status', '=', 'approved')
      .where('from_ts', '<=', dateObj)
      .where('to_ts', '>=', dateObj)
      .execute();

    const onLeaveStudents = new Set(leaves.map(l => l.apex_student_id));

    // Find missing students
    const missing = allocations
      .filter(alloc => {
        const isPresent = presentStudents.has(alloc.apex_student_id);
        const isOnLeave = onLeaveStudents.has(alloc.apex_student_id);
        return !isPresent && !isOnLeave;
      })
      .map(alloc => ({
        studentId: alloc.apex_student_id,
        studentName: alloc.apex_student_id, // In production, fetch from APEX
        roomNumber: alloc.room_number,
        status: 'absent' as const,
      }));

    return missing;
  });
}