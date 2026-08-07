/**
 * Utilization Management Core Types
 */

export interface Employee {
  id: number;
  organizationId: number;
  employeeCode: string;
  employeeName: string;
  departmentId: number;
  departmentName?: string;
  designation: string;
  employmentStatus: 'active' | 'inactive' | 'archived';
  weeklyCapacity: number;
  utilization: number;
  allocationCount: number;
  benchStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  headId?: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  organizationId: number;
  name: string;
  client: string;
  departmentId: number;
  projectManagerId?: number;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: number;
  organizationId: number;
  employeeId: number;
  projectId: number;
  allocationPercentage: number;
  workingHours: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Capacity {
  id: number;
  organizationId: number;
  employeeId: number;
  weeklyCapacity: number;
  monthlyCapacity: number;
  availableHours: number;
  allocatedHours: number;
  remainingHours: number;
  period: string;
  createdAt: string;
  updatedAt: string;
}

export interface BenchRecord {
  id: number;
  organizationId: number;
  employeeId: number;
  benchStartDate: string;
  benchEndDate?: string;
  reason: string;
  status: 'active' | 'resolved';
  suggestedAllocation?: string;
  createdAt: string;
  updatedAt: string;
}

export type UtilizationStatus = 'over' | 'optimal' | 'under' | 'bench';

export const UTILIZATION_STATUS = {
  OVER: 'over',
  OPTIMAL: 'optimal',
  UNDER: 'under',
  BENCH: 'bench'
} as const;