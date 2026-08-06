// src/modules/payroll/components/runs/PayrollRunDetail.tsx
//
// Execution is the most restricted action in this module (Section 43:
// hr.payroll.run). The frontend never performs the calculation and
// never assumes success — it calls the endpoint, shows an explicit
// confirmation first (Section 24), and reflects only what the backend
// returns.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { usePayrollRun } from "../../hooks/usePayrollRun";
import { useRunEmployees } from "../../hooks/useRunEmployees";
import { formatMoney } from "../../constants/payroll.constants";
import PayrollRunStatusBadge from "./PayrollRunStatusBadge";
import EmployeePayrollTable from "./EmployeePayrollTable";
import DeductionsPanel from "../adjustments/DeductionsPanel";
import ArrearsPanel from "../adjustments/ArrearsPanel";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";
import ConfirmDialog from "../common/ConfirmDialog";

interface PayrollRunDetailProps {
  runId: number;
}

export default function PayrollRunDetail({ runId }: PayrollRunDetailProps) {
  const router = useRouter();
  const { run, loading, error, executing, executeError, executeRun, refetch } =
    usePayrollRun(runId);
  const { rows, loading: rowsLoading, refetch: refetchRows } = useRunEmployees(runId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) return <LoadingState rows={4} label="Loading payroll run" />;

  if (error) {
    return <ErrorState title="Unable to load this payroll run" message={error} onRetry={refetch} />;
  }

  if (!run) return null;

  const canExecute = run.status === "prepared";

  const handleExecute = async () => {
    const updated = await executeRun();
    setConfirmOpen(false);
    if (updated) refetchRows();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{run.runReference}</h1>
            <p className="text-sm text-gray-500">Period: {run.payrollPeriod}</p>
          </div>
          <PayrollRunStatusBadge status={run.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Employees</p>
            <p className="mt-0.5 font-medium text-gray-800">{run.employeeCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Gross Total</p>
            <p className="mt-0.5 font-medium text-gray-800">₹{formatMoney(run.grossTotal)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Arrears Total</p>
            <p className="mt-0.5 font-medium text-gray-800">₹{formatMoney(run.arrearsTotal)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Final Total</p>
            <p className="mt-0.5 font-medium text-gray-800">₹{formatMoney(run.finalTotal)}</p>
          </div>
        </div>

        {executeError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {executeError}
          </div>
        )}

        {canExecute && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={executing}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:opacity-90"
          >
            <PlayCircle className="h-4 w-4" />
            {executing ? "Executing…" : "Execute Payroll Run"}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
          Employee Payroll Records
        </h2>
        {rowsLoading ? (
          <LoadingState label="Loading employee payroll records" />
        ) : (
          <EmployeePayrollTable
            rows={rows}
            onViewPayslip={(payslipId) => router.push(`/hr/payroll/payslips/${payslipId}`)}
          />
        )}
      </div>

      <DeductionsPanel runId={run.id} />
      <ArrearsPanel runId={run.id} />

      <ConfirmDialog
        open={confirmOpen}
        title="Execute this payroll run?"
        message="This will submit the run for authorized payroll processing. This action cannot be undone from the frontend."
        confirmLabel="Execute"
        busy={executing}
        onConfirm={handleExecute}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
