// Domain entities (type-only, not Zod schemas)

// User domain
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  orgId: string;
  campusIds: string[];
  studentId?: string;
  parentOf?: string[];
}

// Student domain (from APEX)
export interface Student {
  id: string;
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  class?: string;
  guardianIds: string[];
  feeClearanceFlag: boolean;
}

// Hostel domain
export interface HostelDomain {
  id: string;
  code: string;
  name: string;
  type: 'boys' | 'girls' | 'coed' | 'staff';
  campusId: string;
  orgId: string;
  buildings: BuildingDomain[];
}

export interface BuildingDomain {
  id: string;
  code: string;
  name: string;
  wings: WingDomain[];
}

export interface WingDomain {
  id: string;
  code: string;
  direction?: 'E' | 'W' | 'N' | 'S';
  floors: FloorDomain[];
}

export interface FloorDomain {
  id: string;
  floorNumber: number;
  rooms: RoomDomain[];
}

export interface RoomDomain {
  id: string;
  number: string;
  type: 'single' | 'double' | 'triple' | 'dorm';
  capacity: number;
  beds: BedDomain[];
}

export interface BedDomain {
  id: string;
  label: string;
  type?: 'lower' | 'upper';
  rentTier: string;
  status: 'vacant' | 'occupied' | 'blocked' | 'reserved';
}

// Allocation domain
export interface AllocationDomain {
  id: string;
  studentId: string;
  bedId: string;
  hostelId: string;
  allocatedAt: Date;
  vacatedAt?: Date;
  allocatedBy: string;
  reason?: string;
}

// Attendance domain
export interface AttendanceDomain {
  id: string;
  studentId: string;
  hostelId: string;
  date: Date;
  status: 'present' | 'absent' | 'on_leave' | 'late';
  method: 'manual' | 'qr';
  markedBy: string;
  markedAt: Date;
}

// Leave domain
export interface LeaveDomain {
  id: string;
  studentId: string;
  hostelId: string;
  from: Date;
  to: Date;
  reason: string;
  status: 'pending_parent' | 'pending_warden' | 'approved' | 'rejected' | 'cancelled';
  parentDecidedBy?: string;
  parentDecidedAt?: Date;
  wardenDecidedBy?: string;
  wardenDecidedAt?: Date;
  rejectReason?: string;
}

// Complaint domain
export interface ComplaintDomain {
  id: string;
  raisedBy: string;
  hostelId: string;
  category: 'electrical' | 'plumbing' | 'furniture' | 'cleanliness' | 'other';
  description: string;
  photoKeys: string[];
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
}

// Fee domain
export interface FeeChargeDomain {
  id: string;
  studentId: string;
  ledgerId?: string;
  type: 'rent' | 'deposit' | 'damage' | 'refund';
  amountPaise: number;
  periodStart?: Date;
  periodEnd?: Date;
  allocationId?: string;
  idempotencyKey: string;
  postedAt?: Date;
}

// Notification domain
export interface NotificationDomain {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  recipient: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
}

// Report domain
export interface ReportDomain {
  id: string;
  name: string;
  type: 'occupancy' | 'vacancy' | 'attendance' | 'revenue';
  generatedAt: Date;
  generatedBy: string;
  parameters: Record<string, any>;
  data: any;
  format?: 'csv' | 'xlsx' | 'pdf';
  url?: string;
}

// Activity domain
export interface ActivityDomain {
  id: string;
  type: 'allocation' | 'vacate' | 'attendance' | 'leave' | 'complaint' | 'transfer';
  message: string;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, any>;
}