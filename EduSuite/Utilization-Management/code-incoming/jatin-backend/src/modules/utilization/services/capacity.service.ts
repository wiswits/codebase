import { AppError } from '../utils/response.util';
import { buildTotalPages } from '../utils/pagination.util';
import {
  AuthenticatedUser,
  CapacityPlan,
  CreateCapacityInput,
  PaginatedResult,
  UpdateCapacityInput,
} from '../types';

import { capacityRepository } from '../repositories/capacity.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { auditService } from '../../../core/audit/audit.service';

export interface ListCapacityFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  employee_id?: string;
  period_start?: string;
  period_end?: string;
}

class CapacityService {
  async list(user: AuthenticatedUser, filters: ListCapacityFilters): Promise<PaginatedResult<CapacityPlan>> {
    const { items, total } = await capacityRepository.findManyByOrg(user.org_id, filters);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: buildTotalPages(total, filters.limit),
    };
  }

  async getById(user: AuthenticatedUser, capacityId: string): Promise<CapacityPlan> {
    const record = await capacityRepository.findByIdAndOrg(capacityId, user.org_id);

    if (!record) {
      throw new AppError('Capacity plan not found.', 404, 'CAPACITY_NOT_FOUND');
    }

    return record;
  }

  async create(user: AuthenticatedUser, input: CreateCapacityInput): Promise<CapacityPlan> {
    const employee = await employeeRepository.findByIdAndOrg(input.employee_id, user.org_id);

    if (!employee) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const duplicate = await capacityRepository.findOverlapping(
      input.employee_id,
      user.org_id,
      input.period_start,
      input.period_end,
    );

    if (duplicate) {
      throw new AppError(
        'A capacity plan already exists for this employee in the given period.',
        409,
        'CAPACITY_PERIOD_CONFLICT',
      );
    }

    const record = await capacityRepository.create({
      ...input,
      org_id: user.org_id,
      allocated_hours: 0,
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'CREATE',
      resource: 'CAPACITY',
      resource_id: record.id,
      metadata: { employee_id: input.employee_id },
    });

    return record;
  }

  async update(user: AuthenticatedUser, capacityId: string, input: UpdateCapacityInput): Promise<CapacityPlan> {
    const existing = await capacityRepository.findByIdAndOrg(capacityId, user.org_id);

    if (!existing) {
      throw new AppError('Capacity plan not found.', 404, 'CAPACITY_NOT_FOUND');
    }

    const nextAllocated = input.allocated_hours ?? existing.allocated_hours;
    const nextAvailable = input.available_hours ?? existing.available_hours;

    if (nextAllocated > nextAvailable) {
      throw new AppError(
        'allocated_hours cannot exceed available_hours.',
        409,
        'CAPACITY_OVER_ALLOCATED',
      );
    }

    const updated = await capacityRepository.update(capacityId, user.org_id, input);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'UPDATE',
      resource: 'CAPACITY',
      resource_id: capacityId,
      metadata: { changes: input },
    });

    return updated;
  }

  async delete(user: AuthenticatedUser, capacityId: string): Promise<void> {
    const existing = await capacityRepository.findByIdAndOrg(capacityId, user.org_id);

    if (!existing) {
      throw new AppError('Capacity plan not found.', 404, 'CAPACITY_NOT_FOUND');
    }

    await capacityRepository.softDelete(capacityId, user.org_id);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'DELETE',
      resource: 'CAPACITY',
      resource_id: capacityId,
    });
  }
}

export const capacityService = new CapacityService();
