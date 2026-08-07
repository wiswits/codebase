import { PAYROLL_API_BASE } from '../constants';
import { httpClient } from './httpClient';
import type {
  APIResult,
  CreatePayrollRunInput,
  PaginatedResult,
  PayrollRun,
  PayrollRunEmployeeRecord,
  PayrollRunListFilters,
} from '../types';

function buildQuery(filters: PayrollRunListFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.period) params.set('period', filters.period);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const payrollRunService = {
  list: (filters?: PayrollRunListFilters): Promise<APIResult<PaginatedResult<PayrollRun>>> =>
    httpClient.get(`${PAYROLL_API_BASE}/runs${buildQuery(filters)}`),

  get: (runId: number): Promise<APIResult<PayrollRun>> =>
    httpClient.get(`${PAYROLL_API_BASE}/runs/${runId}`),

  getEmployeeRecords: (
    runId: number
  ): Promise<APIResult<PayrollRunEmployeeRecord[]>> =>
    httpClient.get(`${PAYROLL_API_BASE}/runs/${runId}/employees`),

  create: (input: CreatePayrollRunInput): Promise<APIResult<PayrollRun>> =>
    httpClient.post(`${PAYROLL_API_BASE}/runs`, input),

  /** Moves the run through allowed states, e.g. draft → prepared. Backend-controlled. */
  updateState: (
    runId: number,
    patch: { status: PayrollRun['status'] }
  ): Promise<APIResult<PayrollRun>> =>
    httpClient.patch(`${PAYROLL_API_BASE}/runs/${runId}`, patch),

  /**
   * §28 — highly restricted endpoint. Requires hr.payroll.run permission,
   * enforced server-side. The frontend only triggers it with explicit
   * confirmation; it never predicts or displays a result before the
   * backend responds.
   */
  execute: (runId: number): Promise<APIResult<PayrollRun>> =>
    httpClient.post(`${PAYROLL_API_BASE}/runs/${runId}/execute`),
};
