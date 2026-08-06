import { AppError } from '../utils/response.util';
import { buildTotalPages } from '../utils/pagination.util';
import {
  AuthenticatedUser,
  GenerateReportInput,
  PaginatedResult,
  ReportRecord,
} from '../types';

import { reportRepository } from '../repositories/report.repository';
import { auditService } from '../../../core/audit/audit.service';
import { notificationService } from './notification.service';

export interface ListReportsFilters {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  report_type?: string;
}

class ReportService {
  async list(user: AuthenticatedUser, filters: ListReportsFilters): Promise<PaginatedResult<ReportRecord>> {
    const { items, total } = await reportRepository.findManyByOrg(user.org_id, filters);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: buildTotalPages(total, filters.limit),
    };
  }

  async getById(user: AuthenticatedUser, reportId: string): Promise<ReportRecord> {
    const record = await reportRepository.findByIdAndOrg(reportId, user.org_id);

    if (!record) {
      throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
    }

    return record;
  }

  /**
   * Queues report generation. Report content assembly (pulling from the
   * utilization/allocation/capacity/bench repositories) is performed by an
   * async worker; this service is responsible for creating the tracked
   * report record and kicking off that process.
   */
  async generate(user: AuthenticatedUser, input: GenerateReportInput): Promise<ReportRecord> {
    const record = await reportRepository.create({
      org_id: user.org_id,
      report_type: input.report_type,
      period_start: input.period_start,
      period_end: input.period_end,
      generated_by: user.id,
      status: 'pending',
    });

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'CREATE',
      resource: 'REPORT',
      resource_id: record.id,
      metadata: { report_type: input.report_type },
    });

    await notificationService.notifyReportQueued(user.org_id, user.id, record.id);

    return record;
  }

  async getDownloadUrl(user: AuthenticatedUser, reportId: string): Promise<{ url: string; expires_at: string }> {
    const record = await reportRepository.findByIdAndOrg(reportId, user.org_id);

    if (!record) {
      throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
    }

    if (record.status !== 'ready') {
      throw new AppError('Report is not ready for download yet.', 409, 'REPORT_NOT_READY');
    }

    const download = await reportRepository.getSignedDownloadUrl(reportId, user.org_id);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'PUBLISH',
      resource: 'REPORT',
      resource_id: reportId,
      metadata: { action_detail: 'download_link_issued' },
    });

    return download;
  }

  async delete(user: AuthenticatedUser, reportId: string): Promise<void> {
    const existing = await reportRepository.findByIdAndOrg(reportId, user.org_id);

    if (!existing) {
      throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
    }

    await reportRepository.softDelete(reportId, user.org_id);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'DELETE',
      resource: 'REPORT',
      resource_id: reportId,
    });
  }
}

export const reportService = new ReportService();
