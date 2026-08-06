import { AppError } from '../utils/response.util';
import { buildTotalPages } from '../utils/pagination.util';
import {
  Allocation,
  AuthenticatedUser,
  CreateAllocationInput,
  PaginatedResult,
  UpdateAllocationInput,
} from '../types';

import { allocationRepository } from '../repositories/allocation.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { auditService } from '../../../core/audit/audit.service';
import { withTransaction } from '../../../core/database/transaction';

export interface ListAllocationsFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  employee_id?: string;
  project_id?: string;
  status?: string;
}

const MAX_ALLOCATION_PERCENTAGE = 100;

class AllocationService {
  async list(user: AuthenticatedUser, filters: ListAllocationsFilters): Promise<PaginatedResult<Allocation>> {
    const { items, total } = await allocationRepository.findManyByOrg(user.org_id, filters);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: buildTotalPages(total, filters.limit),
    };
  }

  async getById(user: AuthenticatedUser, allocationId: string): Promise<Allocation> {
    const allocation = await allocationRepository.findByIdAndOrg(allocationId, user.org_id);

    if (!allocation) {
      throw new AppError('Allocation not found.', 404, 'ALLOCATION_NOT_FOUND');
    }

    return allocation;
  }

  /**
   * Creates an allocation after verifying the employee exists in the
   * organization and that the new allocation does not push the employee's
   * overlapping allocation percentage above 100%. Persistence happens in a
   * single transaction since capacity checks and the insert must remain
   * consistent under concurrent requests.
   */
  async create(user: AuthenticatedUser, input: CreateAllocationInput): Promise<Allocation> {
    const employee = await employeeRepository.findByIdAndOrg(input.employee_id, user.org_id);

    if (!employee) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const allocation = await withTransaction(async (trx) => {
      const overlappingPercentage = await allocationRepository.sumOverlappingPercentage(
        input.employee_id,
        user.org_id,
        input.start_date,
        input.end_date,
        trx,
      );

      if (overlappingPercentage + input.allocation_percentage > MAX_ALLOCATION_PERCENTAGE) {
        throw new AppError(
          `Allocation exceeds available capacity. Employee already allocated ${overlappingPercentage}% for the overlapping period.`,
          409,
          'ALLOCATION_CAPACITY_EXCEEDED',
        );
      }

      return allocationRepository.create(
        {
          ...input,
          org_id: user.org_id,
          status: 'draft',
        },
        trx,
      );
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'CREATE',
      resource: 'ALLOCATION',
      resource_id: allocation.id,
      metadata: { employee_id: input.employee_id, project_id: input.project_id },
    });

    return allocation;
  }

  async update(user: AuthenticatedUser, allocationId: string, input: UpdateAllocationInput): Promise<Allocation> {
    const existing = await allocationRepository.findByIdAndOrg(allocationId, user.org_id);

    if (!existing) {
      throw new AppError('Allocation not found.', 404, 'ALLOCATION_NOT_FOUND');
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      throw new AppError(
        'Cannot modify an allocation that is already completed or cancelled.',
        409,
        'ALLOCATION_LOCKED',
      );
    }

    const updated = await withTransaction(async (trx) => {
      if (input.allocation_percentage !== undefined) {
        const overlappingPercentage = await allocationRepository.sumOverlappingPercentage(
          existing.employee_id,
          user.org_id,
          input.start_date ?? existing.start_date,
          input.end_date ?? existing.end_date,
          trx,
          allocationId,
        );

        if (overlappingPercentage + input.allocation_percentage > MAX_ALLOCATION_PERCENTAGE) {
          throw new AppError(
            `Allocation exceeds available capacity. Employee already allocated ${overlappingPercentage}% for the overlapping period.`,
            409,
            'ALLOCATION_CAPACITY_EXCEEDED',
          );
        }
      }

      return allocationRepository.update(allocationId, user.org_id, input, trx);
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'UPDATE',
      resource: 'ALLOCATION',
      resource_id: allocationId,
      metadata: { changes: input },
    });

    return updated;
  }

  async delete(user: AuthenticatedUser, allocationId: string): Promise<void> {
    const existing = await allocationRepository.findByIdAndOrg(allocationId, user.org_id);

    if (!existing) {
      throw new AppError('Allocation not found.', 404, 'ALLOCATION_NOT_FOUND');
    }

    await allocationRepository.softDelete(allocationId, user.org_id);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'DELETE',
      resource: 'ALLOCATION',
      resource_id: allocationId,
    });
  }
}

export const allocationService = new AllocationService();
