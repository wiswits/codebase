import { db } from '../db';
import { feeService } from './feeService';
import { config } from '../config';

export class ReportService {
  async getOccupancyReport(orgId: string, params: {
    hostelId: string;
    level: 'floor' | 'wing' | 'building';
    period: 'week' | 'month' | 'term';
  }) {
    const { hostelId, level, period } = params;

    // Verify hostel exists
    const hostel = await db
      .selectFrom('hms.hostel')
      .select('id')
      .where('id', '=', hostelId)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    if (!hostel) {
      throw new Error('HOSTEL_NOT_FOUND');
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
          db.sql<string>`CONCAT('Floor ', hms.floor.floor_number)`.as('name'),
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
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'reserved')
              .then(1)
              .else(0)
          ).as('reserved'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'blocked')
              .then(1)
              .else(0)
          ).as('blocked'),
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
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'reserved')
              .then(1)
              .else(0)
          ).as('reserved'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'blocked')
              .then(1)
              .else(0)
          ).as('blocked'),
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
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'reserved')
              .then(1)
              .else(0)
          ).as('reserved'),
          db.fn.sum(
            db.fn.case()
              .when('hms.bed.status', '=', 'blocked')
              .then(1)
              .else(0)
          ).as('blocked'),
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
        reserved: acc.reserved + Number(item.reserved || 0),
        blocked: acc.blocked + Number(item.blocked || 0),
      }),
      { total: 0, occupied: 0, vacant: 0, reserved: 0, blocked: 0 }
    );

    const occupancyRate = totals.total > 0 
      ? Math.round((totals.occupied / totals.total) * 100) 
      : 0;

    return {
      total: totals.total,
      occupied: totals.occupied,
      vacant: totals.vacant,
      reserved: totals.reserved,
      blocked: totals.blocked,
      occupancyRate,
      details: details.map(item => ({
        ...item,
        total: Number(item.total || 0),
        occupied: Number(item.occupied || 0),
        vacant: Number(item.vacant || 0),
        reserved: Number(item.reserved || 0),
        blocked: Number(item.blocked || 0),
        rate: Number(item.total || 0) > 0 
          ? Math.round((Number(item.occupied || 0) / Number(item.total || 0)) * 100)
          : 0,
      })),
    };
  }

  async getOccupancyTrend(orgId: string, params: {
    hostelId: string;
    period: 'week' | 'month' | 'term';
  }) {
    const { hostelId, period } = params;

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
      .where('hostel_id', '=', hostelId)
      .where('allocated_at', '>=', startDate)
      .where('vacated_at', 'is', null)
      .groupBy(db.fn.dateTrunc('day', 'allocated_at'))
      .orderBy('date', 'asc')
      .execute();

    // Get total beds for vacancy calculation
    const totalBeds = await db
      .selectFrom('hms.bed')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .select(db.fn.count('hms.bed.id').as('count'))
      .where('hms.bed.org_id', '=', orgId)
      .where('hms.building.hostel_id', '=', hostelId)
      .executeTakeFirst();

    const total = Number(totalBeds?.count || 0);

    // Fill in missing dates
    const trendData = [];
    const dateMap = new Map();
    data.forEach(item => {
      const dateStr = item.date.toISOString().split('T')[0];
      dateMap.set(dateStr, Number(item.occupied || 0));
    });

    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const occupied = dateMap.get(dateStr) || 0;
      trendData.push({
        date: dateStr,
        occupied,
        vacant: total - occupied,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trendData;
  }

  async getVacancyReport(orgId: string, params: {
    hostelId: string;
    roomType?: string;
    gender?: string;
  }) {
    const { hostelId, roomType, gender } = params;

    let query = db
      .selectFrom('hms.bed')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .innerJoin('hms.hostel', 'hms.hostel.id', 'hms.building.hostel_id')
      .select([
        'hms.room.room_number',
        'hms.room.room_type',
        'hms.floor.floor_number',
        'hms.bed.id as bed_id',
        'hms.bed.bed_label',
        'hms.bed.status',
        'hms.bed.rent_tier',
      ])
      .where('hms.bed.org_id', '=', orgId)
      .where('hms.building.hostel_id', '=', hostelId);

    if (roomType) {
      query = query.where('hms.room.room_type', '=', roomType);
    }

    if (gender) {
      query = query.where('hms.hostel.type', '=', gender);
    }

    query = query.orderBy(['hms.floor.floor_number', 'hms.room.room_number', 'hms.bed.bed_label']);

    const beds = await query.execute();

    // Group by room
    const rooms = new Map();
    beds.forEach(bed => {
      const key = `${bed.room_number}-${bed.floor_number}`;
      if (!rooms.has(key)) {
        rooms.set(key, {
          roomNumber: bed.room_number,
          roomType: bed.room_type,
          floorNumber: bed.floor_number,
          beds: [],
        });
      }
      rooms.get(key).beds.push(bed);
    });

    const roomData = Array.from(rooms.values()).map(room => ({
      ...room,
      totalBeds: room.beds.length,
      availableBeds: room.beds.filter(b => b.status === 'vacant').length,
    }));

    // Calculate summary
    const totalRooms = roomData.length;
    const totalBeds = roomData.reduce((sum, r) => sum + r.totalBeds, 0);
    const availableBeds = roomData.reduce((sum, r) => sum + r.availableBeds, 0);
    const availabilityRate = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

    // Group by room type
    const byRoomType = roomData.reduce((acc, room) => {
      const type = room.roomType;
      if (!acc[type]) {
        acc[type] = { type, total: 0, available: 0 };
      }
      acc[type].total += room.totalBeds;
      acc[type].available += room.availableBeds;
      return acc;
    }, {} as Record<string, { type: string; total: number; available: number }>);

    // Group by floor
    const byFloor = roomData.reduce((acc, room) => {
      const floor = `Floor ${room.floorNumber}`;
      if (!acc[floor]) {
        acc[floor] = { floor, total: 0, available: 0 };
      }
      acc[floor].total += room.totalBeds;
      acc[floor].available += room.availableBeds;
      return acc;
    }, {} as Record<string, { floor: string; total: number; available: number }>);

    return {
      totalRooms,
      totalBeds,
      availableBeds,
      availabilityRate,
      byRoomType: Object.values(byRoomType),
      byFloor: Object.values(byFloor),
      availableRooms: roomData.filter(r => r.availableBeds > 0),
    };
  }

  async getAttendanceReport(orgId: string, params: {
    hostelId: string;
    studentId?: string;
    from: Date;
    to: Date;
  }) {
    const { hostelId, studentId, from, to } = params;

    let query = db
      .selectFrom('hms.attendance')
      .innerJoin('hms.allocation', 'hms.allocation.apex_student_id', 'hms.attendance.apex_student_id')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.attendance.*',
        'hms.room.room_number',
        'hms.bed.bed_label',
      ])
      .where('hms.attendance.org_id', '=', orgId)
      .where('hms.attendance.hostel_id', '=', hostelId)
      .where('hms.attendance.attendance_date', '>=', from)
      .where('hms.attendance.attendance_date', '<=', to);

    if (studentId) {
      query = query.where('hms.attendance.apex_student_id', '=', studentId);
    }

    query = query.orderBy('hms.attendance.attendance_date', 'desc');

    const records = await query.execute();

    // Calculate statistics
    const totalDays = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const onLeave = records.filter(r => r.status === 'on_leave').length;
    const late = records.filter(r => r.status === 'late').length;

    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    // Daily trend data
    const dailyTrend = await db
      .selectFrom('hms.attendance')
      .select([
        'attendance_date as date',
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'present')
            .then(1)
            .else(0)
        ).as('present'),
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'absent')
            .then(1)
            .else(0)
        ).as('absent'),
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'on_leave')
            .then(1)
            .else(0)
        ).as('on_leave'),
        db.fn.sum(
          db.fn.case()
            .when('status', '=', 'late')
            .then(1)
            .else(0)
        ).as('late'),
      ])
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .where('attendance_date', '>=', from)
      .where('attendance_date', '<=', to)
      .groupBy('attendance_date')
      .orderBy('attendance_date', 'asc')
      .execute();

    // Distribution data
    const distribution = [
      { status: 'present', count: present },
      { status: 'absent', count: absent },
      { status: 'on_leave', count: onLeave },
      { status: 'late', count: late },
    ];

    // Student-wise summary if no specific student
    let studentSummary = [];
    if (!studentId) {
      const studentData = await db
        .selectFrom('hms.attendance')
        .select([
          'apex_student_id',
          db.fn.count('id').as('total'),
          db.fn.sum(
            db.fn.case()
              .when('status', '=', 'present')
              .then(1)
              .else(0)
          ).as('present_count'),
          db.fn.sum(
            db.fn.case()
              .when('status', '=', 'absent')
              .then(1)
              .else(0)
          ).as('absent_count'),
        ])
        .where('org_id', '=', orgId)
        .where('hostel_id', '=', hostelId)
        .where('attendance_date', '>=', from)
        .where('attendance_date', '<=', to)
        .groupBy('apex_student_id')
        .execute();

      studentSummary = studentData.map(s => ({
        studentId: s.apex_student_id,
        studentName: s.apex_student_id, // In production, fetch from APEX
        total: Number(s.total || 0),
        present: Number(s.present_count || 0),
        absent: Number(s.absent_count || 0),
        rate: Number(s.total || 0) > 0 
          ? Math.round((Number(s.present_count || 0) / Number(s.total || 0)) * 100)
          : 0,
      }));
    }

    return {
      totalDays,
      present,
      absent,
      onLeave,
      late,
      attendanceRate,
      dailyTrend: dailyTrend.map(d => ({
        date: d.date,
        present: Number(d.present || 0),
        absent: Number(d.absent || 0),
        onLeave: Number(d.on_leave || 0),
        late: Number(d.late || 0),
      })),
      distribution: distribution.filter(d => d.count > 0),
      records: records.map(r => ({
        ...r,
        status: r.status,
        method: r.method,
        markedAt: r.marked_at,
      })),
      studentSummary: studentSummary.length > 0 ? studentSummary : undefined,
    };
  }

  async getRevenueReport(orgId: string, params: {
    hostelId: string;
    term: string;
  }) {
    const { hostelId, term } = params;

    // Get all allocations with their rent tiers
    const allocations = await db
      .selectFrom('hms.allocation')
      .innerJoin('hms.bed', 'hms.bed.id', 'hms.allocation.bed_id')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .select([
        'hms.allocation.apex_student_id',
        'hms.bed.rent_tier',
        'hms.allocation.allocated_at',
        'hms.allocation.vacated_at',
        'hms.room.room_number',
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

    // Get actual fee data from fee_charge table if available
    const feeCharges = await db
      .selectFrom('hms.fee_charge')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('charge_type', '=', 'rent')
      .execute();

    const feeMap = new Map();
    feeCharges.forEach(f => {
      feeMap.set(f.allocation_id, f);
    });

    for (const alloc of allocations) {
      const rent = rentTiers[alloc.rent_tier] || 0;
      const months = alloc.vacated_at 
        ? Math.max(1, Math.ceil((alloc.vacated_at.getTime() - alloc.allocated_at.getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : Math.ceil((Date.now() - alloc.allocated_at.getTime()) / (30 * 24 * 60 * 60 * 1000));
      
      const total = rent * months;
      totalRevenue += total;

      // Check if fee was actually collected (from fee_charge table)
      const fee = feeMap.get(alloc.id);
      if (fee) {
        collected += fee.amount_paise;
      } else {
        collected += total * 0.85; // Mock 85% collection rate for demo
      }

      // Monthly trend
      const monthKey = alloc.allocated_at.toISOString().slice(0, 7);
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = { revenue: 0, collection: 0 };
      }
      monthlyTrend[monthKey].revenue += total / months;
      monthlyTrend[monthKey].collection += (fee?.amount_paise || total * 0.85) / months;
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

    // Student-level details
    const details = allocations.slice(0, 20).map(alloc => {
      const rent = rentTiers[alloc.rent_tier] || 0;
      const months = alloc.vacated_at 
        ? Math.max(1, Math.ceil((alloc.vacated_at.getTime() - alloc.allocated_at.getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : Math.ceil((Date.now() - alloc.allocated_at.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const total = rent * months;
      const fee = feeMap.get(alloc.id);
      const paid = fee?.amount_paise || total * 0.85;

      return {
        studentId: alloc.apex_student_id,
        studentName: `Student ${alloc.apex_student_id.slice(0, 8)}`,
        roomNumber: alloc.room_number,
        rent: rent,
        deposits: 0,
        damage: 0,
        paid: Math.round(paid),
        balance: Math.round(total - paid),
      };
    });

    return {
      totalRevenue: Math.round(totalRevenue),
      collected: Math.round(collected),
      pending: Math.round(totalRevenue - collected),
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
      details,
    };
  }

  async exportReport(orgId: string, params: {
    reportType: 'occupancy' | 'vacancy' | 'attendance' | 'revenue';
    format: 'csv' | 'xlsx';
    filters: Record<string, any>;
  }) {
    const { reportType, format, filters } = params;

    // Fetch data based on report type
    let data: any[] = [];
    let headers: string[] = [];

    switch (reportType) {
      case 'occupancy': {
        const report = await this.getOccupancyReport(orgId, {
          hostelId: filters.hostelId,
          level: filters.level || 'floor',
          period: filters.period || 'month',
        });
        
        headers = ['Name', 'Total Beds', 'Occupied', 'Vacant', 'Reserved', 'Blocked', 'Rate (%)'];
        data = report.details.map((item: any) => [
          item.name,
          item.total,
          item.occupied,
          item.vacant,
          item.reserved || 0,
          item.blocked || 0,
          item.rate,
        ]);
        // Add summary row
        data.push([
          'TOTAL',
          report.total,
          report.occupied,
          report.vacant,
          report.reserved || 0,
          report.blocked || 0,
          report.occupancyRate,
        ]);
        break;
      }

      case 'vacancy': {
        const report = await this.getVacancyReport(orgId, {
          hostelId: filters.hostelId,
          roomType: filters.roomType,
          gender: filters.gender,
        });
        
        headers = ['Room', 'Type', 'Floor', 'Total Beds', 'Available Beds', 'Status'];
        data = report.availableRooms.map((room: any) => [
          room.roomNumber,
          room.roomType,
          `Floor ${room.floorNumber}`,
          room.totalBeds,
          room.availableBeds,
          room.availableBeds > 0 ? 'Available' : 'Full',
        ]);
        break;
      }

      case 'attendance': {
        const report = await this.getAttendanceReport(orgId, {
          hostelId: filters.hostelId,
          studentId: filters.studentId,
          from: new Date(filters.from),
          to: new Date(filters.to),
        });
        
        headers = ['Student ID', 'Date', 'Status', 'Method', 'Room', 'Bed', 'Marked At'];
        data = report.records.map((record: any) => [
          record.apex_student_id,
          record.attendance_date.toISOString().split('T')[0],
          record.status,
          record.method,
          record.room_number,
          record.bed_label,
          record.marked_at?.toISOString() || '',
        ]);
        break;
      }

      case 'revenue': {
        const report = await this.getRevenueReport(orgId, {
          hostelId: filters.hostelId,
          term: filters.term || 'current',
        });
        
        headers = ['Student ID', 'Room', 'Rent (₹)', 'Paid (₹)', 'Balance (₹)'];
        data = report.details.map((item: any) => [
          item.studentId,
          item.roomNumber,
          (item.rent / 100).toFixed(2),
          (item.paid / 100).toFixed(2),
          (item.balance / 100).toFixed(2),
        ]);
        break;
      }
    }

    // Generate CSV
    if (format === 'csv') {
      const csvRows = [headers.join(','), ...data.map(row => row.join(','))];
      return csvRows.join('\n');
    }

    // For XLSX, would use a library like exceljs
    // This returns a placeholder
    return {
      headers,
      data,
    };
  }
}

export const reportService = new ReportService();