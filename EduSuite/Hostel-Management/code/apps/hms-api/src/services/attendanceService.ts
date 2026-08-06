import { db } from '../db';
import { notificationService } from './notificationService';
import { config } from '../config';
import type { AttendanceStatus } from '@shared/schemas/attendance';

export class AttendanceService {
  async bulkMarkAttendance(orgId: string, userId: string, data: {
    hostelId: string;
    date: Date;
    records: Array<{
      studentId: string;
      status: AttendanceStatus;
    }>;
  }) {
    const results: any[] = [];
    const errors: any[] = [];

    // Get all active allocations for these students
    const studentIds = data.records.map(r => r.studentId);
    const allocations = await db
      .selectFrom('hms.allocation')
      .select(['apex_student_id', 'bed_id'])
      .where('org_id', '=', orgId)
      .where('apex_student_id', 'in', studentIds)
      .where('vacated_at', 'is', null)
      .execute();

    const allocatedStudents = new Set(allocations.map(a => a.apex_student_id));

    for (const record of data.records) {
      if (!allocatedStudents.has(record.studentId)) {
        errors.push({
          studentId: record.studentId,
          error: 'Student has no active allocation',
        });
        continue;
      }

      try {
        const attendance = await db
          .insertInto('hms.attendance')
          .values({
            org_id: orgId,
            hostel_id: data.hostelId,
            apex_student_id: record.studentId,
            attendance_date: data.date,
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

        // Alert if student is absent
        if (record.status === 'absent') {
          await this.handleAbsentStudent(orgId, record.studentId, data.hostelId, data.date);
        }

      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { results, errors };
  }

  async markAttendanceQR(orgId: string, userId: string, data: {
    passCode?: string;
    studentQr?: string;
    deviceId?: string;
  }) {
    let studentId: string | null = null;
    let hostelId: string | null = null;

    // Handle gate pass QR
    if (data.passCode) {
      const gatePass = await db
        .selectFrom('hms.gate_pass')
        .innerJoin('hms.leave_request', 'hms.leave_request.id', 'hms.gate_pass.leave_id')
        .innerJoin('hms.allocation', 'hms.allocation.apex_student_id', 'hms.leave_request.apex_student_id')
        .select([
          'hms.gate_pass.*',
          'hms.leave_request.apex_student_id',
          'hms.allocation.hostel_id',
        ])
        .where('hms.gate_pass.pass_code', '=', data.passCode)
        .where('hms.gate_pass.org_id', '=', orgId)
        .where('hms.gate_pass.valid_from', '<=', new Date())
        .where('hms.gate_pass.valid_to', '>=', new Date())
        .executeTakeFirst();

      if (!gatePass) {
        throw new Error('INVALID_GATE_PASS');
      }

      studentId = gatePass.apex_student_id;
      hostelId = gatePass.hostel_id;

      // Update gate pass scan
      await db
        .updateTable('hms.gate_pass')
        .set({ exit_scanned_at: new Date() })
        .where('id', '=', gatePass.id)
        .where('org_id', '=', orgId)
        .execute();

    } else if (data.studentQr) {
      // Handle student QR (direct attendance)
      studentId = data.studentQr;

      const allocation = await db
        .selectFrom('hms.allocation')
        .select('hostel_id')
        .where('apex_student_id', '=', studentId)
        .where('org_id', '=', orgId)
        .where('vacated_at', 'is', null)
        .executeTakeFirst();

      if (!allocation) {
        throw new Error('STUDENT_NOT_ALLOCATED');
      }

      hostelId = allocation.hostel_id;
    } else {
      throw new Error('INVALID_QR_DATA');
    }

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
        device_id: data.deviceId || null,
      })
      .onConflict((oc) =>
        oc.columns(['apex_student_id', 'attendance_date'])
          .doUpdateSet({
            status: 'present',
            method: 'qr',
            marked_by: userId,
            marked_at: new Date(),
            device_id: data.deviceId || null,
          })
      )
      .returningAll()
      .executeTakeFirst();

    return attendance!;
  }

  async getAttendanceRoster(orgId: string, hostelId: string, date: Date) {
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

    // Get attendance for the date
    const attendance = await db
      .selectFrom('hms.attendance')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('attendance_date', '=', date)
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
  }

  async getMissingStudents(orgId: string, hostelId: string, date: Date) {
    // Get all active allocations
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

    // Get attendance
    const attendance = await db
      .selectFrom('hms.attendance')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('attendance_date', '=', date)
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
      .where('from_ts', '<=', date)
      .where('to_ts', '>=', date)
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
        studentName: alloc.apex_student_id,
        roomNumber: alloc.room_number,
        status: 'absent' as const,
      }));

    return missing;
  }

  private async handleAbsentStudent(orgId: string, studentId: string, hostelId: string, date: Date) {
    // Check if parent alert is enabled
    const config = await db
      .selectFrom('hms.hostel_config')
      .select('alert_parent_on_absent')
      .where('hostel_id', '=', hostelId)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (config?.alert_parent_on_absent) {
      await notificationService.emit({
        type: 'student_absent',
        recipient: studentId,
        data: { hostelId, date },
      });
    }
  }
}

export const attendanceService = new AttendanceService();