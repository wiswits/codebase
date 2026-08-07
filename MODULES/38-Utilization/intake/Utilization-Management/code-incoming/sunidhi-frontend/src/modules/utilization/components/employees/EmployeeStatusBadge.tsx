// src/modules/utilization/components/employees/EmployeeStatusBadge.tsx

import {
  EMPLOYMENT_STATUS_BADGE_CLASSES,
  EMPLOYMENT_STATUS_LABELS,
} from "../../constants/utilization.constants";
import { EmploymentStatus } from "../../types/utilization.types";
import StatusBadge from "../common/StatusBadge";

export default function EmployeeStatusBadge({ status }: { status: EmploymentStatus }) {
  return (
    <StatusBadge
      label={EMPLOYMENT_STATUS_LABELS[status]}
      className={EMPLOYMENT_STATUS_BADGE_CLASSES[status]}
    />
  );
}
