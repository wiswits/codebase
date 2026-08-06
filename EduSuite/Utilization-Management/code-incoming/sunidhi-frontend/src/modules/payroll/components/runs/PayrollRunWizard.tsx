// src/modules/payroll/components/runs/PayrollRunWizard.tsx
//
// Suggested flow (Section 14): Select Period -> Prepare Run -> Load
// Applicable Employees -> Review -> (Adjustments happen on the run
// details screen) -> Authorized Execution. This wizard only covers
// period selection through to review; execution itself lives on
// PayrollRunDetail, gated behind explicit confirmation.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { usePayrollRun } from "../../hooks/usePayrollRun";
import { useRunEmployees } from "../../hooks/useRunEmployees";
import { formatMoney } from "../../constants/payroll.constants";
import LoadingState from "../common/LoadingState";

type Step = "period" | "review";

export default function PayrollRunWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("period");
  const [period, setPeriod] = useState("");
  const [periodError, setPeriodError] = useState<string | null>(null);

  const { run, submitting, submitError, createRun, markPrepared } = usePayrollRun();
  const { rows, loading: rowsLoading } = useRunEmployees(run?.id);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}$/.test(period)) {
      setPeriodError("Enter the period as YYYY-MM, e.g. 2026-08.");
      return;
    }
    setPeriodError(null);
    const created = await createRun(period);
    if (created) setStep("review");
  };

  const handleConfirmPrepared = async () => {
    const updated = await markPrepared();
    if (updated) router.push(`/hr/payroll/runs/${updated.id}`);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Prepare Payroll Run</h1>

      <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
        <span className={step === "period" ? "text-blue-600" : ""}>1. Select Period</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step === "review" ? "text-blue-600" : ""}>2. Review Employees</span>
      </div>

      {step === "period" && (
        <form onSubmit={handleCreateRun} className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            Payroll Period
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-08"
              className={`max-w-xs rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 ${
                periodError
                  ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {periodError && <span className="text-xs font-normal text-red-600">{periodError}</span>}
          </label>

          {submitError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:opacity-90"
          >
            {submitting ? "Preparing…" : "Load Applicable Employees"}
          </button>
        </form>
      )}

      {step === "review" && run && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              Run <span className="font-mono text-xs">{run.runReference}</span> for period{" "}
              <span className="font-medium">{run.payrollPeriod}</span>
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            {rowsLoading ? (
              <LoadingState label="Loading employee payroll records" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Gross Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.employeeId} className="border-b border-gray-50">
                        <td className="px-4 py-3 text-gray-800">{row.employeeName}</td>
                        <td className="px-4 py-3 text-gray-600">
                          ₹{formatMoney(row.grossSalary)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirmPrepared}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:opacity-90"
          >
            {submitting ? "Saving…" : "Mark as Prepared"}
          </button>
        </div>
      )}
    </div>
  );
}
