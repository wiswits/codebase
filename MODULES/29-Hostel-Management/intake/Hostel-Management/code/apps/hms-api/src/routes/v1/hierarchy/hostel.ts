import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission, requireAnyPermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { createHostelSchema, updateHostelSchema } from '@shared/schemas/hostel';
import { PERMISSIONS } from '../../../lib/permissions';

export async function hostelRoutes(fastify: FastifyInstance) {
  // GET all hostels
  fastify.get('/', {
    preHandler: [
      requireAnyPermission([PERMISSIONS.HOSTEL_READ, PERMISSIONS.HOSTEL_CREATE]),
      ensureTenantIsolation('hostel'),
    ],
    schema: {
      querystring: z.object({
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        search: z.string().optional(),
        type: z.enum(['boys', 'girls', 'coed', 'staff']).optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request, reply) => {
    const { limit, cursor, search, type, isActive } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.hostel')
      .selectAll()
      .where('org_id', '=', orgId);

    if (search) {
      query = query.where((eb) => 
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('code', 'ilike', `%${search}%`),
        ])
      );
    }

    if (type) {
      query = query.where('type', '=', type);
    }

    if (isActive !== undefined) {
      query = query.where('is_active', '=', isActive);
    }

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    const hostels = await query.execute();
    const hasMore = hostels.length > limit;
    const data = hasMore ? hostels.slice(0, -1) : hostels;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // GET hostel by ID
  fastify.get('/:id', {
    preHandler: [
      requireAnyPermission([PERMISSIONS.HOSTEL_READ]),
      ensureTenantIsolation('hostel'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const orgId = request.tenant.orgId;

    const hostel = await db
      .selectFrom('hms.hostel')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!hostel) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Hostel not found',
        },
      });
    }

    return hostel;
  });

  // GET hostel tree (full hierarchy)
  fastify.get('/:id/tree', {
    preHandler: [
      requireAnyPermission([PERMISSIONS.HOSTEL_READ]),
      ensureTenantIsolation('hostel'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const orgId = request.tenant.orgId;

    // Get hostel
    const hostel = await db
      .selectFrom('hms.hostel')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!hostel) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Hostel not found',
        },
      });
    }

    // Get buildings with wings, floors, rooms, beds
    const buildings = await db
      .selectFrom('hms.building')
      .selectAll()
      .where('hostel_id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    const result = {
      hostel,
      buildings: await Promise.all(buildings.map(async (building) => {
        const wings = await db
          .selectFrom('hms.wing')
          .selectAll()
          .where('building_id', '=', building.id)
          .where('org_id', '=', orgId)
          .execute();

        return {
          ...building,
          wings: await Promise.all(wings.map(async (wing) => {
            const floors = await db
              .selectFrom('hms.floor')
              .selectAll()
              .where('wing_id', '=', wing.id)
              .where('org_id', '=', orgId)
              .execute();

            return {
              ...wing,
              floors: await Promise.all(floors.map(async (floor) => {
                const rooms = await db
                  .selectFrom('hms.room')
                  .selectAll()
                  .where('floor_id', '=', floor.id)
                  .where('org_id', '=', orgId)
                  .execute();

                return {
                  ...floor,
                  rooms: await Promise.all(rooms.map(async (room) => {
                    const beds = await db
                      .selectFrom('hms.bed')
                      .selectAll()
                      .where('room_id', '=', room.id)
                      .where('org_id', '=', orgId)
                      .execute();

                    return {
                      ...room,
                      beds,
                    };
                  })),
                };
              })),
            };
          })),
        };
      })),
    };

    return result;
  });

  // POST create hostel
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.HOSTEL_CREATE),
      ensureTenantIsolation('hostel'),
    ],
    schema: {
      body: createHostelSchema,
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    const hostel = await db
      .insertInto('hms.hostel')
      .values({
        org_id: orgId,
        campus_id: body.campusId,
        code: body.code,
        name: body.name,
        type: body.type,
        rules: body.rules || {},
        facilities: body.facilities || [],
        is_active: body.isActive !== undefined ? body.isActive : true,
      })
      .returningAll()
      .executeTakeFirst();

    // Audit log
    if (request.audit) {
      await request.audit({
        action: 'hostel.create',
        entity: 'hostel',
        entityId: hostel.id,
        after: hostel,
      });
    }

    return reply.status(201).send(hostel);
  });

  // PATCH update hostel
  fastify.patch('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.HOSTEL_UPDATE),
      ensureTenantIsolation('hostel'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateHostelSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    // Get existing hostel for audit
    const existing = await db
      .selectFrom('hms.hostel')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Hostel not found',
        },
      });
    }

    const hostel = await db
      .updateTable('hms.hostel')
      .set({
        code: body.code,
        name: body.name,
        type: body.type,
        rules: body.rules,
        facilities: body.facilities,
        is_active: body.isActive,
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    // Audit log
    if (request.audit) {
      await request.audit({
        action: 'hostel.update',
        entity: 'hostel',
        entityId: id,
        before: existing,
        after: hostel,
      });
    }

    return hostel;
  });

  // DELETE hostel
  fastify.delete('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.HOSTEL_DELETE),
      ensureTenantIsolation('hostel'),
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
      .selectFrom('hms.hostel')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Hostel not found',
        },
      });
    }

    await db
      .deleteFrom('hms.hostel')
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    // Audit log
    if (request.audit) {
      await request.audit({
        action: 'hostel.delete',
        entity: 'hostel',
        entityId: id,
        before: existing,
      });
    }

    return reply.status(204).send();
  });
}