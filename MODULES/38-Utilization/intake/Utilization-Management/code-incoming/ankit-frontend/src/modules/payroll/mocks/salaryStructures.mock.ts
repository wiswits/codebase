/**
 * Salary Structures Mock Data
 */

import { SalaryStructure } from '../types/payroll.types';

export const mockSalaryStructures: SalaryStructure[] = [
  {
    id: 1,
    organizationId: 1,
    employeeId: 1,
    employeeName: 'Aarav Sharma',
    structureName: 'Senior Developer - Grade A',
    grossSalary: 750000,
    effectiveFrom: '2026-01-01',
    status: 'active',
    notes: 'Annual salary review',
    createdBy: 1,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z'
  },
  {
    id: 2,
    organizationId: 1,
    employeeId: 2,
    employeeName: 'Priya Patel',
    structureName: 'Lead Developer - Grade B',
    grossSalary: 850000,
    effectiveFrom: '2026-01-01',
    status: 'active',
    notes: 'Promotion effective Jan 2026',
    createdBy: 1,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z'
  },
  {
    id: 3,
    organizationId: 1,
    employeeId: 3,
    employeeName: 'Rahul Singh',
    structureName: 'Junior Developer - Grade C',
    grossSalary: 450000,
    effectiveFrom: '2026-02-01',
    effectiveTo: '2026-12-31',
    status: 'draft',
    notes: 'New hire structure',
    createdBy: 1,
    createdAt: '2026-01-20T09:30:00Z',
    updatedAt: '2026-01-20T09:30:00Z'
  },
  {
    id: 4,
    organizationId: 1,
    employeeId: 4,
    employeeName: 'Sneha Reddy',
    structureName: 'Senior Designer - Grade A',
    grossSalary: 680000,
    effectiveFrom: '2025-07-01',
    status: 'active',
    notes: 'Design lead',
    createdBy: 1,
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z'
  },
  {
    id: 5,
    organizationId: 1,
    employeeId: 5,
    employeeName: 'Vikram Kumar',
    structureName: 'Product Manager - Grade B',
    grossSalary: 920000,
    effectiveFrom: '2026-01-01',
    status: 'inactive',
    notes: 'Resigned - effective Jan 2026',
    createdBy: 1,
    createdAt: '2025-12-15T11:00:00Z',
    updatedAt: '2026-01-15T16:00:00Z'
  }
];