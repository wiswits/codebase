import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function buildingRoutes(fastify: FastifyInstance) {
  // GET buildings by hostel
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.BUILDING_READ),
      ensureTenantIsolation('building'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.building')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId);

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('created_at', 'desc').limit(limit + 1);

    const buildings = await query.execute();
    const hasMore = buildings.length > limit;
    const data = hasMore ? buildings.slice(0, -1) : buildings;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // POST create building
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.BUILDING_CREATE),
      ensureTenantIsolation('building'),
    ],
    schema: {
      body: z.object({
        hostelId: z.string().uuid(),
        code: z.string().min(1).max(20),
        name: z.string().min(1).max(100),
        caretakerUserId: z.string().uuid().optional(),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    // Verify hostel exists
    const hostel = await db
      .selectFrom('hms.hostel')
      .select('id')
      .where('id', '=', body.hostelId)
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

    const building = await db
      .insertInto('hms.building')
      .values({
        org_id: orgId,
        hostel_id: body.hostelId,
        code: body.code,
        name: body.name,
        caretaker_user_id: body.caretakerUserId,
      })
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'building.create',
        entity: 'building',
        entityId: building.id,
        after: building,
      });
    }

    return reply.status(201).send(building);
  });

  // PUT update building
  fastify.put('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.BUILDING_UPDATE),
      ensureTenantIsolation('building'),
    ],
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        code: z.string().min(1).max(20).optional(),
        name: z.string().min(1).max(100).optional(),
        caretakerUserId: z.string().uuid().nullable().optional(),
      }),
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    const existing = await db
      .selectFrom('hms.building')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Building not found',
        },
      });
    }

    const building = await db
      .updateTable('hms.building')
      .set({
        code: body.code,
        name: body.name,
        caretaker_user_id: body.caretakerUserId,
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'building.update',
        entity: 'building',
        entityId: id,
        before: existing,
        after: building,
      });
    }

    return building;
  });

  // DELETE building
  fastify.delete('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.BUILDING_DELETE),
      ensureTenantIsolation('building'),
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
      .selectFrom('hms.building')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Building not found',
        },
      });
    }

    await db
      .deleteFrom('hms.building')
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    if (request.audit) {
      await request.audit({
        action: 'building.delete',
        entity: 'building',
        entityId: id,
        before: existing,
      });
    }

    return reply.status(204).send();
  });
}