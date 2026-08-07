import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function attendanceReportRoutes(fastify: FastifyInstance) {
  // GET attendance report
  fastify.get('/attendance', {
    preHandler: [
      requirePermission(PERMISSIONS.REPORT_READ),
      ensureTenantIsolation('report'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        studentId: z.string().uuid().optional(),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, studentId, from, to } = request.query as any;
    const orgId = request.tenant.orgId;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    let query = db
      .selectFrom('hms.attendance')
      .innerJoin('hms.allocation', 'hms.allocation.apex_student_id', 'hms.attendance.apex_student_id')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.attendance.*',
        'hms.room.room_number',
        'hms.bed.bed_label',
      ])
      .where('hms.attendance.org_id', '=', orgId)
      .where('hms.attendance.hostel_id', '=', hostelId)
      .where('hms.attendance.attendance_date', '>=', fromDate)
      .where('hms.attendance.attendance_date', '<=', toDate);

    if (studentId) {
      query = query.where('hms.attendance.apex_student_id', '=', studentId);
    }

    query = query.orderBy('hms.attendance.attendance_date', 'desc');

    const records = await query.execute();

    // Calculate statistics
    const totalDays = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const onLeave = records.filter(r => r.status === 'on_leave').length;
    const late = records.filter(r => r.status === 'late').length;

    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    // Daily trend data
    const dailyTrend = await db
      .selectFrom('hms.attendance')
      .select([
        'attendance_date as date',
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'present')
            .then(1)
            .else(0)
        ).as('present'),
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'absent')
            .then(1)
            .else(0)
        ).as('absent'),
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'on_leave')
            .then(1)
            .else(0)
        ).as('on_leave'),
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'late')
            .then(1)
            .else(0)
        ).as('late'),
      ])
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('attendance_date', '>=', fromDate)
      .where('attendance_date', '<=', toDate)
      .groupBy('attendance_date')
      .orderBy('attendance_date', 'asc')
      .execute();

    // Distribution data
    const distribution = [
      { status: 'present', count: present },
      { status: 'absent', count: absent },
      { status: 'on_leave', count: onLeave },
      { status: 'late', count: late },
    ];

    return {
      totalDays,
      present,
      absent,
      onLeave,
      late,
      attendanceRate,
      dailyTrend: dailyTrend.map(d => ({
        date: d.date,
        present: Number(d.present || 0),
        absent: Number(d.absent || 0),
        onLeave: Number(d.on_leave || 0),
        late: Number(d.late || 0),
      })),
      distribution: distribution.filter(d => d.count > 0),
      records: records.map(r => ({
        ...r,
        status: r.status,
        method: r.method,
        markedAt: r.marked_at,
      })),
    };
  });

  // GET attendance export
  fastify.get('/attendance/export', {
    preHandler: [
      requirePermission(PERMISSIONS.REPORT_EXPORT),
      ensureTenantIsolation('report'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        studentId: z.string().uuid().optional(),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        format: z.enum(['csv', 'xlsx']).default('csv'),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, studentId, from, to, format } = request.query as any;
    const orgId = request.tenant.orgId;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    let query = db
      .selectFrom('hms.attendance')
      .innerJoin('hms.allocation', 'hms.allocation.apex_student_id', 'hms.attendance.apex_student_id')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.attendance.apex_student_id',
        'hms.attendance.attendance_date',
        'hms.attendance.status',
        'hms.attendance.method',
        'hms.attendance.marked_at',
        'hms.room.room_number',
        'hms.bed.bed_label',
      ])
      .where('hms.attendance.org_id', '=', orgId)
      .where('hms.attendance.hostel_id', '=', hostelId)
      .where('hms.attendance.attendance_date', '>=', fromDate)
      .where('hms.attendance.attendance_date', '<=', toDate);

    if (studentId) {
      query = query.where('hms.attendance.apex_student_id', '=', studentId);
    }

    const data = await query.execute();

    if (format === 'csv') {
      const headers = ['Student ID', 'Date', 'Status', 'Method', 'Marked At', 'Room', 'Bed'];
      const rows = data.map(r => [
        r.apex_student_id,
        r.attendance_date.toISOString().split('T')[0],
        r.status,
        r.method,
        r.marked_at?.toISOString() || '',
        r.room_number,
        r.bed_label,
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename=attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
      return csv;
    }

    // XLSX placeholder
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename=attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    return Buffer.from('XLSX placeholder');
  });
}