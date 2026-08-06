import { AppError } from '../utils/response.util';
import { buildTotalPages } from '../utils/pagination.util';
import {
  AuthenticatedUser,
  CreateEmployeeInput,
  Employee,
  PaginatedResult,
  UpdateEmployeeInput,
} from '../types';

import { employeeRepository } from '../repositories/employee.repository';
import { auditService } from '../../../core/audit/audit.service';

export interface ListEmployeesFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: string;
  department?: string;
  search?: string;
}

class EmployeeService {
  async list(user: AuthenticatedUser, filters: ListEmployeesFilters): Promise<PaginatedResult<Employee>> {
    const orgId = user.org_id;

    const { items, total } = await employeeRepository.findManyByOrg(orgId, filters);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: buildTotalPages(total, filters.limit),
    };
  }

  async getById(user: AuthenticatedUser, employeeId: string): Promise<Employee> {
    const employee = await employeeRepository.findByIdAndOrg(employeeId, user.org_id);

    if (!employee) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    return employee;
  }

  async create(user: AuthenticatedUser, input: CreateEmployeeInput): Promise<Employee> {
    const existing = await employeeRepository.findByEmailAndOrg(input.email, user.org_id);

    if (existing) {
      throw new AppError(
        'An employee with this email already exists in your organization.',
        409,
        'EMPLOYEE_EMAIL_CONFLICT',
      );
    }

    const employee = await employeeRepository.create({
      ...input,
      org_id: user.org_id,
      status: 'active',
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'CREATE',
      resource: 'EMPLOYEE',
      resource_id: employee.id,
      metadata: { employee_code: employee.employee_code },
    });

    return employee;
  }

  async update(user: AuthenticatedUser, employeeId: string, input: UpdateEmployeeInput): Promise<Employee> {
    const existing = await employeeRepository.findByIdAndOrg(employeeId, user.org_id);

    if (!existing) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const updated = await employeeRepository.update(employeeId, user.org_id, input);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'UPDATE',
      resource: 'EMPLOYEE',
      resource_id: employeeId,
      metadata: { changes: input },
    });

    return updated;
  }

  async delete(user: AuthenticatedUser, employeeId: string): Promise<void> {
    const existing = await employeeRepository.findByIdAndOrg(employeeId, user.org_id);

    if (!existing) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const hasActiveAllocations = await employeeRepository.hasActiveAllocations(employeeId, user.org_id);

    if (hasActiveAllocations) {
      throw new AppError(
        'Cannot delete an employee with active allocations. Reassign or complete allocations first.',
        409,
        'EMPLOYEE_HAS_ACTIVE_ALLOCATIONS',
      );
    }

    await employeeRepository.softDelete(employeeId, user.org_id);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'DELETE',
      resource: 'EMPLOYEE',
      resource_id: employeeId,
    });
  }
}

export const employeeService = new EmployeeService();
