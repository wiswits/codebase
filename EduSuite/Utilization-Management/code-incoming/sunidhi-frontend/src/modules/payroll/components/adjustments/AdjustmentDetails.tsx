'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdjustments } from '../../hooks/useAdjustments';
import { EmptyState, ErrorState, LoadingState } from '../shared/StateViews';
import { DeductionsPanel } from './DeductionsPanel';
import { ArrearsPanel } from './ArrearsPanel';
import { AddDeductionModal } from './AddDeductionModal';
import { AddArrearModal } from './AddArrearModal';

interface AdjustmentDetailsProps {
  runId: number;
  runEditable: boolean;
  canManage: boolean;
  /** Employee options for the run — sourced from the run's employee records (Payroll Runs area). */
  employeeOptions: { id: number; name: string }[];
}

export function AdjustmentDetails({ runId, runEditable, canManage, employeeOptions }: AdjustmentDetailsProps) {
  const {
    deductions,
    arrears,
    status,
    errorMessage,
    refetch,
    addDeduction,
    cancelDeduction,
    addArrear,
    cancelArrear,
  } = useAdjustments(runId);

  const [modal, setModal] = useState<'deduction' | 'arrear' | null>(null);

  if (status === 'loading') return <LoadingState label="Loading adjustments…" />;
  if (status === 'error') return <ErrorState message={errorMessage ?? 'Something went wrong.'} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Manual deductions</h2>
          {canManage && runEditable && (
            <button
              type="button"
              onClick={() => setModal('deduction')}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add deduction
            </button>
          )}
        </div>
        {status === 'empty' && deductions.length === 0 ? (
          <EmptyState title="No deductions yet" description="Add a manual deduction for an employee in this run." />
        ) : (
          <DeductionsPanel deductions={deductions} editable={runEditable} onCancel={cancelDeduction} />
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Manual arrears</h2>
          {canManage && runEditable && (
            <button
              type="button"
              onClick={() => setModal('arrear')}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add arrear
            </button>
          )}
        </div>
        {status === 'empty' && arrears.length === 0 ? (
          <EmptyState title="No arrears yet" description="Add a manual arrear for an employee in this run." />
        ) : (
          <ArrearsPanel arrears={arrears} editable={runEditable} onCancel={cancelArrear} />
        )}
      </section>

      {modal === 'deduction' && (
        <AddDeductionModal
          employeeOptions={employeeOptions}
          onSubmit={addDeduction}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'arrear' && (
        <AddArrearModal
          employeeOptions={employeeOptions}
          onSubmit={addArrear}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
