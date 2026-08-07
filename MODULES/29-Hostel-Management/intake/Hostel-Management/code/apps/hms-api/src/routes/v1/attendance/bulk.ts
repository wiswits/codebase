import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

const bulkAttendanceSchema = z.object({
  hostelId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(['present', 'absent', 'on_leave', 'late']),
    })
  ).min(1).max(200),
});

export async function attendanceBulkRoutes(fastify: FastifyInstance) {
  // POST bulk attendance
  fastify.post('/bulk', {
    preHandler: [
      requirePermission(PERMISSIONS.ATTENDANCE_CREATE),
      ensureTenantIsolation('attendance'),
    ],
    schema: {
      body: bulkAttendanceSchema,
    },
  }, async (request, reply) => {
    const { hostelId, date, records } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    // Verify hostel exists
    const hostel = await db
      .selectFrom('hms.hostel')
      .select('id')
      .where('id', '=', hostelId)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!hostel) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Hostel not found',
        },
      });
    }

    // Get all active allocations for these students
    const studentIds = records.map(r => r.studentId);
    const allocations = await db
      .selectFrom('hms.allocation')
      .select(['apex_student_id', 'bed_id'])
      .where('org_id', '=', orgId)
      .where('apex_student_id', 'in', studentIds)
      .where('vacated_at', 'is', null)
      .execute();

    const allocatedStudents = new Set(allocations.map(a => a.apex_student_id));

    // Process each record
    const results = [];
    const errors = [];

    for (const record of records) {
      // Check if student is allocated
      if (!allocatedStudents.has(record.studentId)) {
        errors.push({
          studentId: record.studentId,
          error: 'Student has no active allocation',
        });
        continue;
      }

      try {
        // Upsert attendance
        const attendance = await db
          .insertInto('hms.attendance')
          .values({
            org_id: orgId,
            hostel_id: hostelId,
            apex_student_id: record.studentId,
            attendance_date: new Date(date),
            status: record.status,
            method: 'manual',
            marked_by: userId,
            marked_at: new Date(),
          })
          .onConflict((oc) => 
            oc.columns(['apex_student_id', 'attendance_date'])
              .doUpdateSet({
                status: record.status,
                marked_by: userId,
                marked_at: new Date(),
              })
          )
          .returningAll()
          .executeTakeFirst();

        results.push(attendance);

        // Audit log
        if (request.audit) {
          await request.audit({
            action: 'attendance.bulk_create',
            entity: 'attendance',
            entityId: attendance.id,
            after: attendance,
          });
        }

      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      count: results.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  });

  // GET attendance by date
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.ATTENDANCE_READ),
      ensureTenantIsolation('attendance'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, date, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.attendance')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('attendance_date', '=', new Date(date));

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('marked_at', 'desc').limit(limit + 1);

    const records = await query.execute();
    const hasMore = records.length > limit;
    const data = hasMore ? records.slice(0, -1) : records;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });
}