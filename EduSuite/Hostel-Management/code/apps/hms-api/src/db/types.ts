import {
  Generated,
  ColumnType,
  Selectable,
  Insertable,
  Updateable,
} from 'kysely';

export interface Database {
  // Hierarchy tables
  hostel: HostelTable;
  building: BuildingTable;
  wing: WingTable;
  floor: FloorTable;
  room: RoomTable;
  bed: BedTable;

  // Allocation
  allocation: AllocationTable;
  transfer: TransferTable;

  // Attendance
  attendance: AttendanceTable;

  // Leave
  leave_request: LeaveRequestTable;
  gate_pass: GatePassTable;

  // Complaints
  complaint: ComplaintTable;

  // Fee bridge
  fee_charge: FeeChargeTable;

  // Audit
  audit_log: AuditLogTable;

  // Config
  hostel_config: HostelConfigTable;

  // RBAC
  role: RoleTable;
  permission: PermissionTable;
  user_role: UserRoleTable;
  role_permission: RolePermissionTable;

  // Rent tiers
  rent_tier: RentTierTable;
}

// ============ Hierarchy Tables ============

export interface HostelTable {
  id: Generated<string>;
  org_id: string;
  campus_id: string;
  code: string;
  name: string;
  type: 'boys' | 'girls' | 'coed' | 'staff';
  rules: Record<string, any>;
  facilities: string[];
  is_active: boolean;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface BuildingTable {
  id: Generated<string>;
  org_id: string;
  hostel_id: string;
  code: string;
  name: string;
  caretaker_user_id: string | null;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface WingTable {
  id: Generated<string>;
  org_id: string;
  building_id: string;
  code: string;
  direction: 'E' | 'W' | 'N' | 'S' | null;
  caretaker_user_id: string | null;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface FloorTable {
  id: Generated<string>;
  org_id: string;
  wing_id: string;
  floor_number: number;
}

export interface RoomTable {
  id: Generated<string>;
  org_id: string;
  floor_id: string;
  room_number: string;
  room_type: 'single' | 'double' | 'triple' | 'dorm';
  max_capacity: number;
  furniture: Record<string, any>;
}

export interface BedTable {
  id: Generated<string>;
  org_id: string;
  room_id: string;
  bed_label: string;
  bed_type: string | null;
  rent_tier: string;
  status: 'vacant' | 'occupied' | 'blocked' | 'reserved';
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

// ============ Allocation Tables ============

export interface AllocationTable {
  id: Generated<string>;
  org_id: string;
  bed_id: string;
  apex_student_id: string;
  hostel_id: string;
  allocated_at: ColumnType<Date, Date | undefined, Date | undefined>;
  vacated_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  allocated_by: string;
  vacate_reason: string | null;
}

export interface TransferTable {
  id: Generated<string>;
  org_id: string;
  allocation_id: string;
  requested_bed_id: string;
  requested_by: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  approved_bed_id: string | null;
  reject_reason: string | null;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

// ============ Attendance Tables ============

export interface AttendanceTable {
  id: Generated<string>;
  org_id: string;
  hostel_id: string;
  apex_student_id: string;
  attendance_date: ColumnType<Date, Date | string, Date | string>;
  status: 'present' | 'absent' | 'on_leave' | 'late';
  method: 'manual' | 'qr';
  marked_by: string;
  marked_at: ColumnType<Date, Date | undefined, Date | undefined>;
  device_id: string | null;
}

// ============ Leave Tables ============

export interface LeaveRequestTable {
  id: Generated<string>;
  org_id: string;
  hostel_id: string;
  apex_student_id: string;
  from_ts: ColumnType<Date, Date | string, Date | string>;
  to_ts: ColumnType<Date, Date | string, Date | string>;
  reason: string;
  status: 'pending_parent' | 'pending_warden' | 'approved' | 'rejected' | 'cancelled';
  parent_decided_by: string | null;
  parent_decided_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  warden_decided_by: string | null;
  warden_decided_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  reject_reason: string | null;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface GatePassTable {
  id: Generated<string>;
  org_id: string;
  leave_id: string;
  pass_code: string;
  valid_from: ColumnType<Date, Date | string, Date | string>;
  valid_to: ColumnType<Date, Date | string, Date | string>;
  exit_scanned_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  entry_scanned_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
}

// ============ Complaints Tables ============

export interface ComplaintTable {
  id: Generated<string>;
  org_id: string;
  hostel_id: string;
  raised_by: string;
  category: 'electrical' | 'plumbing' | 'furniture' | 'cleanliness' | 'other';
  description: string;
  photo_keys: string[];
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string | null;
  resolved_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  closed_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

// ============ Fee Bridge Tables ============

export interface FeeChargeTable {
  id: Generated<string>;
  org_id: string;
  apex_student_id: string;
  apex_ledger_id: string | null;
  charge_type: 'rent' | 'deposit' | 'damage' | 'refund';
  amount_paise: number;
  period_start: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  period_end: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
  allocation_id: string | null;
  idempotency_key: string;
  posted_at: ColumnType<Date | null, Date | null | undefined, Date | null | undefined>;
}

// ============ Audit Tables ============

export interface AuditLogTable {
  id: Generated<number>;
  org_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ip: string | null;
  at: ColumnType<Date, Date | undefined, Date | undefined>;
}

// ============ Config Tables ============

export interface HostelConfigTable {
  hostel_id: string;
  org_id: string;
  parent_approval_required: boolean;
  attendance_cutoff_time: string;
  alert_parent_on_absent: boolean;
  curfew_time: string | null;
  qr_attendance_enabled: boolean;
}

// ============ RBAC Tables ============

export interface RoleTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface PermissionTable {
  id: Generated<string>;
  permission: string;
  resource: string;
  action: string;
  scope: string;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface UserRoleTable {
  id: Generated<string>;
  org_id: string;
  apex_user_id: string;
  role_id: string;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface RolePermissionTable {
  id: Generated<string>;
  role_id: string;
  permission: string;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

// ============ Rent Tier Tables ============

export interface RentTierTable {
  id: Generated<string>;
  org_id: string | null;
  name: string;
  display_name: string;
  amount_paise: number;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: ColumnType<Date, Date | undefined, Date | undefined>;
  updated_at: ColumnType<Date, Date | undefined, Date | undefined>;
}

// ============ Selectable Types ============

export type Hostel = Selectable<HostelTable>;
export type Building = Selectable<BuildingTable>;
export type Wing = Selectable<WingTable>;
export type Floor = Selectable<FloorTable>;
export type Room = Selectable<RoomTable>;
export type Bed = Selectable<BedTable>;
export type Allocation = Selectable<AllocationTable>;
export type Transfer = Selectable<TransferTable>;
export type Attendance = Selectable<AttendanceTable>;
export type LeaveRequest = Selectable<LeaveRequestTable>;
export type GatePass = Selectable<GatePassTable>;
export type Complaint = Selectable<ComplaintTable>;
export type FeeCharge = Selectable<FeeChargeTable>;
export type AuditLog = Selectable<AuditLogTable>;
export type HostelConfig = Selectable<HostelConfigTable>;
export type Role = Selectable<RoleTable>;
export type Permission = Selectable<PermissionTable>;
export type UserRole = Selectable<UserRoleTable>;
export type RolePermission = Selectable<RolePermissionTable>;
export type RentTier = Selectable<RentTierTable>;

// ============ Insertable Types ============

export type NewHostel = Insertable<HostelTable>;
export type NewBuilding = Insertable<BuildingTable>;
export type NewWing = Insertable<WingTable>;
export type NewFloor = Insertable<FloorTable>;
export type NewRoom = Insertable<RoomTable>;
export type NewBed = Insertable<BedTable>;
export type NewAllocation = Insertable<AllocationTable>;
export type NewTransfer = Insertable<TransferTable>;
export type NewAttendance = Insertable<AttendanceTable>;
export type NewLeaveRequest = Insertable<LeaveRequestTable>;
export type NewGatePass = Insertable<GatePassTable>;
export type NewComplaint = Insertable<ComplaintTable>;
export type NewFeeCharge = Insertable<FeeChargeTable>;

// ============ Updateable Types ============

export type UpdateHostel = Updateable<HostelTable>;
export type UpdateBuilding = Updateable<BuildingTable>;
export type UpdateWing = Updateable<WingTable>;
export type UpdateFloor = Updateable<FloorTable>;
export type UpdateRoom = Updateable<RoomTable>;
export type UpdateBed = Updateable<BedTable>;
export type UpdateAllocation = Updateable<AllocationTable>;
export type UpdateTransfer = Updateable<TransferTable>;
export type UpdateAttendance = Updateable<AttendanceTable>;
export type UpdateLeaveRequest = Updateable<LeaveRequestTable>;
export type UpdateGatePass = Updateable<GatePassTable>;
export type UpdateComplaint = Updateable<ComplaintTable>;