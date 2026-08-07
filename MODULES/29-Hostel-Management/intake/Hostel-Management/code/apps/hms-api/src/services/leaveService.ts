import { db } from '../db';
import { notificationService } from './notificationService';
import type { CreateLeaveRequest } from '@shared/schemas/leave';

export class LeaveService {
  async createLeaveRequest(orgId: string, userId: string, data: CreateLeaveRequest) {
    // Verify student has active allocation
    const allocation = await db
      .selectFrom('hms.allocation')
      .select('hostel_id')
      .where('apex_student_id', '=', data.apexStudentId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      throw new Error('STUDENT_NOT_ALLOCATED');
    }

    // Check for overlapping leave
    const overlapping = await db
      .selectFrom('hms.leave_request')
      .select('id')
      .where('apex_student_id', '=', data.apexStudentId)
      .where('org_id', '=', orgId)
      .where('status', 'in', ['pending_parent', 'pending_warden', 'approved'])
      .where((eb) => 
        eb.or([
          eb.and([
            eb('from_ts', '<=', data.fromTs),
            eb('to_ts', '>=', data.fromTs),
          ]),
          eb.and([
            eb('from_ts', '<=', data.toTs),
            eb('to_ts', '>=', data.toTs),
          ]),
          eb.and([
            eb('from_ts', '>=', data.fromTs),
            eb('to_ts', '<=', data.toTs),
          ]),
        ])
      )
      .executeTakeFirst();

    if (overlapping) {
      throw new Error('OVERLAPPING_LEAVE');
    }

    // Get hostel config for parent approval
    const config = await db
      .selectFrom('hms.hostel_config')
      .select('parent_approval_required')
      .where('hostel_id', '=', allocation.hostel_id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    const parentApprovalRequired = config?.parent_approval_required ?? true;
    const initialStatus = parentApprovalRequired ? 'pending_parent' : 'pending_warden';

    const leave = await db
      .insertInto('hms.leave_request')
      .values({
        org_id: orgId,
        hostel_id: allocation.hostel_id,
        apex_student_id: data.apexStudentId,
        from_ts: data.fromTs,
        to_ts: data.toTs,
        reason: data.reason,
        status: initialStatus,
      })
      .returningAll()
      .executeTakeFirst();

    // Send notification
    await notificationService.emit({
      type: 'leave_request_created',
      recipient: data.apexStudentId,
      data: { leaveId: leave!.id },
    });

    return leave!;
  }

  async approveLeave(orgId: string, userId: string, id: string, role: 'parent' | 'warden') {
    const statusFilter = role === 'parent' ? 'pending_parent' : 'pending_warden';

    const leave = await db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', statusFilter)
      .executeTakeFirst();

    if (!leave) {
      throw new Error('LEAVE_NOT_FOUND');
    }

    let updatedLeave;

    if (role === 'parent') {
      updatedLeave = await db
        .updateTable('hms.leave_request')
        .set({
          status: 'pending_warden',
          parent_decided_by: userId,
          parent_decided_at: new Date(),
        })
        .where('id', '=', id)
        .where('org_id', '=', orgId)
        .returningAll()
        .executeTakeFirst();

      // Notify warden
      await notificationService.emit({
        type: 'leave_warden_approval_required',
        recipient: leave.apex_student_id,
        data: { leaveId: id },
      });

    } else {
      updatedLeave = await db
        .updateTable('hms.leave_request')
        .set({
          status: 'approved',
          warden_decided_by: userId,
          warden_decided_at: new Date(),
        })
        .where('id', '=', id)
        .where('org_id', '=', orgId)
        .returningAll()
        .executeTakeFirst();

      // Generate gate pass
      const gatePass = await db
        .insertInto('hms.gate_pass')
        .values({
          org_id: orgId,
          leave_id: id,
          pass_code: this.generateGatePassCode(id),
          valid_from: leave.from_ts,
          valid_to: leave.to_ts,
        })
        .returningAll()
        .executeTakeFirst();

      // Notify student
      await notificationService.emit({
        type: 'leave_approved',
        recipient: leave.apex_student_id,
        data: { leaveId: id, gatePassId: gatePass!.id },
      });
    }

    return updatedLeave!;
  }

  async rejectLeave(orgId: string, userId: string, id: string, reason: string, role: 'parent' | 'warden') {
    const statusFilter = role === 'parent' ? 'pending_parent' : 'pending_warden';

    const leave = await db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', statusFilter)
      .executeTakeFirst();

    if (!leave) {
      throw new Error('LEAVE_NOT_FOUND');
    }

    const updatedLeave = await db
      .updateTable('hms.leave_request')
      .set({
        status: 'rejected',
        reject_reason: reason,
        ...(role === 'parent' 
          ? { parent_decided_by: userId, parent_decided_at: new Date() }
          : { warden_decided_by: userId, warden_decided_at: new Date() }
        ),
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    // Notify student
    await notificationService.emit({
      type: 'leave_rejected',
      recipient: leave.apex_student_id,
      data: { leaveId: id, reason },
    });

    return updatedLeave!;
  }

  async cancelLeave(orgId: string, id: string) {
    const leave = await db
      .selectFrom('hms.leave_request')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', 'in', ['pending_parent', 'pending_warden'])
      .executeTakeFirst();

    if (!leave) {
      throw new Error('LEAVE_NOT_FOUND');
    }

    if (new Date(leave.from_ts) < new Date()) {
      throw new Error('LEAVE_ALREADY_STARTED');
    }

    const updatedLeave = await db
      .updateTable('hms.leave_request')
      .set({ status: 'cancelled' })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    return updatedLeave!;
  }

  async getGatePasses(orgId: string, params: {
    hostelId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { hostelId, limit = 50, cursor } = params;

    let query = db
      .selectFrom('hms.gate_pass')
      .innerJoin('hms.leave_request', 'hms.leave_request.id', 'hms.gate_pass.leave_id')
      .select([
        'hms.gate_pass.*',
        'hms.leave_request.apex_student_id',
        'hms.leave_request.reason',
        'hms.leave_request.hostel_id',
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

    return { data, nextCursor, hasMore, limit };
  }

  async scanGatePass(orgId: string, userId: string, code: string, direction: 'exit' | 'entry') {
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
        'hms.leave_request.hostel_id',
      ])
      .where('hms.gate_pass.pass_code', '=', code)
      .where('hms.gate_pass.org_id', '=', orgId)
      .where('hms.gate_pass.valid_from', '<=', new Date())
      .where('hms.gate_pass.valid_to', '>=', new Date())
      .executeTakeFirst();

    if (!gatePass) {
      throw new Error('INVALID_GATE_PASS');
    }

    if (gatePass.leave_status !== 'approved') {
      throw new Error('LEAVE_NOT_APPROVED');
    }

    // Check if already scanned
    if (direction === 'exit' && gatePass.exit_scanned_at) {
      throw new Error('ALREADY_SCANNED');
    }

    if (direction === 'entry' && gatePass.entry_scanned_at) {
      throw new Error('ALREADY_SCANNED');
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

    // If entry is scanned, mark attendance
    if (direction === 'entry') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db
        .insertInto('hms.attendance')
        .values({
          org_id: orgId,
          hostel_id: gatePass.hostel_id || '',
          apex_student_id: gatePass.apex_student_id,
          attendance_date: today,
          status: 'present',
          method: 'qr',
          marked_by: userId,
          marked_at: new Date(),
        })
        .onConflict((oc) =>
          oc.columns(['apex_student_id', 'attendance_date'])
            .doUpdateSet({
              status: 'present',
              method: 'qr',
              marked_by: userId,
              marked_at: new Date(),
            })
        )
        .execute();
    }

    return updatedGatePass!;
  }

  private generateGatePassCode(leaveId: string): string {
    const timestamp = Date.now().toString(36);
    const shortId = leaveId.split('-')[0];
    return `GP-${shortId}-${timestamp.toUpperCase()}`;
  }
}

export const leaveService = new LeaveService();