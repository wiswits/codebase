import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../utils/response.util';
import { parsePagination } from '../utils/pagination.util';
import { employeeService } from '../services/employee.service';
import { AuthenticatedUser, CreateEmployeeInput, UpdateEmployeeInput } from '../types';

/**
 * GET /api/v1/utilization/employees
 */
export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const pagination = parsePagination(req.query);

  const result = await employeeService.list(user, {
    ...pagination,
    status: req.query.status as string | undefined,
    department: req.query.department as string | undefined,
    search: req.query.search as string | undefined,
  });

  return sendSuccess(res, result, 'Employees retrieved successfully.');
});

/**
 * GET /api/v1/utilization/employees/:id
 */
export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const employee = await employeeService.getById(user, req.params.id);

  return sendSuccess(res, employee, 'Employee retrieved successfully.');
});

/**
 * POST /api/v1/utilization/employees
 */
export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as CreateEmployeeInput;

  const employee = await employeeService.create(user, input);

  return sendSuccess(res, employee, 'Employee created successfully.', 201);
});

/**
 * PATCH /api/v1/utilization/employees/:id
 */
export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  const input = req.body as UpdateEmployeeInput;

  const employee = await employeeService.update(user, req.params.id, input);

  return sendSuccess(res, employee, 'Employee updated successfully.');
});

/**
 * DELETE /api/v1/utilization/employees/:id
 */
export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as AuthenticatedUser;
  await employeeService.delete(user, req.params.id);

  return sendSuccess(res, null, 'Employee deleted successfully.');
});
