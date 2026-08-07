// src/modules/payroll/components/payslips/PayslipPreview.tsx
//
// A print/document-style preview of the payslip, distinct from the
// data-summary view in PayslipDetail.tsx (Contract Section 22 lists
// "Payslip preview" as its own screen). Purely presentational — every
// figure is read directly from the payslip record.

import { formatMoney } from "../../constants/payroll.constants";
import { Payslip } from "../../types/payroll.types";
import PdfDownloadButton from "./PdfDownloadButton";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface PayslipPreviewProps {
  payslip: Payslip;
  pdfUrl: string | null;
}

export default function PayslipPreview({ payslip, pdfUrl }: PayslipPreviewProps) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-8">
      <div className="border-b border-gray-100 pb-4 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Payslip</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-800">{payslip.employeeName}</h1>
        <p className="text-sm text-gray-500">Payroll Period: {payslip.payrollPeriod}</p>
      </div>

      <table className="mt-4 w-full text-sm">
        <tbody>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-500">Gross Salary</td>
            <td className="py-2 text-right font-medium text-gray-800">
              ₹{formatMoney(payslip.grossSalary)}
            </td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-500">Manual Arrears</td>
            <td className="py-2 text-right font-medium text-gray-800">
              + ₹{formatMoney(payslip.arrearsTotal)}
            </td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-500">Manual Deductions</td>
            <td className="py-2 text-right font-medium text-gray-800">
              − ₹{formatMoney(payslip.deductionsTotal)}
            </td>
          </tr>
          <tr>
            <td className="py-3 text-sm font-semibold text-gray-800">Final Payroll Amount</td>
            <td className="py-3 text-right text-base font-semibold text-gray-900">
              ₹{formatMoney(payslip.finalAmount)}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 text-center text-xs text-gray-400">
        Generated on {formatDate(payslip.generatedAt)}
      </p>

      <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
        <PdfDownloadButton status={payslip.status} pdfUrl={pdfUrl} />
      </div>
    </div>
  );
}
