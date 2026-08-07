import { PAYROLL_API_BASE } from '../constants';
import { httpClient } from './httpClient';
import type { APIResult, PaginatedResult, Payslip, PayslipListFilters } from '../types';

function buildQuery(filters: PayslipListFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.period) params.set('period', filters.period);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const payslipService = {
  list: (filters?: PayslipListFilters): Promise<APIResult<PaginatedResult<Payslip>>> =>
    httpClient.get(`${PAYROLL_API_BASE}/payslips${buildQuery(filters)}`),

  get: (payslipId: number): Promise<APIResult<Payslip>> =>
    httpClient.get(`${PAYROLL_API_BASE}/payslips/${payslipId}`),

  /**
   * Returns the PDF endpoint URL for direct download/open. The PDF is
   * generated server-side from the already-finalized record (§19) — the
   * frontend does not build or render the PDF itself.
   */
  getPdfUrl: (payslipId: number): string =>
    `${PAYROLL_API_BASE}/payslips/${payslipId}/pdf`,
};
