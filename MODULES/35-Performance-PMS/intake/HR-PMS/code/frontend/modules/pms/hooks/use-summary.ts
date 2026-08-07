"use client";

import { summaryService } from "../services/summary.service";
import { useAsyncResource } from "./use-async-resource";

export function useRatingSummary(cycleId: string, employeeId: string) {
  const { state, refetch } = useAsyncResource(
    () => summaryService.get(cycleId, employeeId),
    [cycleId, employeeId],
  );
  return { summaryState: state, refetchSummary: refetch };
}
