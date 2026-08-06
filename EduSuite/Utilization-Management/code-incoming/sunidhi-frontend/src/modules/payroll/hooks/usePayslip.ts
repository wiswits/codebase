// src/modules/payroll/hooks/usePayslip.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { payrollApi } from "../services/payrollApi";
import { Payslip } from "../types/payroll.types";

export function usePayslip(payslipId?: number) {
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(Boolean(payslipId));
  const [error, setError] = useState<string | null>(null);

  const fetchPayslip = useCallback(async () => {
    if (!payslipId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await payrollApi.getPayslip(payslipId);
      setPayslip(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this payslip.");
    } finally {
      setLoading(false);
    }
  }, [payslipId]);

  useEffect(() => {
    fetchPayslip();
  }, [fetchPayslip]);

  const pdfUrl = payslipId ? payrollApi.getPayslipPdfUrl(payslipId) : null;

  return { payslip, loading, error, pdfUrl, refetch: fetchPayslip };
}
