import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

const qrScanSchema = z.object({
  passCode: z.string().optional(),
  studentQr: z.string().optional(),
  deviceId: z.string().optional(),
});

export async function attendanceQRRoutes(fastify: FastifyInstance) {
  // POST QR scan attendance
  fastify.post('/qr-scan', {
    preHandler: [
      requirePermission(PERMISSIONS.ATTENDANCE_CREATE),
      ensureTenantIsolation('attendance'),
    ],
    schema: {
      body: qrScanSchema,
    },
  }, async (request, reply) => {
    const { passCode, studentQr, deviceId } = request.body as any;
    const orgId = request.tenant.orgId;
    const userId = request.user.apexUserId;

    let studentId: string | null = null;
    let hostelId: string | null = null;

    // Handle gate pass QR
    if (passCode) {
      const gatePass = await db
        .selectFrom('hms.gate_pass')
        .innerJoin('hms.leave_request', 'hms.leave_request.id', 'hms.gate_pass.leave_id')
        .innerJoin('hms.allocation', 'hms.allocation.apex_student_id', 'hms.leave_request.apex_student_id')
        .select([
          'hms.gate_pass.*',
          'hms.leave_request.apex_student_id',
          'hms.allocation.hostel_id',
        ])
        .where('hms.gate_pass.pass_code', '=', passCode)
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

      studentId = gatePass.apex_student_id;
      hostelId = gatePass.hostel_id;

      // Update gate pass scan
      await db
        .updateTable('hms.gate_pass')
        .set({
          exit_scanned_at: new Date(),
        })
        .where('id', '=', gatePass.id)
        .where('org_id', '=', orgId)
        .execute();

    } else if (studentQr) {
      // Handle student QR (direct attendance)
      // In production, decode student QR to get student ID
      // For now, we'll assume it's the student ID
      studentId = studentQr;

      // Get student's allocation
      const allocation = await db
        .selectFrom('hms.allocation')
        .select('hostel_id')
        .where('apex_student_id', '=', studentId)
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

      hostelId = allocation.hostel_id;
    } else {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Either passCode or studentQr is required',
        },
      });
    }

    // Create attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await db
      .insertInto('hms.attendance')
      .values({
        org_id: orgId,
        hostel_id: hostelId!,
        apex_student_id: studentId!,
        attendance_date: today,
        status: 'present',
        method: 'qr',
        marked_by: userId,
        marked_at: new Date(),
        device_id: deviceId || null,
      })
      .onConflict((oc) =>
        oc.columns(['apex_student_id', 'attendance_date'])
          .doUpdateSet({
            status: 'present',
            method: 'qr',
            marked_by: userId,
            marked_at: new Date(),
            device_id: deviceId || null,
          })
      )
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'attendance.qr_scan',
        entity: 'attendance',
        entityId: attendance.id,
        after: attendance,
      });
    }

    return {
      success: true,
      attendance,
      studentId: studentId,
    };
  });
}