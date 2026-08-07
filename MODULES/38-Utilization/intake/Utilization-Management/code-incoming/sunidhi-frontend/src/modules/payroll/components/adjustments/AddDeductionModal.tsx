'use client';

import { useState } from 'react';
import type { CreateDeductionInput } from '../../types';

interface AddDeductionModalProps {
  employeeOptions: { id: number; name: string }[];
  onSubmit: (input: CreateDeductionInput) => Promise<{ ok: boolean; message: string }>;
  onClose: () => void;
}

export function AddDeductionModal({ employeeOptions, onSubmit, onClose }: AddDeductionModalProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!employeeId) {
      setFormError('Select an employee.');
      return;
    }
    if (!title.trim()) {
      setFormError('Enter a deduction title.');
      return;
    }
    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      employeeId: employeeId as number,
      deductionTitle: title.trim(),
      amount: numericAmount.toFixed(2),
      reason: reason.trim() || undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="add-deduction-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2 id="add-deduction-title" className="text-base font-semibold text-slate-900">Add manual deduction</h2>
        <p className="mb-4 text-sm text-slate-500">Deductions are applied against the employee's gross salary for this run.</p>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Employee</span>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select employee</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Deduction title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advance recovery"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {formError && (
          <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {submitting ? 'Saving…' : 'Add deduction'}
          </button>
        </div>
      </form>
    </div>
  );
}
