'use client';

import { useCallback, useEffect, useState } from 'react';
import { arrearService, deductionService } from '../services/adjustment.service';
import type {
  CreateArrearInput,
  CreateDeductionInput,
  SalaryArrear,
  SalaryDeduction,
  UpdateArrearInput,
  UpdateDeductionInput,
} from '../types';

type LoadStatus = 'loading' | 'success' | 'empty' | 'error';

interface UseAdjustmentsResult {
  deductions: SalaryDeduction[];
  arrears: SalaryArrear[];
  status: LoadStatus;
  errorMessage: string | null;
  refetch: () => void;
  addDeduction: (input: CreateDeductionInput) => Promise<{ ok: boolean; message: string }>;
  updateDeduction: (
    id: number,
    input: UpdateDeductionInput
  ) => Promise<{ ok: boolean; message: string }>;
  cancelDeduction: (id: number) => Promise<{ ok: boolean; message: string }>;
  addArrear: (input: CreateArrearInput) => Promise<{ ok: boolean; message: string }>;
  updateArrear: (id: number, input: UpdateArrearInput) => Promise<{ ok: boolean; message: string }>;
  cancelArrear: (id: number) => Promise<{ ok: boolean; message: string }>;
}

export function useAdjustments(runId: number): UseAdjustmentsResult {
  const [deductions, setDeductions] = useState<SalaryDeduction[]>([]);
  const [arrears, setArrears] = useState<SalaryArrear[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    const [deductionsResult, arrearsResult] = await Promise.all([
      deductionService.listForRun(runId),
      arrearService.listForRun(runId),
    ]);

    if (!deductionsResult.success) {
      setStatus('error');
      setErrorMessage(deductionsResult.message || 'Unable to load deductions.');
      return;
    }
    if (!arrearsResult.success) {
      setStatus('error');
      setErrorMessage(arrearsResult.message || 'Unable to load arrears.');
      return;
    }

    setDeductions(deductionsResult.data);
    setArrears(arrearsResult.data);
    setStatus(deductionsResult.data.length === 0 && arrearsResult.data.length === 0 ? 'empty' : 'success');
  }, [runId, reloadToken]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = () => setReloadToken((t) => t + 1);

  return {
    deductions,
    arrears,
    status,
    errorMessage,
    refetch,
    addDeduction: async (input) => {
      const result = await deductionService.create(runId, input);
      if (result.success) refetch();
      return { ok: result.success, message: result.message };
    },
    updateDeduction: async (id, input) => {
      const result = await deductionService.update(id, input);
      if (result.success) refetch();
      return { ok: result.success, message: result.message };
    },
    cancelDeduction: async (id) => {
      const result = await deductionService.cancel(id);
      if (result.success) refetch();
      return { ok: result.success, message: result.message };
    },
    addArrear: async (input) => {
      const result = await arrearService.create(runId, input);
      if (result.success) refetch();
      return { ok: result.success, message: result.message };
    },
    updateArrear: async (id, input) => {
      const result = await arrearService.update(id, input);
      if (result.success) refetch();
      return { ok: result.success, message: result.message };
    },
    cancelArrear: async (id) => {
      const result = await arrearService.cancel(id);
      if (result.success) refetch();
      return { ok: result.success, message: result.message };
    },
  };
}
