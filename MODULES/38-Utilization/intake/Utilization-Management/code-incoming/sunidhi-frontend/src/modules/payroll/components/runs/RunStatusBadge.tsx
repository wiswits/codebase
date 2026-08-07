import { PAYROLL_RUN_STATUS_LABEL, PAYROLL_RUN_STATUS_STYLE } from '../../constants';
import type { PayrollRunStatus } from '../../types';

export function RunStatusBadge({ status }: { status: PayrollRunStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYROLL_RUN_STATUS_STYLE[status]}`}
    >
      {PAYROLL_RUN_STATUS_LABEL[status]}
    </span>
  );
}
