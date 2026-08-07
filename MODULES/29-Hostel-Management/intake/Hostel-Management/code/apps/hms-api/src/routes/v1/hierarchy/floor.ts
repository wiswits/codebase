import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function floorRoutes(fastify: FastifyInstance) {
  // GET floors by wing
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.FLOOR_READ),
      ensureTenantIsolation('floor'),
    ],
    schema: {
      querystring: z.object({
        wingId: z.string().uuid(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { wingId, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.floor')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('wing_id', '=', wingId);

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('floor_number', 'asc').limit(limit + 1);

    const floors = await query.execute();
    const hasMore = floors.length > limit;
    const data = hasMore ? floors.slice(0, -1) : floors;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // POST create floor
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.FLOOR_CREATE),
      ensureTenantIsolation('floor'),
    ],
    schema: {
      body: z.object({
        wingId: z.string().uuid(),
        floorNumber: z.number().int().min(0),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    // Verify wing exists
    const wing = await db
      .selectFrom('hms.wing')
      .select('id')
      .where('id', '=', body.wingId)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!wing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Wing not found',
        },
      });
    }

    const floor = await db
      .insertInto('hms.floor')
      .values({
        org_id: orgId,
        wing_id: body.wingId,
        floor_number: body.floorNumber,
      })
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'floor.create',
        entity: 'floor',
        entityId: floor.id,
        after: floor,
      });
    }

    return reply.status(201).send(floor);
  });

  // DELETE floor
  fastify.delete('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.FLOOR_DELETE),
      ensureTenantIsolation('floor'),
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
      .selectFrom('hms.floor')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Floor not found',
        },
      });
    }

    await db
      .deleteFrom('hms.floor')
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    if (request.audit) {
      await request.audit({
        action: 'floor.delete',
        entity: 'floor',
        entityId: id,
        before: existing,
      });
    }

    return reply.status(204).send();
  });
}