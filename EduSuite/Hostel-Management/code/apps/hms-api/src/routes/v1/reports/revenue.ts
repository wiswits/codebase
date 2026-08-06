import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../../db';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';
import { config } from '../../../config';

export async function revenueReportRoutes(fastify: FastifyInstance) {
  // GET revenue report
  fastify.get('/revenue', {
    preHandler: [
      requirePermission(PERMISSIONS.REPORT_READ),
      ensureTenantIsolation('report'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        term: z.string().default('current'),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, term } = request.query as any;
    const orgId = request.tenant.orgId;

    // In production, this would fetch from APEX Fee Module
    // For now, we'll generate mock data based on allocations

    // Get all allocations with their rent tiers
    const allocations = await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .select([
        'hms.allocation.apex_student_id',
        'hms.bed.rent_tier',
        'hms.allocation.allocated_at',
        'hms.allocation.vacated_at',
      ])
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.hostel_id', '=', hostelId)
      .execute();

    // Calculate revenue based on rent tiers
    const rentTiers: Record<string, number> = {
      standard: 500000, // 5000 INR in paise
      premium: 750000,  // 7500 INR in paise
      luxury: 1000000,  // 10000 INR in paise
    };

    let totalRevenue = 0;
    let collected = 0;
    const monthlyTrend: Record<string, { revenue: number; collection: number }> = {};

    // In production, would get actual fee data from APEX
    // This is mock data generation
    for (const alloc of allocations) {
      const rent = rentTiers[alloc.rent_tier] || 0;
      const months = alloc.vacated_at 
        ? Math.max(1, Math.ceil((alloc.vacated_at.getTime() - alloc.allocated_at.getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : Math.ceil((Date.now() - alloc.allocated_at.getTime()) / (30 * 24 * 60 * 60 * 1000));
      
      const total = rent * months;
      totalRevenue += total;
      collected += total * 0.85; // Mock 85% collection rate

      // Monthly trend
      const monthKey = alloc.allocated_at.toISOString().slice(0, 7);
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = { revenue: 0, collection: 0 };
      }
      monthlyTrend[monthKey].revenue += total / months;
      monthlyTrend[monthKey].collection += (total * 0.85) / months;
    }

    // Get fee distribution from fee_charge table
    const feeDistribution = await db
      .selectFrom('hms.fee_charge')
      .select([
        'charge_type',
        db.fn.sum('amount_paise').as('total'),
      ])
      .where('org_id', '=', orgId)
      .groupBy('charge_type')
      .execute();

    const distribution = feeDistribution.map(f => ({
      name: f.charge_type,
      value: Number(f.total || 0),
    }));

    return {
      totalRevenue,
      collected,
      pending: totalRevenue - collected,
      collectionRate: totalRevenue > 0 ? Math.round((collected / totalRevenue) * 100) : 0,
      monthlyTrend: Object.entries(monthlyTrend).map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        collection: Math.round(data.collection),
      })),
      distribution: distribution.length > 0 ? distribution : [
        { name: 'rent', value: Math.round(totalRevenue * 0.7) },
        { name: 'deposit', value: Math.round(totalRevenue * 0.2) },
        { name: 'other', value: Math.round(totalRevenue * 0.1) },
      ],
      // Mock student-level details
      details: allocations.slice(0, 20).map(alloc => ({
        studentId: alloc.apex_student_id,
        studentName: `Student ${alloc.apex_student_id.slice(0, 8)}`,
        roomNumber: '204', // Would need to fetch room number
        rent: rentTiers[alloc.rent_tier] || 0,
        deposits: 0,
        damage: 0,
        paid: (rentTiers[alloc.rent_tier] || 0) * 0.85,
        balance: (rentTiers[alloc.rent_tier] || 0) * 0.15,
      })),
    };
  });

  // GET revenue export
  fastify.get('/revenue/export', {
    preHandler: [
      requirePermission(PERMISSIONS.REPORT_EXPORT),
      ensureTenantIsolation('report'),
    ],
    schema: {
      querystring: z.object({
        hostelId: z.string().uuid(),
        term: z.string().default('current'),
        format: z.enum(['csv', 'xlsx']).default('csv'),
      }),
    },
  }, async (request, reply) => {
    const { hostelId, term, format } = request.query as any;
    const orgId = request.tenant.orgId;

    // Fetch data for export
    const data = await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.allocation.apex_student_id',
        'hms.allocation.allocated_at',
        'hms.allocation.vacated_at',
        'hms.bed.rent_tier',
        'hms.room.room_number',
      ])
      .where('hms.allocation.org_id', '=', orgId)
      .where('hms.allocation.hostel_id', '=', hostelId)
      .execute();

    const rentTiers: Record<string, number> = {
      standard: 500000,
      premium: 750000,
      luxury: 1000000,
    };

    if (format === 'csv') {
      const headers = ['Student ID', 'Room', 'Rent Tier', 'Monthly Rent (INR)', 'Allocated Date', 'Vacated Date'];
      const rows = data.map(r => [
        r.apex_student_id,
        r.room_number,
        r.rent_tier,
        (rentTiers[r.rent_tier] || 0) / 100,
        r.allocated_at.toISOString().split('T')[0],
        r.vacated_at?.toISOString().split('T')[0] || 'Active',
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename=revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
      return csv;
    }

    // XLSX placeholder
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename=revenue-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    return Buffer.from('XLSX placeholder');
  });
}