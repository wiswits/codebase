"use client";

import { useCallback, useState } from "react";
import { cycleService } from "../services/cycle.service";
import type {
  APIError,
  CreateAppraisalCyclePayload,
  UpdateAppraisalCyclePayload,
} from "../types";
import { useAsyncResource } from "./use-async-resource";

export function useCycles() {
  const { state, refetch } = useAsyncResource(
    () => cycleService.list(),
    [],
    { isEmpty: (data) => data.length === 0 },
  );
  return { cyclesState: state, refetchCycles: refetch };
}

export function useCycle(id: string) {
  const { state, refetch } = useAsyncResource(() => cycleService.get(id), [id]);
  return { cycleState: state, refetchCycle: refetch };
}

export function useCreateCycle() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<APIError | undefined>();

  const submit = useCallback(async (payload: CreateAppraisalCyclePayload) => {
    setSubmitting(true);
    setError(undefined);
    const res = await cycleService.create(payload);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
      return null;
    }
    return res.data;
  }, []);

  return { submit, submitting, error, clearError: () => setError(undefined) };
}

export function useUpdateCycle() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<APIError | undefined>();

  const submit = useCallback(async (id: string, payload: UpdateAppraisalCyclePayload) => {
    setSubmitting(true);
    setError(undefined);
    const res = await cycleService.update(id, payload);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
      return null;
    }
    return res.data;
  }, []);

  return { submit, submitting, error, clearError: () => setError(undefined) };
}
