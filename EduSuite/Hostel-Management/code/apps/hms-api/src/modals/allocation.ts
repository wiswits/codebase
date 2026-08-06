import { db } from '../db';
import type { Allocation, NewAllocation } from '../db/types';

export class AllocationModel {
  static async create(data: NewAllocation): Promise<Allocation> {
    const allocation = await db
      .insertInto('hms.allocation')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return allocation!;
  }

  static async findById(id: string, orgId: string): Promise<Allocation | null> {
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();
    return allocation || null;
  }

  static async findActiveByStudent(studentId: string, orgId: string): Promise<Allocation | null> {
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('apex_student_id', '=', studentId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();
    return allocation || null;
  }

  static async findActiveByBed(bedId: string, orgId: string): Promise<Allocation | null> {
    const allocation = await db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('bed_id', '=', bedId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();
    return allocation || null;
  }

  static async findAll(orgId: string, params: {
    hostelId?: string;
    active?: boolean;
    studentId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { hostelId, active, studentId, limit = 50, cursor } = params;

    let query = db
      .selectFrom('hms.allocation')
      .selectAll()
      .where('org_id', '=', orgId);

    if (hostelId) {
      query = query.where('hostel_id', '=', hostelId);
    }

    if (studentId) {
      query = query.where('apex_student_id', '=', studentId);
    }

    if (active !== undefined) {
      if (active) {
        query = query.where('vacated_at', 'is', null);
      } else {
        query = query.where('vacated_at', 'is not', null);
      }
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('allocated_at', 'desc').limit(limit + 1);

    return await query.execute();
  }

  static async vacate(id: string, orgId: string, data: {
    vacatedAt: Date;
    vacateReason: string;
  }): Promise<Allocation | null> {
    const allocation = await db
      .updateTable('hms.allocation')
      .set({
        vacated_at: data.vacatedAt,
        vacate_reason: data.vacateReason,
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();
    return allocation || null;
  }

  static async updateBed(allocationId: string, bedId: string, orgId: string): Promise<Allocation | null> {
    const allocation = await db
      .updateTable('hms.allocation')
      .set({ bed_id: bedId })
      .where('id', '=', allocationId)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();
    return allocation || null;
  }

  static async getStudentResidency(studentId: string, orgId: string) {
    return await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.allocation.*',
        'hms.bed.bed_label',
        'hms.bed.rent_tier',
        'hms.room.room_number',
      ])
      .where('hms.allocation.apex_student_id', '=', studentId)
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.vacated_at', 'is', null)
      .executeTakeFirst();
  }

  static async getOccupancySummary(orgId: string) {
    const totalBeds = await db
      .selectFrom('hms.bed')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    const occupiedBeds = await db
      .selectFrom('hms.allocation')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    const totalHostels = await db
      .selectFrom('hms.hostel')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .where('is_active', '=', true)
      .executeTakeFirst();

    return {
      totalBeds: Number(totalBeds?.count || 0),
      occupiedBeds: Number(occupiedBeds?.count || 0),
      totalHostels: Number(totalHostels?.count || 0),
    };
  }
}