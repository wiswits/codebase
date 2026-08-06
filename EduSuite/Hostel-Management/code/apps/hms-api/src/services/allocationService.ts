import { db } from '../db';
import { feeService } from './feeService';
import { notificationService } from './notificationService';
import type { CreateAllocation, VacateAllocation } from '@shared/schemas/allocation';

export class AllocationService {
  async getAllocations(orgId: string, params: {
    hostelId?: string;
    active?: boolean;
    studentId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { hostelId, active, studentId, limit = 50, cursor } = params;

    let query = db
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

    return { data, nextCursor, hasMore, limit };
  }

  async getStudentResidency(orgId: string, studentId: string) {
    const allocation = await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .innerJoin('hms.hostel', 'hms.hostel.id', 'hms.building.hostel_id')
      .select([
        'hms.allocation.*',
        'hms.bed.bed_label',
        'hms.bed.rent_tier',
        'hms.room.room_number',
        'hms.room.room_type',
        'hms.floor.floor_number',
        'hms.wing.code as wing_code',
        'hms.building.name as building_name',
        'hms.hostel.name as hostel_name',
      ])
      .where('hms.allocation.apex_student_id', '=', studentId)
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.vacated_at', 'is', null)
      .executeTakeFirst();

    return allocation || null;
  }

  async createAllocation(orgId: string, userId: string, data: CreateAllocation) {
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
      .where('hms.bed.id', '=', data.bedId)
      .where('hms.bed.org_id', '=', orgId)
      .where('hms.bed.status', '=', 'vacant')
      .executeTakeFirst();

    if (!bed) {
      throw new Error('BED_NOT_AVAILABLE');
    }

    // Check if student already has active allocation
    const existingAllocation = await db
      .selectFrom('hms.allocation')
      .select('id')
      .where('apex_student_id', '=', data.apexStudentId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (existingAllocation) {
      throw new Error('STUDENT_ALREADY_ALLOCATED');
    }

    // Fetch student from APEX for validation
    const student = await this.fetchStudentFromAPEX(data.apexStudentId);
    
    // Check gender compatibility
    if (student.gender !== bed.hostel_type && bed.hostel_type !== 'coed') {
      throw new Error('GENDER_MISMATCH');
    }

    // Check fee clearance
    if (!student.feeClearanceFlag) {
      throw new Error('FEE_NOT_CLEARED');
    }

    // Create allocation
    const allocation = await db
      .insertInto('hms.allocation')
      .values({
        org_id: orgId,
        bed_id: data.bedId,
        apex_student_id: data.apexStudentId,
        hostel_id: bed.hostel_id,
        allocated_by: userId,
        allocated_at: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    // Update bed status
    await db
      .updateTable('hms.bed')
      .set({ status: 'occupied' })
      .where('id', '=', data.bedId)
      .where('org_id', '=', orgId)
      .execute();

    // Create fee charge
    const feeCharge = await feeService.createRentCharge(
      orgId,
      data.apexStudentId,
      bed.rent_tier,
      allocation!.id
    );

    // Send notification
    await notificationService.emit({
      type: 'allocation_created',
      recipient: data.apexStudentId,
      data: { allocationId: allocation!.id, bedId: data.bedId },
    });

    return {
      allocation,
      bed,
      rentPaise: feeCharge?.amountPaise,
      apexLedgerId: feeCharge?.ledgerId,
    };
  }

  async vacateAllocation(orgId: string, userId: string, id: string, data: VacateAllocation) {
    // Get allocation
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      throw new Error('ALLOCATION_NOT_FOUND');
    }

    // Update allocation
    const updatedAllocation = await db
      .updateTable('hms.allocation')
      .set({
        vacated_at: new Date(),
        vacate_reason: data.reason,
      })
      .where('id', '=', id)
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

    // Process damage charges
    if (data.damageCharges && data.damageCharges > 0) {
      await feeService.createDamageCharge(
        orgId,
        allocation.apex_student_id,
        data.damageCharges,
        allocation.id
      );
    }

    // Send notification
    await notificationService.emit({
      type: 'allocation_vacated',
      recipient: allocation.apex_student_id,
      data: { allocationId: id, reason: data.reason },
    });

    return updatedAllocation!;
  }

  private async fetchStudentFromAPEX(studentId: string) {
    // In production, call APEX student API
    // This is a mock implementation
    return {
      id: studentId,
      gender: 'boys',
      feeClearanceFlag: true,
    };
  }
}

export const allocationService = new AllocationService();