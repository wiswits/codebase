import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function bedRoutes(fastify: FastifyInstance) {
  // GET beds with filters
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.BED_READ),
      ensureTenantIsolation('bed'),
    ],
    schema: {
      querystring: z.object({
        status: z.enum(['vacant', 'occupied', 'blocked', 'reserved']).optional(),
        hostelId: z.string().uuid().optional(),
        roomType: z.enum(['single', 'double', 'triple', 'dorm']).optional(),
        gender: z.enum(['boys', 'girls', 'coed']).optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { status, hostelId, roomType, gender, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.bed')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .innerJoin('hms.hostel', 'hms.hostel.id', 'hms.building.hostel_id')
      .select([
        'hms.bed.id',
        'hms.bed.org_id',
        'hms.bed.room_id',
        'hms.bed.bed_label',
        'hms.bed.bed_type',
        'hms.bed.rent_tier',
        'hms.bed.status',
        'hms.room.room_number',
        'hms.room.room_type',
        'hms.floor.floor_number',
        'hms.wing.code as wing_code',
        'hms.building.name as building_name',
        'hms.hostel.name as hostel_name',
        'hms.hostel.type as hostel_type',
      ])
      .where('hms.bed.org_id', '=', orgId);

    if (status) {
      query = query.where('hms.bed.status', '=', status);
    }

    if (hostelId) {
      query = query.where('hms.hostel.id', '=', hostelId);
    }

    if (roomType) {
      query = query.where('hms.room.room_type', '=', roomType);
    }

    if (gender) {
      query = query.where('hms.hostel.type', '=', gender);
    }

    if (cursor) {
      query = query.where('hms.bed.id', '>', cursor);
    }

    query = query.orderBy('hms.bed.created_at', 'desc').limit(limit + 1);

    const beds = await query.execute();
    const hasMore = beds.length > limit;
    const data = hasMore ? beds.slice(0, -1) : beds;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // POST create bulk beds
  fastify.post('/rooms/:roomId/beds/bulk', {
    preHandler: [
      requirePermission(PERMISSIONS.BED_CREATE),
      ensureTenantIsolation('bed'),
    ],
    schema: {
      params: z.object({
        roomId: z.string().uuid(),
      }),
      body: z.object({
        bedLabels: z.array(z.string()).min(1).max(20),
        bedType: z.string().optional(),
        rentTier: z.string().min(1),
      }),
    },
  }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    // Verify room exists
    const room = await db
      .selectFrom('hms.room')
      .select('id')
      .where('id', '=', roomId)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!room) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    const beds = await db
      .insertInto('hms.bed')
      .values(
        body.bedLabels.map((label: string) => ({
          org_id: orgId,
          room_id: roomId,
          bed_label: label,
          bed_type: body.bedType || null,
          rent_tier: body.rentTier,
          status: 'vacant',
        }))
      )
      .returningAll()
      .execute();

    if (request.audit) {
      await request.audit({
        action: 'bed.bulk_create',
        entity: 'bed',
        entityId: roomId,
        after: beds,
      });
    }

    return reply.status(201).send(beds);
  });

  // PATCH update bed status
  fastify.patch('/:id/status', {
    preHandler: [
      requirePermission(PERMISSIONS.BED_UPDATE),
      ensureTenantIsolation('bed'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        status: z.enum(['blocked', 'unblocked']),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'blocked' | 'unblocked' };
    const orgId = request.tenant.orgId;

    const existing = await db
      .selectFrom('hms.bed')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Bed not found',
        },
      });
    }

    // Check if bed is occupied (can't block occupied bed)
    if (existing.status === 'occupied' && status === 'blocked') {
      return reply.status(409).send({
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Cannot block an occupied bed',
        },
      });
    }

    const newStatus = status === 'blocked' ? 'blocked' : 'vacant';

    const bed = await db
      .updateTable('hms.bed')
      .set({ status: newStatus })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'bed.status_update',
        entity: 'bed',
        entityId: id,
        before: existing,
        after: bed,
      });
    }

    return bed;
  });
}