import { db } from '../db';
import { notificationService } from './notificationService';
import { config } from '../config';
import type { ComplaintStatus } from '@shared/schemas/complaint';

export class ComplaintService {
  async createComplaint(orgId: string, userId: string, data: {
    category: string;
    description: string;
    photoKeys?: string[];
  }) {
    // Get student's hostel
    const allocation = await db
      .selectFrom('hms.allocation')
      .select('hostel_id')
      .where('apex_student_id', '=', userId)
      .where('org_id', '=', orgId)
      .where('vacated_at', 'is', null)
      .executeTakeFirst();

    if (!allocation) {
      throw new Error('STUDENT_NOT_ALLOCATED');
    }

    const complaint = await db
      .insertInto('hms.complaint')
      .values({
        org_id: orgId,
        hostel_id: allocation.hostel_id,
        raised_by: userId,
        category: data.category,
        description: data.description,
        photo_keys: data.photoKeys || [],
        status: 'open',
      })
      .returningAll()
      .executeTakeFirst();

    // Notify admin
    await notificationService.emit({
      type: 'complaint_created',
      recipient: 'admin',
      data: { complaintId: complaint!.id },
    });

    return complaint!;
  }

  async getComplaints(orgId: string, params: {
    hostelId?: string;
    status?: ComplaintStatus;
    assignedToMe?: boolean;
    userId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { hostelId, status, assignedToMe, userId, limit = 50, cursor } = params;

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

    if (assignedToMe && userId) {
      query = query.where('assigned_to', '=', userId);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    const complaints = await query.execute();
    const hasMore = complaints.length > limit;
    const data = hasMore ? complaints.slice(0, -1) : complaints;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return { data, nextCursor, hasMore, limit };
  }

  async getComplaintById(orgId: string, id: string) {
    const complaint = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!complaint) {
      throw new Error('COMPLAINT_NOT_FOUND');
    }

    return complaint;
  }

  async assignComplaint(orgId: string, id: string, assignedTo: string) {
    const existing = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'open')
      .executeTakeFirst();

    if (!existing) {
      throw new Error('COMPLAINT_NOT_FOUND');
    }

    const complaint = await db
      .updateTable('hms.complaint')
      .set({
        assigned_to: assignedTo,
        status: 'assigned',
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    // Notify assignee
    await notificationService.emit({
      type: 'complaint_assigned',
      recipient: assignedTo,
      data: { complaintId: id },
    });

    return complaint!;
  }

  async updateStatus(orgId: string, userId: string, id: string, status: ComplaintStatus) {
    const existing = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      throw new Error('COMPLAINT_NOT_FOUND');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      open: ['assigned'],
      assigned: ['in_progress'],
      in_progress: ['resolved'],
      resolved: ['closed', 'open'],
      closed: ['open'],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new Error('INVALID_TRANSITION');
    }

    // Only raised_by can confirm closure
    if (status === 'closed' && existing.raised_by !== userId) {
      throw new Error('FORBIDDEN');
    }

    const updateData: any = { status };

    if (status === 'resolved') {
      updateData.resolved_at = new Date();
    }

    if (status === 'closed') {
      updateData.closed_at = new Date();
    }

    const complaint = await db
      .updateTable('hms.complaint')
      .set(updateData)
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    // Notify student if resolved
    if (status === 'resolved') {
      await notificationService.emit({
        type: 'complaint_resolved',
        recipient: existing.raised_by,
        data: { complaintId: id },
      });

      // Schedule auto-close
      setTimeout(() => {
        this.autoCloseComplaint(orgId, id);
      }, config.autoCloseComplaintDays * 24 * 60 * 60 * 1000);
    }

    return complaint!;
  }

  async confirmResolution(orgId: string, userId: string, id: string) {
    const existing = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'resolved')
      .executeTakeFirst();

    if (!existing) {
      throw new Error('COMPLAINT_NOT_FOUND');
    }

    if (existing.raised_by !== userId) {
      throw new Error('FORBIDDEN');
    }

    const complaint = await db
      .updateTable('hms.complaint')
      .set({
        status: 'closed',
        closed_at: new Date(),
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    return complaint!;
  }

  private async autoCloseComplaint(orgId: string, id: string) {
    const existing = await db
      .selectFrom('hms.complaint')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .where('status', '=', 'resolved')
      .executeTakeFirst();

    if (existing) {
      await db
        .updateTable('hms.complaint')
        .set({
          status: 'closed',
          closed_at: new Date(),
        })
        .where('id', '=', id)
        .where('org_id', '=', orgId)
        .execute();
    }
  }
}

export const complaintService = new ComplaintService();