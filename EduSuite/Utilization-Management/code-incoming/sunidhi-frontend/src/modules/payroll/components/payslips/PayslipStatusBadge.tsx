// src/modules/payroll/components/payslips/PayslipStatusBadge.tsx

import { PAYSLIP_STATUS_BADGE_CLASSES, PAYSLIP_STATUS_LABELS } from "../../constants/payroll.constants";
import { PayslipStatus } from "../../types/payroll.types";
import StatusBadge from "../common/StatusBadge";

export default function PayslipStatusBadge({ status }: { status: PayslipStatus }) {
  return (
    <StatusBadge
      label={PAYSLIP_STATUS_LABELS[status]}
      className={PAYSLIP_STATUS_BADGE_CLASSES[status]}
    />
  );
}
