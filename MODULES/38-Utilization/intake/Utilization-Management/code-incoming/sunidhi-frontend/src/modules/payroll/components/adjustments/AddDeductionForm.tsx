// src/modules/payroll/components/adjustments/AddDeductionForm.tsx
//
// Frontend validation only (Standards Section 6) — the amount entered
// here is not combined with anything else in the frontend; it is sent
// to the backend as-is (Section 8: no payroll calculations client-side).

"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { payrollApi } from "../../services/payrollApi";
import { DeductionInput, EmployeeSummary } from "../../types/payroll.types";

interface AddDeductionFormProps {
  submitting: boolean;
  submitError: string | null;
  onSubmit: (input: DeductionInput) => void;
  onCancel: () => void;
}

const emptyForm: DeductionInput = {
  employeeId: 0,
  deductionTitle: "",
  amount: "",
  reason: "",
  notes: "",
};

export default function AddDeductionForm({
  submitting,
  submitError,
  onSubmit,
  onCancel,
}: AddDeductionFormProps) {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [form, setForm] = useState<DeductionInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    payrollApi.getEmployeeOptions().then(setEmployees);
  }, []);

  const setField = <K extends keyof DeductionInput>(key: K, value: DeductionInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.employeeId) next.employeeId = "Select an employee.";
    if (!form.deductionTitle.trim()) next.deductionTitle = "Deduction title is required.";
    if (!form.amount || Number(form.amount) <= 0) next.amount = "Enter a valid amount.";
    if (!form.reason.trim()) next.reason = "Reason is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Add Deduction</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Employee" error={errors.employeeId}>
          <select
            value={form.employeeId || ""}
            onChange={(e) => setField("employeeId", Number(e.target.value))}
            className={inputClass(Boolean(errors.employeeId))}
          >
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Deduction Title" error={errors.deductionTitle}>
          <input
            type="text"
            value={form.deductionTitle}
            onChange={(e) => setField("deductionTitle", e.target.value)}
            className={inputClass(Boolean(errors.deductionTitle))}
          />
        </Field>

        <Field label="Amount" error={errors.amount}>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => setField("amount", e.target.value)}
            className={inputClass(Boolean(errors.amount))}
          />
        </Field>

        <Field label="Reason" error={errors.reason}>
          <input
            type="text"
            value={form.reason}
            onChange={(e) => setField("reason", e.target.value)}
            className={inputClass(Boolean(errors.reason))}
          />
        </Field>

        <Field label="Notes (optional)" full>
          <textarea
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={2}
            className={inputClass(false)}
          />
        </Field>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:opacity-90"
        >
          {submitting ? "Adding…" : "Add Deduction"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-400"
      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
  }`;
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-gray-500 ${full ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
      {error && <span className="text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}
