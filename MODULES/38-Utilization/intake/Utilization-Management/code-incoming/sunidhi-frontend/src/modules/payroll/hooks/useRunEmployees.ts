// src/modules/payroll/hooks/useRunEmployees.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "../services/payrollApi";
import { RunEmployeeRow } from "../types/payroll.types";

export function useRunEmployees(runId?: number) {
  const [rows, setRows] = useState<RunEmployeeRow[]>([]);
  const [loading, setLoading] = useState(Boolean(runId));
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getRunEmployees(runId);
      setRows(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load employee payroll records."
      );
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return { rows, loading, error, refetch: fetchRows };
}
