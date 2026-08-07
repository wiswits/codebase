"use client";

import { useCallback, useState } from "react";
import { reviewService, type ListReviewsFilters } from "../services/review.service";
import type {
  APIError,
  CreateAppraisalReviewPayload,
  UpdateAppraisalReviewPayload,
} from "../types";
import { useAsyncResource } from "./use-async-resource";

export function useReviews(filters: ListReviewsFilters) {
  const { state, refetch } = useAsyncResource(
    () => reviewService.list(filters),
    [filters.cycleId, filters.employeeId, filters.reviewType],
    { isEmpty: (data) => data.length === 0 },
  );
  return { reviewsState: state, refetchReviews: refetch };
}

export function useSubmitReview() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<APIError | undefined>();
  const [success, setSuccess] = useState(false);

  const submit = useCallback(
    async (
      payload: CreateAppraisalReviewPayload,
      currentUser: { id: string; name: string },
    ) => {
      setSubmitting(true);
      setError(undefined);
      setSuccess(false);
      const res = await reviewService.create(payload, currentUser);
      setSubmitting(false);
      if (!res.success) {
        setError(res.error);
        return null;
      }
      setSuccess(true);
      return res.data;
    },
    [],
  );

  const update = useCallback(async (id: string, payload: UpdateAppraisalReviewPayload) => {
    setSubmitting(true);
    setError(undefined);
    setSuccess(false);
    const res = await reviewService.update(id, payload);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
      return null;
    }
    setSuccess(true);
    return res.data;
  }, []);

  return {
    submit,
    update,
    submitting,
    error,
    success,
    clearError: () => setError(undefined),
    resetSuccess: () => setSuccess(false),
  };
}
