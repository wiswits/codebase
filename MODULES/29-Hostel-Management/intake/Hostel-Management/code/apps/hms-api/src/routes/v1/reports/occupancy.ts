import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';

export async function occupancyReportRoutes(fastify: FastifyInstance) {
  // GET occupancy report
  fastify.get('/occupancy', {
    preHandler: [
      requirePermission(PERMISSIONS.REPORT_READ),
      ensureTenantIsolation('report'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        level: z.enum(['floor', 'wing', 'building']).default('floor'),
        period: z.enum(['week', 'month', 'term']).default('month'),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, level, period } = request.query as any;
    const orgId = request.tenant.orgId;

    // Verify hostel exists
    const hostel = await db
      .selectFrom('hms.hostel')
      .select('id')
      .where('id', '=', hostelId)
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

    // Build query based on level
    let query = db
      .selectFrom('hms.bed')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .where('hms.bed.org_id', '=', orgId)
      .where('hms.building.hostel_id', '=', hostelId);

    // Group by based on level
    let groupByField: string;
    let selectFields: any[];

    switch (level) {
      case 'floor':
        groupByField = 'hms.floor.id';
        selectFields = [
          'hms.floor.id as id',
          'hms.floor.floor_number as name',
          db.fn.count('hms.bed.id').as('total'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'occupied')
              .then(1)
              .else(0)
          ).as('occupied'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'vacant')
              .then(1)
              .else(0)
          ).as('vacant'),
        ];
        break;
      case 'wing':
        groupByField = 'hms.wing.id';
        selectFields = [
          'hms.wing.id as id',
          'hms.wing.code as name',
          db.fn.count('hms.bed.id').as('total'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'occupied')
              .then(1)
              .else(0)
          ).as('occupied'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'vacant')
              .then(1)
              .else(0)
          ).as('vacant'),
        ];
        break;
      case 'building':
        groupByField = 'hms.building.id';
        selectFields = [
          'hms.building.id as id',
          'hms.building.name as name',
          db.fn.count('hms.bed.id').as('total'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'occupied')
              .then(1)
              .else(0)
          ).as('occupied'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'vacant')
              .then(1)
              .else(0)
          ).as('vacant'),
        ];
        break;
    }

    query = query
      .select(selectFields)
      .groupBy(groupByField)
      .orderBy('name', 'asc');

    const details = await query.execute();

    // Calculate totals
    const totals = details.reduce(
      (acc, item) => ({
        total: acc.total + Number(item.total || 0),
        occupied: acc.occupied + Number(item.occupied || 0),
        vacant: acc.vacant + Number(item.vacant || 0),
      }),
      { total: 0, occupied: 0, vacant: 0 }
    );

    // Get blocked beds
    const blocked = await db
      .selectFrom('hms.bed')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .where('status', '=', 'blocked')
      .executeTakeFirst();

    // Get reserved beds
    const reserved = await db
      .selectFrom('hms.bed')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .where('status', '=', 'reserved')
      .executeTakeFirst();

    const occupancyRate = totals.total > 0 
      ? Math.round((totals.occupied / totals.total) * 100) 
      : 0;

    return {
      total: totals.total,
      occupied: totals.occupied,
      vacant: totals.vacant,
      blocked: Number(blocked?.count || 0),
      reserved: Number(reserved?.count || 0),
      occupancyRate,
      details: details.map(item => ({
        ...item,
        total: Number(item.total || 0),
        occupied: Number(item.occupied || 0),
        vacant: Number(item.vacant || 0),
        rate: Number(item.total || 0) > 0 
          ? Math.round((Number(item.occupied || 0) / Number(item.total || 0)) * 100)
          : 0,
      })),
    };
  });

  // GET occupancy trend
  fastify.get('/occupancy/trend', {
    preHandler: [
      requirePermission(PERMISSIONS.REPORT_READ),
      ensureTenantIsolation('report'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        period: z.enum(['week', 'month', 'term']).default('month'),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, period } = request.query as any;
    const orgId = request.tenant.orgId;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'term':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    // Get daily occupancy data
    const data = await db
      .selectFrom('hms.allocation')
      .select([
        db.fn.dateTrunc('day', 'allocated_at').as('date'),
        db.fn.count('id').as('occupied'),
      ])
      .where('org_id', '=', orgId)
      .where('allocated_at', '>=', startDate)
      .where('vacated_at', 'is', null)
      .groupBy(db.fn.dateTrunc('day', 'allocated_at'))
      .orderBy('date', 'asc')
      .execute();

    // Get total beds for vacancy calculation
    const totalBeds = await db
      .selectFrom('hms.bed')
      .select(db.fn.count('id').as('count'))
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    const total = Number(totalBeds?.count || 0);

    // Format data for chart
    const trendData = data.map(item => ({
      date: item.date,
      occupied: Number(item.occupied || 0),
      vacant: total - Number(item.occupied || 0),
    }));

    return trendData;
  });

  // GET export occupancy report
  fastify.get('/occupancy/export', {
    preHandler: [
      requirePermission(PERMISSIONS.REPORT_EXPORT),
      ensureTenantIsolation('report'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        level: z.enum(['floor', 'wing', 'building']).default('floor'),
        period: z.enum(['week', 'month', 'term']).default('month'),
        format: z.enum(['csv', 'xlsx']).default('csv'),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, level, period, format } = request.query as any;
    const orgId = request.tenant.orgId;

    // Fetch data
    const data = await db
      .selectFrom('hms.bed')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .select([
        'hms.bed.bed_label',
        'hms.bed.status',
        'hms.room.room_number',
        'hms.floor.floor_number',
        'hms.wing.code as wing_code',
        'hms.building.name as building_name',
      ])
      .where('hms.bed.org_id', '=', orgId)
      .where('hms.building.hostel_id', '=', hostelId)
      .execute();

    // Generate CSV
    if (format === 'csv') {
      const headers = ['Building', 'Wing', 'Floor', 'Room', 'Bed', 'Status'];
      const rows = data.map(bed => [
        bed.building_name,
        bed.wing_code,
        bed.floor_number,
        bed.room_number,
        bed.bed_label,
        bed.status,
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename=occupancy-report-${new Date().toISOString().split('T')[0]}.csv`);
      return csv;
    }

    // For XLSX, would use a library like exceljs
    // This is a placeholder
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename=occupancy-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    return Buffer.from('XLSX placeholder');
  });
}