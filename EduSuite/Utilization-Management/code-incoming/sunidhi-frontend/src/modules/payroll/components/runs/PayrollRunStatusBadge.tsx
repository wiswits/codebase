// src/modules/payroll/components/runs/PayrollRunStatusBadge.tsx

import { PAYROLL_RUN_STATUS_BADGE_CLASSES, PAYROLL_RUN_STATUS_LABELS } from "../../constants/payroll.constants";
import { PayrollRunStatus } from "../../types/payroll.types";
import StatusBadge from "../common/StatusBadge";

export default function PayrollRunStatusBadge({ status }: { status: PayrollRunStatus }) {
  return (
    <StatusBadge
      label={PAYROLL_RUN_STATUS_LABELS[status]}
      className={PAYROLL_RUN_STATUS_BADGE_CLASSES[status]}
    />
  );
}
