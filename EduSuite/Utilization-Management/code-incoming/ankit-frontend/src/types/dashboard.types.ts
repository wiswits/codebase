/**
 * Dashboard Types
 */

import { Employee, Department, Project, Allocation } from './utilization.types';

export interface DashboardSummary {
  totalEmployees: number;
  activeEmployees: number;
  availableCapacity: number;
  allocatedCapacity: number;
  utilizationPercentage: number;
  benchEmployees: number;
  overUtilized: number;
  underUtilized: number;
  activeProjects: number;
}

export interface DepartmentSummary {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
  totalCapacity: number;
  allocatedCapacity: number;
  utilizationPercentage: number;
}

export interface TeamSummary {
  teamId: number;
  teamName: string;
  memberCount: number;
  utilizationPercentage: number;
  status: 'optimal' | 'over' | 'under';
}

export interface RecentActivity {
  id: number;
  type: 'allocation' | 'bench' | 'utilization' | 'employee';
  message: string;
  timestamp: string;
  userId: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  departments: DepartmentSummary[];
  recentActivities: RecentActivity[];
  topUtilized: Employee[];
  underUtilized: Employee[];
  activeProjects: Project[];
}

export interface DashboardStats {
  cards: {
    title: string;
    value: number | string;
    change?: number;
    icon: string;
    color: string;
  }[];
}