import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function roomRoutes(fastify: FastifyInstance) {
  // GET rooms by floor
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.ROOM_READ),
      ensureTenantIsolation('room'),
    ],
    schema: {
      querystring: z.object({
        floorId: z.string().uuid(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        roomType: z.enum(['single', 'double', 'triple', 'dorm']).optional(),
      }),
    },
  }, async (request, reply) => {
    const { floorId, limit, cursor, roomType } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.room')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('floor_id', '=', floorId);

    if (roomType) {
      query = query.where('room_type', '=', roomType);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('room_number', 'asc').limit(limit + 1);

    const rooms = await query.execute();
    const hasMore = rooms.length > limit;
    const data = hasMore ? rooms.slice(0, -1) : rooms;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // GET room with beds
  fastify.get('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.ROOM_READ),
      ensureTenantIsolation('room'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const orgId = request.tenant.orgId;

    const room = await db
      .selectFrom('hms.room')
      .selectAll()
      .where('id', '=', id)
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
      .selectFrom('hms.bed')
      .selectAll()
      .where('room_id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    return { ...room, beds };
  });

  // POST create room
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.ROOM_CREATE),
      ensureTenantIsolation('room'),
    ],
    schema: {
      body: z.object({
        floorId: z.string().uuid(),
        roomNumber: z.string().min(1).max(10),
        roomType: z.enum(['single', 'double', 'triple', 'dorm']),
        maxCapacity: z.number().int().min(1),
        furniture: z.record(z.unknown()).default({}),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    // Verify floor exists
    const floor = await db
      .selectFrom('hms.floor')
      .select('id')
      .where('id', '=', body.floorId)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!floor) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Floor not found',
        },
      });
    }

    const room = await db
      .insertInto('hms.room')
      .values({
        org_id: orgId,
        floor_id: body.floorId,
        room_number: body.roomNumber,
        room_type: body.roomType,
        max_capacity: body.maxCapacity,
        furniture: body.furniture,
      })
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'room.create',
        entity: 'room',
        entityId: room.id,
        after: room,
      });
    }

    return reply.status(201).send(room);
  });

  // DELETE room
  fastify.delete('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.ROOM_DELETE),
      ensureTenantIsolation('room'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const orgId = request.tenant.orgId;

    const existing = await db
      .selectFrom('hms.room')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Room not found',
        },
      });
    }

    await db
      .deleteFrom('hms.room')
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    if (request.audit) {
      await request.audit({
        action: 'room.delete',
        entity: 'room',
        entityId: id,
        before: existing,
      });
    }

    return reply.status(204).send();
  });
}