import { AppError } from '../utils/response.util';
import { buildTotalPages } from '../utils/pagination.util';
import {
  AssignBenchInput,
  AuthenticatedUser,
  BenchRecord,
  PaginatedResult,
  UnassignBenchInput,
} from '../types';

import { benchRepository } from '../repositories/bench.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { auditService } from '../../../core/audit/audit.service';
import { notificationService } from './notification.service';

export interface ListBenchFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  employee_id?: string;
  active_only?: boolean;
}

class BenchService {
  async list(user: AuthenticatedUser, filters: ListBenchFilters): Promise<PaginatedResult<BenchRecord>> {
    const { items, total } = await benchRepository.findManyByOrg(user.org_id, filters);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: buildTotalPages(total, filters.limit),
    };
  }

  async getById(user: AuthenticatedUser, benchId: string): Promise<BenchRecord> {
    const record = await benchRepository.findByIdAndOrg(benchId, user.org_id);

    if (!record) {
      throw new AppError('Bench record not found.', 404, 'BENCH_NOT_FOUND');
    }

    return record;
  }

  async assign(user: AuthenticatedUser, input: AssignBenchInput): Promise<BenchRecord> {
    const employee = await employeeRepository.findByIdAndOrg(input.employee_id, user.org_id);

    if (!employee) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const alreadyOnBench = await benchRepository.findActiveByEmployee(input.employee_id, user.org_id);

    if (alreadyOnBench) {
      throw new AppError('Employee is already on bench.', 409, 'EMPLOYEE_ALREADY_ON_BENCH');
    }

    const record = await benchRepository.create({
      org_id: user.org_id,
      employee_id: input.employee_id,
      bench_start_date: input.bench_start_date,
      bench_end_date: null,
      reason: input.reason,
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'ASSIGN',
      resource: 'BENCH',
      resource_id: record.id,
      metadata: { employee_id: input.employee_id, reason: input.reason },
    });

    await notificationService.notifyBenchAssignment(user.org_id, input.employee_id, input.reason);

    return record;
  }

  async unassign(user: AuthenticatedUser, benchId: string, input: UnassignBenchInput): Promise<BenchRecord> {
    const existing = await benchRepository.findByIdAndOrg(benchId, user.org_id);

    if (!existing) {
      throw new AppError('Bench record not found.', 404, 'BENCH_NOT_FOUND');
    }

    if (existing.bench_end_date) {
      throw new AppError('Employee is already off bench.', 409, 'BENCH_ALREADY_CLOSED');
    }

    if (new Date(input.bench_end_date) < new Date(existing.bench_start_date)) {
      throw new AppError('bench_end_date cannot be before bench_start_date.', 422, 'INVALID_BENCH_END_DATE');
    }

    const updated = await benchRepository.close(benchId, user.org_id, input.bench_end_date);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'UNASSIGN',
      resource: 'BENCH',
      resource_id: benchId,
      metadata: { bench_end_date: input.bench_end_date },
    });

    return updated;
  }
}

export const benchService = new BenchService();
