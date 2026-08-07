// Internal support service used by other module services (bench, report,
// etc.) to send in-app/email notifications. It has no dedicated
// controller/route since it is not exposed directly as an API resource.

import { notificationDispatcher } from '../../../core/notifications/notification-dispatcher';

class NotificationService {
  async notifyBenchAssignment(orgId: string, employeeId: string, reason: string): Promise<void> {
    await notificationDispatcher.dispatch({
      org_id: orgId,
      type: 'BENCH_ASSIGNED',
      target: { employee_id: employeeId },
      payload: { reason },
    });
  }

  async notifyBenchUnassignment(orgId: string, employeeId: string): Promise<void> {
    await notificationDispatcher.dispatch({
      org_id: orgId,
      type: 'BENCH_UNASSIGNED',
      target: { employee_id: employeeId },
      payload: {},
    });
  }

  async notifyReportQueued(orgId: string, requestedBy: string, reportId: string): Promise<void> {
    await notificationDispatcher.dispatch({
      org_id: orgId,
      type: 'REPORT_QUEUED',
      target: { user_id: requestedBy },
      payload: { report_id: reportId },
    });
  }

  async notifyReportReady(orgId: string, requestedBy: string, reportId: string): Promise<void> {
    await notificationDispatcher.dispatch({
      org_id: orgId,
      type: 'REPORT_READY',
      target: { user_id: requestedBy },
      payload: { report_id: reportId },
    });
  }
}

export const notificationService = new NotificationService();
