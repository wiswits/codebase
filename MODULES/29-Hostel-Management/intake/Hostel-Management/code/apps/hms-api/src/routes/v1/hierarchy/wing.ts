import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function wingRoutes(fastify: FastifyInstance) {
  // GET wings by building
  fastify.get('/', {
    preHandler: [
      requirePermission(PERMISSIONS.WING_READ),
      ensureTenantIsolation('wing'),
    ],
    schema: {
      querystring: z.object({
        buildingId: z.string().uuid(),
        limit: z.coerce.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { buildingId, limit, cursor } = request.query as any;
    const orgId = request.tenant.orgId;

    let query = db
      .selectFrom('hms.wing')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('building_id', '=', buildingId);

    if (cursor) {
      query = query.where('id', '>', cursor);
    }

    query = query.orderBy('code', 'asc').limit(limit + 1);

    const wings = await query.execute();
    const hasMore = wings.length > limit;
    const data = hasMore ? wings.slice(0, -1) : wings;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return {
      data,
      nextCursor,
      hasMore,
      limit,
    };
  });

  // POST create wing
  fastify.post('/', {
    preHandler: [
      requirePermission(PERMISSIONS.WING_CREATE),
      ensureTenantIsolation('wing'),
    ],
    schema: {
      body: z.object({
        buildingId: z.string().uuid(),
        code: z.string().min(1).max(20),
        direction: z.enum(['E', 'W', 'N', 'S']).optional(),
        caretakerUserId: z.string().uuid().optional(),
      }),
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const orgId = request.tenant.orgId;

    // Verify building exists
    const building = await db
      .selectFrom('hms.building')
      .select('id')
      .where('id', '=', body.buildingId)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!building) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Building not found',
        },
      });
    }

    const wing = await db
      .insertInto('hms.wing')
      .values({
        org_id: orgId,
        building_id: body.buildingId,
        code: body.code,
        direction: body.direction,
        caretaker_user_id: body.caretakerUserId,
      })
      .returningAll()
      .executeTakeFirst();

    if (request.audit) {
      await request.audit({
        action: 'wing.create',
        entity: 'wing',
        entityId: wing.id,
        after: wing,
      });
    }

    return reply.status(201).send(wing);
  });

  // DELETE wing
  fastify.delete('/:id', {
    preHandler: [
      requirePermission(PERMISSIONS.WING_DELETE),
      ensureTenantIsolation('wing'),
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
      .selectFrom('hms.wing')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!existing) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Wing not found',
        },
      });
    }

    await db
      .deleteFrom('hms.wing')
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    if (request.audit) {
      await request.audit({
        action: 'wing.delete',
        entity: 'wing',
        entityId: id,
        before: existing,
      });
    }

    return reply.status(204).send();
  });
}