/**
 * Payroll Dashboard Mock Data
 */

import { PayrollDashboardStats } from '../types/payroll.types';

export const mockDashboardStats: PayrollDashboardStats = {
  totalEmployees: 156,
  currentPeriod: '2026-07',
  runStatus: 'completed',
  grossTotal: 4785000,
  deductionsTotal: 215000,
  arrearsTotal: 45000,
  payslipsGenerated: 156,
  recentRuns: [
    {
      id: 1,
      organizationId: 1,
      payrollPeriod: '2026-07',
      runReference: 'PR-2026-07-001',
      status: 'completed',
      employeeCount: 156,
      grossTotal: 4785000,
      arrearsTotal: 45000,
      deductionsTotal: 215000,
      finalTotal: 4615000,
      preparedAt: '2026-07-25T09:00:00Z',
      executedAt: '2026-07-25T14:30:00Z',
      createdAt: '2026-07-25T09:00:00Z',
      updatedAt: '2026-07-25T14:30:00Z'
    },
    {
      id: 2,
      organizationId: 1,
      payrollPeriod: '2026-06',
      runReference: 'PR-2026-06-001',
      status: 'completed',
      employeeCount: 152,
      grossTotal: 4652000,
      arrearsTotal: 32000,
      deductionsTotal: 198000,
      finalTotal: 4486000,
      preparedAt: '2026-06-25T09:00:00Z',
      executedAt: '2026-06-25T14:30:00Z',
      createdAt: '2026-06-25T09:00:00Z',
      updatedAt: '2026-06-25T14:30:00Z'
    },
    {
      id: 3,
      organizationId: 1,
      payrollPeriod: '2026-05',
      runReference: 'PR-2026-05-001',
      status: 'processing',
      employeeCount: 148,
      grossTotal: 4518000,
      arrearsTotal: 28000,
      deductionsTotal: 185000,
      finalTotal: 4360000,
      preparedAt: '2026-05-25T09:00:00Z',
      createdAt: '2026-05-25T09:00:00Z',
      updatedAt: '2026-05-25T09:00:00Z'
    }
  ]
};