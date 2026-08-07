import { z } from 'zod';
import { idSchema, timestampSchema } from './common';

// Hostel types
export const hostelTypeSchema = z.enum(['boys', 'girls', 'coed', 'staff']);
export type HostelType = z.infer<typeof hostelTypeSchema>;

// Hostel schema
export const hostelSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  campusId: idSchema,
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: hostelTypeSchema,
  rules: z.record(z.unknown()).default({}),
  facilities: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
});

export const createHostelSchema = hostelSchema.omit({
  id: true,
  createdAt: true,
  orgId: true,
});

export const updateHostelSchema = createHostelSchema.partial();

// Building schema
export const buildingSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  hostelId: idSchema,
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  caretakerUserId: idSchema.optional().nullable(),
  createdAt: timestampSchema.optional(),
});

export const createBuildingSchema = buildingSchema.omit({
  id: true,
  orgId: true,
  createdAt: true,
});

// Wing schema
export const wingSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  buildingId: idSchema,
  code: z.string().min(1).max(20),
  direction: z.enum(['E', 'W', 'N', 'S']).optional().nullable(),
  caretakerUserId: idSchema.optional().nullable(),
  createdAt: timestampSchema.optional(),
});

export const createWingSchema = wingSchema.omit({
  id: true,
  orgId: true,
  createdAt: true,
});

// Floor schema
export const floorSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  wingId: idSchema,
  floorNumber: z.number().int().min(0),
});

export const createFloorSchema = floorSchema.omit({
  id: true,
  orgId: true,
});

// Room schema
export const roomTypeSchema = z.enum(['single', 'double', 'triple', 'dorm']);
export type RoomType = z.infer<typeof roomTypeSchema>;

export const roomSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  floorId: idSchema,
  roomNumber: z.string().min(1).max(10),
  roomType: roomTypeSchema,
  maxCapacity: z.number().int().min(1),
  furniture: z.record(z.unknown()).default({}),
});

export const createRoomSchema = roomSchema.omit({
  id: true,
  orgId: true,
});

export const updateRoomSchema = createRoomSchema.partial();

// Bed schema
export const bedStatusSchema = z.enum(['vacant', 'occupied', 'blocked', 'reserved']);
export type BedStatus = z.infer<typeof bedStatusSchema>;

export const bedSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  roomId: idSchema,
  bedLabel: z.string().min(1).max(5),
  bedType: z.string().optional().nullable(),
  rentTier: z.string().min(1),
  status: bedStatusSchema.default('vacant'),
  createdAt: timestampSchema.optional(),
});

export const createBedSchema = bedSchema.omit({
  id: true,
  orgId: true,
  createdAt: true,
  status: true,
});

export const createBedsBulkSchema = z.object({
  roomId: idSchema,
  bedLabels: z.array(z.string()).min(1).max(20),
  bedType: z.string().optional(),
  rentTier: z.string().min(1),
});

export const updateBedStatusSchema = z.object({
  status: z.enum(['blocked', 'unblocked']),
});

// Types
export type Hostel = z.infer<typeof hostelSchema>;
export type CreateHostel = z.infer<typeof createHostelSchema>;
export type UpdateHostel = z.infer<typeof updateHostelSchema>;
export type Building = z.infer<typeof buildingSchema>;
export type CreateBuilding = z.infer<typeof createBuildingSchema>;
export type Wing = z.infer<typeof wingSchema>;
export type CreateWing = z.infer<typeof createWingSchema>;
export type Floor = z.infer<typeof floorSchema>;
export type CreateFloor = z.infer<typeof createFloorSchema>;
export type Room = z.infer<typeof roomSchema>;
export type CreateRoom = z.infer<typeof createRoomSchema>;
export type UpdateRoom = z.infer<typeof updateRoomSchema>;
export type Bed = z.infer<typeof bedSchema>;
export type CreateBed = z.infer<typeof createBedSchema>;
export type CreateBedsBulk = z.infer<typeof createBedsBulkSchema>;
export type UpdateBedStatus = z.infer<typeof updateBedStatusSchema>;

// Tree response
export const hostelTreeSchema = z.object({
  hostel: hostelSchema,
  buildings: z.array(
    buildingSchema.extend({
      wings: z.array(
        wingSchema.extend({
          floors: z.array(
            floorSchema.extend({
              rooms: z.array(
                roomSchema.extend({
                  beds: z.array(bedSchema),
                })
              ),
            })
          ),
        })
      ),
    })
  ),
});

export type HostelTree = z.infer<typeof hostelTreeSchema>;