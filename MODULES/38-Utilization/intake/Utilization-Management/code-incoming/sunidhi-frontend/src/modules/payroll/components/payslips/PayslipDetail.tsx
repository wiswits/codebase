// src/modules/payroll/components/payslips/PayslipDetail.tsx
//
// FR-PAY-003 (Payslip View). Data-summary view — for the print-style
// document layout, see PayslipPreview.tsx; for the PDF action alone,
// see PdfDownloadButton.tsx (Contract Section 22 lists these as
// separate screens).

"use client";

import { FileText } from "lucide-react";
import { usePayslip } from "../../hooks/usePayslip";
import { formatMoney } from "../../constants/payroll.constants";
import PayslipStatusBadge from "./PayslipStatusBadge";
import PdfDownloadButton from "./PdfDownloadButton";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface PayslipDetailProps {
  payslipId: number;
  onOpenPreview: (payslipId: number) => void;
}

export default function PayslipDetail({ payslipId, onOpenPreview }: PayslipDetailProps) {
  const { payslip, loading, error, pdfUrl, refetch } = usePayslip(payslipId);

  if (loading) return <LoadingState rows={4} label="Loading payslip" />;

  if (error) {
    return <ErrorState title="Unable to load this payslip" message={error} onRetry={refetch} />;
  }

  if (!payslip) return null;

  return (
    <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-800">{payslip.employeeName}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Payroll Period: {payslip.payrollPeriod}</p>
        </div>
        <PayslipStatusBadge status={payslip.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Gross Salary</dt>
          <dd className="mt-0.5 font-medium text-gray-800">₹{formatMoney(payslip.grossSalary)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Manual Arrears</dt>
          <dd className="mt-0.5 font-medium text-gray-800">₹{formatMoney(payslip.arrearsTotal)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Manual Deductions
          </dt>
          <dd className="mt-0.5 font-medium text-gray-800">
            ₹{formatMoney(payslip.deductionsTotal)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Final Payroll Amount
          </dt>
          <dd className="mt-0.5 text-base font-semibold text-gray-900">
            ₹{formatMoney(payslip.finalAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Generated Date
          </dt>
          <dd className="mt-0.5 text-gray-700">{formatDate(payslip.generatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <PdfDownloadButton status={payslip.status} pdfUrl={pdfUrl} />
        <button
          type="button"
          onClick={() => onOpenPreview(payslip.id)}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300"
        >
          View Printable Preview
        </button>
      </div>
    </div>
  );
}
