import { AppError } from '../utils/response.util';
import { buildTotalPages } from '../utils/pagination.util';
import {
  AuthenticatedUser,
  CreateUtilizationInput,
  PaginatedResult,
  UpdateUtilizationInput,
  UtilizationRecord,
} from '../types';

import { utilizationRepository } from '../repositories/utilization.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { auditService } from '../../../core/audit/audit.service';

export interface ListUtilizationFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  employee_id?: string;
  period_start?: string;
  period_end?: string;
}

function calculateUtilizationPercentage(billable: number, nonBillable: number): number {
  const total = billable + nonBillable;
  if (total <= 0) return 0;
  return Math.round((billable / total) * 10000) / 100;
}

class UtilizationService {
  async list(user: AuthenticatedUser, filters: ListUtilizationFilters): Promise<PaginatedResult<UtilizationRecord>> {
    const { items, total } = await utilizationRepository.findManyByOrg(user.org_id, filters);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: buildTotalPages(total, filters.limit),
    };
  }

  async getById(user: AuthenticatedUser, utilizationId: string): Promise<UtilizationRecord> {
    const record = await utilizationRepository.findByIdAndOrg(utilizationId, user.org_id);

    if (!record) {
      throw new AppError('Utilization record not found.', 404, 'UTILIZATION_NOT_FOUND');
    }

    return record;
  }

  async create(user: AuthenticatedUser, input: CreateUtilizationInput): Promise<UtilizationRecord> {
    const employee = await employeeRepository.findByIdAndOrg(input.employee_id, user.org_id);

    if (!employee) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const duplicate = await utilizationRepository.findOverlapping(
      input.employee_id,
      user.org_id,
      input.period_start,
      input.period_end,
    );

    if (duplicate) {
      throw new AppError(
        'A utilization record already exists for this employee in the given period.',
        409,
        'UTILIZATION_PERIOD_CONFLICT',
      );
    }

    const record = await utilizationRepository.create({
      org_id: user.org_id,
      employee_id: input.employee_id,
      period_start: input.period_start,
      period_end: input.period_end,
      billable_hours: input.billable_hours,
      non_billable_hours: input.non_billable_hours,
      utilization_percentage: calculateUtilizationPercentage(input.billable_hours, input.non_billable_hours),
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'CREATE',
      resource: 'UTILIZATION',
      resource_id: record.id,
      metadata: { employee_id: input.employee_id },
    });

    return record;
  }

  async update(
    user: AuthenticatedUser,
    utilizationId: string,
    input: UpdateUtilizationInput,
  ): Promise<UtilizationRecord> {
    const existing = await utilizationRepository.findByIdAndOrg(utilizationId, user.org_id);

    if (!existing) {
      throw new AppError('Utilization record not found.', 404, 'UTILIZATION_NOT_FOUND');
    }

    const billable = input.billable_hours ?? existing.billable_hours;
    const nonBillable = input.non_billable_hours ?? existing.non_billable_hours;

    const updated = await utilizationRepository.update(utilizationId, user.org_id, {
      ...input,
      utilization_percentage: calculateUtilizationPercentage(billable, nonBillable),
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'UPDATE',
      resource: 'UTILIZATION',
      resource_id: utilizationId,
      metadata: { changes: input },
    });

    return updated;
  }

  async delete(user: AuthenticatedUser, utilizationId: string): Promise<void> {
    const existing = await utilizationRepository.findByIdAndOrg(utilizationId, user.org_id);

    if (!existing) {
      throw new AppError('Utilization record not found.', 404, 'UTILIZATION_NOT_FOUND');
    }

    await utilizationRepository.softDelete(utilizationId, user.org_id);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'DELETE',
      resource: 'UTILIZATION',
      resource_id: utilizationId,
    });
  }
}

export const utilizationService = new UtilizationService();
