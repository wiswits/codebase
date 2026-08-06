import { db } from '../db';
import type { LeaveRequest, GatePass, NewLeaveRequest, NewGatePass } from '../db/types';

export class LeaveModel {
  static async createLeave(data: NewLeaveRequest): Promise<LeaveRequest> {
    const leave = await db
      .insertInto('hms.leave_request')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return leave!;
  }

  static async findLeaveById(id: string, orgId: string): Promise<LeaveRequest | null> {
    const leave = await db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();
    return leave || null;
  }

  static async findLeaves(orgId: string, params: {
    hostelId?: string;
    status?: string;
    studentId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { hostelId, status, studentId, limit = 50, cursor } = params;

    let query = db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('org_id', '=', orgId);

    if (hostelId) {
      query = query.where('hostel_id', '=', hostelId);
    }

    if (status) {
      query = query.where('status', '=', status);
    }

    if (studentId) {
      query = query.where('apex_student_id', '=', studentId);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    return await query.execute();
  }

  static async updateLeaveStatus(id: string, orgId: string, data: {
    status: string;
    rejectReason?: string;
    parentDecidedBy?: string;
    parentDecidedAt?: Date;
    wardenDecidedBy?: string;
    wardenDecidedAt?: Date;
  }): Promise<LeaveRequest | null> {
    const leave = await db
      .updateTable('hms.leave_request')
      .set(data)
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();
    return leave || null;
  }

  static async createGatePass(data: NewGatePass): Promise<GatePass> {
    const gatePass = await db
      .insertInto('hms.gate_pass')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return gatePass!;
  }

  static async findGatePassByCode(code: string, orgId: string): Promise<GatePass | null> {
    const gatePass = await db
      .selectFrom('hms.gate_pass')
      .selectAll()
      .where('pass_code', '=', code)
      .where('org_id', '=', orgId)
      .where('valid_from', '<=', new Date())
      .where('valid_to', '>=', new Date())
      .executeTakeFirst();
    return gatePass || null;
  }

  static async scanGatePass(id: string, orgId: string, direction: 'exit' | 'entry'): Promise<GatePass | null> {
    const updateData = direction === 'exit' 
      ? { exit_scanned_at: new Date() }
      : { entry_scanned_at: new Date() };

    const gatePass = await db
      .updateTable('hms.gate_pass')
      .set(updateData)
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();
    return gatePass || null;
  }

  static async getActiveGatePasses(orgId: string, hostelId?: string) {
    let query = db
      .selectFrom('hms.gate_pass')
      .innerJoin('hms.leave_request', 'hms.leave_request.id', 'hms.gate_pass.leave_id')
      .selectAll('hms.gate_pass')
      .select(['hms.leave_request.apex_student_id', 'hms.leave_request.reason'])
      .where('hms.gate_pass.org_id', '=', orgId)
      .where('hms.gate_pass.valid_from', '<=', new Date())
      .where('hms.gate_pass.valid_to', '>=', new Date());

    if (hostelId) {
      query = query.where('hms.leave_request.hostel_id', '=', hostelId);
    }

    return await query.execute();
  }
}