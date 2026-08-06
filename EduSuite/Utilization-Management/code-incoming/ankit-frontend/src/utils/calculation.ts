/**
 * Calculation Utilities
 */

import { UTILIZATION_THRESHOLDS } from './constants';

export const calculateUtilization = (allocatedHours: number, totalCapacity: number): number => {
  if (totalCapacity === 0) return 0;
  return (allocatedHours / totalCapacity) * 100;
};

export const getUtilizationStatus = (utilization: number): 'optimal' | 'over' | 'under' => {
  if (utilization >= UTILIZATION_THRESHOLDS.OVER) return 'over';
  if (utilization < UTILIZATION_THRESHOLDS.UNDER) return 'under';
  return 'optimal';
};

export const calculateAvailableCapacity = (
  totalCapacity: number,
  allocatedHours: number
): number => {
  return Math.max(0, totalCapacity - allocatedHours);
};

export const getBenchStatus = (allocations: any[]): boolean => {
  return allocations.length === 0;
};

export const calculateAllocationPercentage = (
  allocatedHours: number,
  weeklyCapacity: number
): number => {
  if (weeklyCapacity === 0) return 0;
  return (allocatedHours / weeklyCapacity) * 100;
};

export const getDepartmentUtilization = (
  employees: { capacity: number; allocated: number }[]
): number => {
  const totalCapacity = employees.reduce((sum, e) => sum + e.capacity, 0);
  const totalAllocated = employees.reduce((sum, e) => sum + e.allocated, 0);
  return calculateUtilization(totalAllocated, totalCapacity);
};

export const getTeamUtilization = getDepartmentUtilization;

export const getOverUtilizedEmployees = (
  employees: { id: number; utilization: number }[]
): { id: number; utilization: number }[] => {
  return employees.filter(e => e.utilization >= UTILIZATION_THRESHOLDS.OVER);
};

export const getUnderUtilizedEmployees = (
  employees: { id: number; utilization: number }[]
): { id: number; utilization: number }[] => {
  return employees.filter(e => e.utilization < UTILIZATION_THRESHOLDS.UNDER);
};

export const getBenchEmployees = (employees: any[]): any[] => {
  return employees.filter(e => e.benchStatus === true);
};