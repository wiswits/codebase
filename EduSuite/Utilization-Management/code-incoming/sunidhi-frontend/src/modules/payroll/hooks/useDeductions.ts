// src/modules/payroll/hooks/useDeductions.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "../services/payrollApi";
import { Deduction, DeductionInput } from "../types/payroll.types";

export function useDeductions(runId?: number) {
  const [items, setItems] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchDeductions = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getDeductions(runId);
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load deductions.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]);

  const addDeduction = async (input: DeductionInput) => {
    if (!runId) return null;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await payrollApi.addDeduction(runId, input);
      setItems((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to add this deduction.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    items,
    loading,
    error,
    submitting,
    submitError,
    addDeduction,
    refetch: fetchDeductions,
  };
}
