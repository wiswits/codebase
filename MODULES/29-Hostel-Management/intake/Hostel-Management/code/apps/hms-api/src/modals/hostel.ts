import { db } from '../db';
import type { 
  Hostel, 
  Building, 
  Wing, 
  Floor, 
  Room, 
  Bed,
  NewHostel,
  NewBuilding,
  NewWing,
  NewFloor,
  NewRoom,
  NewBed,
} from '../db/types';

export class HostelModel {
  // Hostel operations
  static async create(data: NewHostel): Promise<Hostel> {
    const hostel = await db
      .insertInto('hms.hostel')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return hostel!;
  }

  static async findById(id: string, orgId: string): Promise<Hostel | null> {
    const hostel = await db
      .selectFrom('hms.hostel')
      .selectAll()
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .executeTakeFirst();
    return hostel || null;
  }

  static async findAll(orgId: string, params: {
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

    return await query.execute();
  }

  static async update(id: string, orgId: string, data: Partial<NewHostel>): Promise<Hostel | null> {
    const hostel = await db
      .updateTable('hms.hostel')
      .set(data)
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .returningAll()
      .executeTakeFirst();
    return hostel || null;
  }

  static async delete(id: string, orgId: string): Promise<boolean> {
    const result = await db
      .deleteFrom('hms.hostel')
      .where('id', '=', id)
      .where('org_id', '=', orgId)
      .execute();
    return result.length > 0;
  }

  // Building operations
  static async createBuilding(data: NewBuilding): Promise<Building> {
    const building = await db
      .insertInto('hms.building')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return building!;
  }

  static async getBuildings(orgId: string, hostelId: string) {
    return await db
      .selectFrom('hms.building')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('hostel_id', '=', hostelId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  // Wing operations
  static async createWing(data: NewWing): Promise<Wing> {
    const wing = await db
      .insertInto('hms.wing')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return wing!;
  }

  static async getWings(orgId: string, buildingId: string) {
    return await db
      .selectFrom('hms.wing')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('building_id', '=', buildingId)
      .orderBy('code', 'asc')
      .execute();
  }

  // Floor operations
  static async createFloor(data: NewFloor): Promise<Floor> {
    const floor = await db
      .insertInto('hms.floor')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return floor!;
  }

  static async getFloors(orgId: string, wingId: string) {
    return await db
      .selectFrom('hms.floor')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('wing_id', '=', wingId)
      .orderBy('floor_number', 'asc')
      .execute();
  }

  // Room operations
  static async createRoom(data: NewRoom): Promise<Room> {
    const room = await db
      .insertInto('hms.room')
      .values(data)
      .returningAll()
      .executeTakeFirst();
    return room!;
  }

  static async getRooms(orgId: string, floorId: string) {
    return await db
      .selectFrom('hms.room')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('floor_id', '=', floorId)
      .orderBy('room_number', 'asc')
      .execute();
  }

  // Bed operations
  static async createBeds(data: NewBed[]): Promise<Bed[]> {
    return await db
      .insertInto('hms.bed')
      .values(data)
      .returningAll()
      .execute();
  }

  static async getBeds(orgId: string, roomId: string) {
    return await db
      .selectFrom('hms.bed')
      .selectAll()
      .where('org_id', '=', orgId)
      .where('room_id', '=', roomId)
      .orderBy('bed_label', 'asc')
      .execute();
  }
}