// src/modules/payroll/hooks/useArrears.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "../services/payrollApi";
import { Arrear, ArrearInput } from "../types/payroll.types";

export function useArrears(runId?: number) {
  const [items, setItems] = useState<Arrear[]>([]);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchArrears = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getArrears(runId);
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load arrears.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchArrears();
  }, [fetchArrears]);

  const addArrear = async (input: ArrearInput) => {
    if (!runId) return null;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await payrollApi.addArrear(runId, input);
      setItems((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to add this arrear.");
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
    addArrear,
    refetch: fetchArrears,
  };
}
