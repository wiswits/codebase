import { PAYROLL_API_BASE } from '../constants';
import { httpClient } from './httpClient';
import type {
  APIResult,
  CreateArrearInput,
  CreateDeductionInput,
  SalaryArrear,
  SalaryDeduction,
  UpdateArrearInput,
  UpdateDeductionInput,
} from '../types';

export const deductionService = {
  listForRun: (runId: number): Promise<APIResult<SalaryDeduction[]>> =>
    httpClient.get(`${PAYROLL_API_BASE}/runs/${runId}/deductions`),

  create: (
    runId: number,
    input: CreateDeductionInput
  ): Promise<APIResult<SalaryDeduction>> =>
    httpClient.post(`${PAYROLL_API_BASE}/runs/${runId}/deductions`, input),

  update: (
    deductionId: number,
    input: UpdateDeductionInput
  ): Promise<APIResult<SalaryDeduction>> =>
    httpClient.patch(`${PAYROLL_API_BASE}/deductions/${deductionId}`, input),

  /** "Remove" a draft deduction is modeled as a status update, per §16 —
   *  there is no hard-delete endpoint in the approved contract. */
  cancel: (deductionId: number): Promise<APIResult<SalaryDeduction>> =>
    httpClient.patch(`${PAYROLL_API_BASE}/deductions/${deductionId}`, {
      status: 'cancelled',
    }),
};

export const arrearService = {
  listForRun: (runId: number): Promise<APIResult<SalaryArrear[]>> =>
    httpClient.get(`${PAYROLL_API_BASE}/runs/${runId}/arrears`),

  create: (runId: number, input: CreateArrearInput): Promise<APIResult<SalaryArrear>> =>
    httpClient.post(`${PAYROLL_API_BASE}/runs/${runId}/arrears`, input),

  update: (
    arrearId: number,
    input: UpdateArrearInput
  ): Promise<APIResult<SalaryArrear>> =>
    httpClient.patch(`${PAYROLL_API_BASE}/arrears/${arrearId}`, input),

  cancel: (arrearId: number): Promise<APIResult<SalaryArrear>> =>
    httpClient.patch(`${PAYROLL_API_BASE}/arrears/${arrearId}`, {
      status: 'cancelled',
    }),
};
