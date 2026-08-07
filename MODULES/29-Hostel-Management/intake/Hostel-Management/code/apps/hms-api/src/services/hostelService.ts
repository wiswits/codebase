import { db } from '../db';
import type { 
  Hostel, 
  Building, 
  Wing, 
  Floor, 
  Room, 
  Bed,
  CreateHostel,
  UpdateHostel 
} from '@shared/schemas/hostel';

export class HostelService {
  // Hostel operations
  async getHostels(orgId: string, params: {
    limit?: number;
    cursor?: string;
    search?: string;
    type?: string;
    isActive?: boolean;
  }) {
    const { limit = 50, cursor, search, type, isActive } = params;

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

    return { data, nextCursor, hasMore, limit };
  }

  async getHostelById(orgId: string, id: string): Promise<Hostel | null> {
    const hostel = await db
      .selectFrom('hms.hostel')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();

    return hostel || null;
  }

  async getHostelTree(orgId: string, hostelId: string) {
    const hostel = await this.getHostelById(orgId, hostelId);
    if (!hostel) return null;

    const buildings = await db
      .selectFrom('hms.building')
      .selectAll()
      .where('hostel_id', '=', hostelId)
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

                    return { ...room, beds };
                  })),
                };
              })),
            };
          })),
        };
      })),
    };

    return result;
  }

  async createHostel(orgId: string, data: CreateHostel): Promise<Hostel> {
    const hostel = await db
      .insertInto('hms.hostel')
      .values({
        org_id: orgId,
        campus_id: data.campusId,
        code: data.code,
        name: data.name,
        type: data.type,
        rules: data.rules || {},
        facilities: data.facilities || [],
        is_active: data.isActive !== undefined ? data.isActive : true,
      })
      .returningAll()
      .executeTakeFirst();

    return hostel!;
  }

  async updateHostel(orgId: string, id: string, data: UpdateHostel): Promise<Hostel | null> {
    const hostel = await db
      .updateTable('hms.hostel')
      .set({
        code: data.code,
        name: data.name,
        type: data.type,
        rules: data.rules,
        facilities: data.facilities,
        is_active: data.isActive,
      })
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();

    return hostel || null;
  }

  async deleteHostel(orgId: string, id: string): Promise<boolean> {
    const result = await db
      .deleteFrom('hms.hostel')
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .execute();

    return result.length > 0;
  }

  // Building operations
  async getBuildings(orgId: string, hostelId: string, params: {
    limit?: number;
    cursor?: string;
  }) {
    const { limit = 50, cursor } = params;

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

    return { data, nextCursor, hasMore, limit };
  }

  async createBuilding(orgId: string, data: {
    hostelId: string;
    code: string;
    name: string;
    caretakerUserId?: string;
  }) {
    const building = await db
      .insertInto('hms.building')
      .values({
        org_id: orgId,
        hostel_id: data.hostelId,
        code: data.code,
        name: data.name,
        caretaker_user_id: data.caretakerUserId || null,
      })
      .returningAll()
      .executeTakeFirst();

    return building!;
  }

  // Wing operations
  async createWing(orgId: string, data: {
    buildingId: string;
    code: string;
    direction?: 'E' | 'W' | 'N' | 'S';
    caretakerUserId?: string;
  }) {
    const wing = await db
      .insertInto('hms.wing')
      .values({
        org_id: orgId,
        building_id: data.buildingId,
        code: data.code,
        direction: data.direction || null,
        caretaker_user_id: data.caretakerUserId || null,
      })
      .returningAll()
      .executeTakeFirst();

    return wing!;
  }

  // Floor operations
  async createFloor(orgId: string, data: {
    wingId: string;
    floorNumber: number;
  }) {
    const floor = await db
      .insertInto('hms.floor')
      .values({
        org_id: orgId,
        wing_id: data.wingId,
        floor_number: data.floorNumber,
      })
      .returningAll()
      .executeTakeFirst();

    return floor!;
  }

  // Room operations
  async createRoom(orgId: string, data: {
    floorId: string;
    roomNumber: string;
    roomType: string;
    maxCapacity: number;
    furniture?: Record<string, unknown>;
  }) {
    const room = await db
      .insertInto('hms.room')
      .values({
        org_id: orgId,
        floor_id: data.floorId,
        room_number: data.roomNumber,
        room_type: data.roomType,
        max_capacity: data.maxCapacity,
        furniture: data.furniture || {},
      })
      .returningAll()
      .executeTakeFirst();

    return room!;
  }

  // Bed operations
  async createBeds(orgId: string, data: {
    roomId: string;
    bedLabels: string[];
    bedType?: string;
    rentTier: string;
  }) {
    const beds = await db
      .insertInto('hms.bed')
      .values(
        data.bedLabels.map((label) => ({
          org_id: orgId,
          room_id: data.roomId,
          bed_label: label,
          bed_type: data.bedType || null,
          rent_tier: data.rentTier,
          status: 'vacant',
        }))
      )
      .returningAll()
      .execute();

    return beds;
  }

  async getAvailableBeds(orgId: string, params: {
    hostelId?: string;
    roomType?: string;
    gender?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { hostelId, roomType, gender, status, limit = 50, cursor } = params;

    let query = db
      .selectFrom('hms.bed')
      .innerJoin('hms.room', 'hms.room.id', 'hms.bed.room_id')
      .innerJoin('hms.floor', 'hms.floor.id', 'hms.room.floor_id')
      .innerJoin('hms.wing', 'hms.wing.id', 'hms.floor.wing_id')
      .innerJoin('hms.building', 'hms.building.id', 'hms.wing.building_id')
      .innerJoin('hms.hostel', 'hms.hostel.id', 'hms.building.hostel_id')
      .select([
        'hms.bed.*',
        'hms.room.room_number',
        'hms.room.room_type',
        'hms.floor.floor_number',
        'hms.wing.code as wing_code',
        'hms.building.name as building_name',
        'hms.hostel.name as hostel_name',
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

    return { data, nextCursor, hasMore, limit };
  }
}

export const hostelService = new HostelService();