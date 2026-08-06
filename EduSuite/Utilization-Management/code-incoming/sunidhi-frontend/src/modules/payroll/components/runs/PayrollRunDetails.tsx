'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePayrollRun } from '../../hooks/usePayrollRun';
import { payrollRunService } from '../../services/payrollRun.service';
import { EmptyState, ErrorState, LoadingState } from '../shared/StateViews';
import { RunStatusBadge } from './RunStatusBadge';
import { EmployeePayrollTable } from './EmployeePayrollTable';
import { formatMoney, formatPayrollPeriod } from '../../utils/formatters';
import { EDITABLE_RUN_STATUSES } from '../../constants';

interface PayrollRunDetailsProps {
  runId: number;
  canExecute: boolean;
  onOpenAdjustments: (runId: number) => void;
}

/**
 * §15 — any transition affecting financial results is backend-controlled.
 * This screen never flips run status locally; it always calls the API and
 * re-renders from the authoritative response.
 */
export function PayrollRunDetails({ runId, canExecute, onOpenAdjustments }: PayrollRunDetailsProps) {
  const { run, employeeRecords, status, errorMessage, refetch } = usePayrollRun(runId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);

  if (status === 'loading') return <LoadingState label="Loading payroll run…" />;
  if (status === 'error') return <ErrorState message={errorMessage ?? 'Something went wrong.'} onRetry={refetch} />;
  if (!run) return <EmptyState title="Payroll run not found" />;

  const isEditable = EDITABLE_RUN_STATUSES.includes(run.status);

  async function handleExecute() {
    setExecuting(true);
    setExecuteError(null);
    const result = await payrollRunService.execute(runId);
    setExecuting(false);

    if (!result.success) {
      setExecuteError(result.message || 'Payroll execution failed.');
      return;
    }
    setConfirmOpen(false);
    refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{run.runReference}</h1>
          <p className="text-sm text-slate-500">{formatPayrollPeriod(run.payrollPeriod)} · {run.employeeCount} employees</p>
        </div>
        <RunStatusBadge status={run.status} />
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Gross total</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">{formatMoney(run.grossTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Arrears total</dt>
          <dd className="mt-1 text-base font-semibold text-emerald-700">{formatMoney(run.arrearsTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Deductions total</dt>
          <dd className="mt-1 text-base font-semibold text-red-700">{formatMoney(run.deductionsTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Final total</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">{formatMoney(run.finalTotal)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpenAdjustments(run.id)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Review arrears &amp; deductions
        </button>

        {canExecute && run.status === 'prepared' && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Execute payroll run
          </button>
        )}

        {!isEditable && (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            This run is {run.status} and can no longer be modified.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Employee payroll records</h2>
        <EmployeePayrollTable records={employeeRecords} />
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="execute-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
              <h2 id="execute-confirm-title" className="text-base font-semibold text-slate-900">
                Execute this payroll run?
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              This will finalize payroll for {formatPayrollPeriod(run.payrollPeriod)} and generate payslips.
              This action cannot be undone from this screen.
            </p>

            {executeError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {executeError}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={executing}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={executing}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {executing ? 'Executing…' : 'Confirm execution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
