import { db } from '../db';
import type { Attendance, NewAttendance } from '../db/types';

export class AttendanceModel {
  static async create(data: NewAttendance): Promise<Attendance> {
    const attendance = await db
      .insertInto('hms.attendance')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return attendance!;
  }

  static async upsert(data: NewAttendance): Promise<Attendance> {
    const attendance = await db
      .insertInto('hms.attendance')
      .values(data)
      .onConflict((oc) => 
        oc.columns(['apex_student_id', 'attendance_date'])
          .doUpdateSet({
            status: data.status,
            method: data.method,
            marked_by: data.marked_by,
            marked_at: data.marked_at,
            device_id: data.device_id || null,
          })
      )
      .returningAll()
      .executeTakeFirst();
    return attendance!;
  }

  static async findByStudentAndDate(studentId: string, date: Date, orgId: string): Promise<Attendance | null> {
    const attendance = await db
      .selectFrom('hms.attendance')
      .selectAll()
      .where('apex_student_id', '=', studentId)
      .where('org_id', '=', orgId)
      .where('attendance_date', '=', date)
      .executeTakeFirst();
    return attendance || null;
  }

  static async findByHostelAndDate(hostelId: string, date: Date, orgId: string) {
    return await db
      .selectFrom('hms.attendance')
      .selectAll()
      .where('hostel_id', '=', hostelId)
      .where('org_id', '=', orgId)
      .where('attendance_date', '=', date)
      .orderBy('marked_at', 'desc')
      .execute();
  }

  static async getRoster(hostelId: string, date: Date, orgId: string) {
    // Get all active allocations
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

    return allocations.map(alloc => ({
      studentId: alloc.apex_student_id,
      studentName: alloc.apex_student_id,
      roomNumber: alloc.room_number,
      bedLabel: alloc.bed_label,
      status: attendanceMap.get(alloc.apex_student_id)?.status || null,
      attendanceId: attendanceMap.get(alloc.apex_student_id)?.id || null,
    }));
  }

  static async getMissingStudents(hostelId: string, date: Date, orgId: string) {
    const roster = await this.getRoster(hostelId, date, orgId);
    return roster.filter(s => !s.status || s.status === 'absent');
  }
}