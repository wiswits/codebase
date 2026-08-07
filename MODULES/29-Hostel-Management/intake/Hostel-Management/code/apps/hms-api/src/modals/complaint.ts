import { db } from '../db';
import type { Complaint, NewComplaint } from '../db/types';

export class ComplaintModel {
  static async create(data: NewComplaint): Promise<Complaint> {
    const complaint = await db
      .insertInto('hms.complaint')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return complaint!;
  }

  static async findById(id: string, orgId: string): Promise<Complaint | null> {
    const complaint = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();
    return complaint || null;
  }

  static async findAll(orgId: string, params: {
    hostelId?: string;
    status?: string;
    assignedTo?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { hostelId, status, assignedTo, limit = 50, cursor } = params;

    let query = db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('org_id', '=', orgId);

    if (hostelId) {
      query = query.where('hostel_id', '=', hostelId);
    }

    if (status) {
      query = query.where('status', '=', status);
    }

    if (assignedTo) {
      query = query.where('assigned_to', '=', assignedTo);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    return await query.execute();
  }

  static async updateStatus(id: string, orgId: string, status: string, data?: {
    assignedTo?: string;
    resolvedAt?: Date;
    closedAt?: Date;
  }): Promise<Complaint | null> {
    const updateData: any = { status };
    if (data?.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
    if (data?.resolvedAt) updateData.resolved_at = data.resolvedAt;
    if (data?.closedAt) updateData.closed_at = data.closedAt;

    const complaint = await db
      .updateTable('hms.complaint')
      .set(updateData)
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();
    return complaint || null;
  }

  static async assign(id: string, assignedTo: string, orgId: string): Promise<Complaint | null> {
    const complaint = await db
      .updateTable('hms.complaint')
      .set({
        assigned_to: assignedTo,
        status: 'assigned',
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'open')
      .returningAll()
      .executeTakeFirst();
    return complaint || null;
  }

  static async resolve(id: string, orgId: string): Promise<Complaint | null> {
    const complaint = await db
      .updateTable('hms.complaint')
      .set({
        status: 'resolved',
        resolved_at: new Date(),
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', 'in', ['assigned', 'in_progress'])
      .returningAll()
      .executeTakeFirst();
    return complaint || null;
  }

  static async close(id: string, orgId: string): Promise<Complaint | null> {
    const complaint = await db
      .updateTable('hms.complaint')
      .set({
        status: 'closed',
        closed_at: new Date(),
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'resolved')
      .returningAll()
      .executeTakeFirst();
    return complaint || null;
  }

  static async getOpenComplaints(orgId: string, hostelId?: string): Promise<Complaint[]> {
    let query = db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('status', 'not in', ['resolved', 'closed']);

    if (hostelId) {
      query = query.where('hostel_id', '=', hostelId);
    }

    return await query.execute();
  }
}