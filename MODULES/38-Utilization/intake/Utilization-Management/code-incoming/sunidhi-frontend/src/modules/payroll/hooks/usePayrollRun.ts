// src/modules/payroll/hooks/usePayrollRun.ts
//
// Any transition affecting financial results is backend-controlled
// (Section 15) — this hook never sets a run's status/totals locally
// except by applying exactly what the service call returned.

"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "../services/payrollApi";
import { PayrollRun } from "../types/payroll.types";

export function usePayrollRun(runId?: number) {
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [executing, setExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);

  const fetchRun = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getRun(runId);
      setRun(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this payroll run.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  const createRun = async (payrollPeriod: string) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await payrollApi.createRun(payrollPeriod);
      setRun(created);
      return created;
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to prepare this payroll run."
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const markPrepared = async () => {
    if (!run) return null;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await payrollApi.updateRun(run.id, { status: "prepared" });
      setRun(updated);
      return updated;
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to update this payroll run."
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  // Highly restricted action (Section 43: hr.payroll.run). The backend
  // enforces the permission; if it rejects the call, executeError
  // surfaces the backend's message rather than the UI assuming success.
  const executeRun = async () => {
    if (!run) return null;
    setExecuting(true);
    setExecuteError(null);
    try {
      const updated = await payrollApi.executeRun(run.id);
      setRun(updated);
      return updated;
    } catch (err) {
      setExecuteError(
        err instanceof Error ? err.message : "Unable to execute this payroll run."
      );
      return null;
    } finally {
      setExecuting(false);
    }
  };

  return {
    run,
    loading,
    error,
    submitting,
    submitError,
    executing,
    executeError,
    createRun,
    markPrepared,
    executeRun,
    refetch: fetchRun,
  };
}
