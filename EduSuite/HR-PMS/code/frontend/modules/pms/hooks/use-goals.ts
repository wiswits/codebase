"use client";

import { useCallback, useState } from "react";
import { goalService } from "../services/goal.service";
import type {
  APIError,
  CreateAppraisalGoalPayload,
  UpdateAppraisalGoalPayload,
} from "../types";
import { useAsyncResource } from "./use-async-resource";

export function useGoals(cycleId?: string) {
  const { state, refetch } = useAsyncResource(
    () => goalService.list(cycleId),
    [cycleId],
    { isEmpty: (data) => data.length === 0 },
  );
  return { goalsState: state, refetchGoals: refetch };
}

export function useGoal(id: string) {
  const { state, refetch } = useAsyncResource(() => goalService.get(id), [id]);
  return { goalState: state, refetchGoal: refetch };
}

export function useCreateGoal() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<APIError | undefined>();

  const submit = useCallback(
    async (
      payload: CreateAppraisalGoalPayload,
      currentUser: { id: string; name: string },
    ) => {
      setSubmitting(true);
      setError(undefined);
      const res = await goalService.create(payload, currentUser);
      setSubmitting(false);
      if (!res.success) {
        setError(res.error);
        return null;
      }
      return res.data;
    },
    [],
  );

  return { submit, submitting, error, clearError: () => setError(undefined) };
}

export function useUpdateGoal() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<APIError | undefined>();

  const submit = useCallback(async (id: string, payload: UpdateAppraisalGoalPayload) => {
    setSubmitting(true);
    setError(undefined);
    const res = await goalService.update(id, payload);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
      return null;
    }
    return res.data;
  }, []);

  return { submit, submitting, error, clearError: () => setError(undefined) };
}
