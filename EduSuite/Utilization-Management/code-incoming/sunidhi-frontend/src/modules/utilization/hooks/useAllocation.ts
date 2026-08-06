// src/modules/utilization/hooks/useAllocation.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { utilizationApi } from "../services/utilizationApi";
import { Allocation, AllocationInput } from "../types/utilization.types";

export function useAllocation(allocationId?: number) {
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(Boolean(allocationId));
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchAllocation = useCallback(async () => {
    if (!allocationId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await utilizationApi.getAllocation(allocationId);
      setAllocation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this allocation.");
    } finally {
      setLoading(false);
    }
  }, [allocationId]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation]);

  const create = async (input: AllocationInput) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await utilizationApi.createAllocation(input);
      setAllocation(created);
      return created;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to create this allocation.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const unassign = async () => {
    if (!allocationId) return null;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await utilizationApi.unassignAllocation(allocationId);
      setAllocation(updated);
      return updated;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to unassign this allocation.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    allocation,
    loading,
    error,
    submitting,
    submitError,
    create,
    unassign,
    refetch: fetchAllocation,
  };
}
