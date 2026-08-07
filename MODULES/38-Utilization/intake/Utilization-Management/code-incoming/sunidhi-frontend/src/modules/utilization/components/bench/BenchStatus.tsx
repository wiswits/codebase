// src/modules/utilization/components/bench/BenchStatus.tsx

import { BENCH_STATUS_BADGE_CLASSES, BENCH_STATUS_LABELS } from "../../constants/utilization.constants";
import { BenchRecordStatus } from "../../types/utilization.types";
import StatusBadge from "../common/StatusBadge";

export default function BenchStatus({ status }: { status: BenchRecordStatus }) {
  return (
    <StatusBadge label={BENCH_STATUS_LABELS[status]} className={BENCH_STATUS_BADGE_CLASSES[status]} />
  );
}
