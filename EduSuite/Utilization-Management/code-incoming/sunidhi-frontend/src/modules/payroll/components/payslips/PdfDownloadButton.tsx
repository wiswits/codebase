// src/modules/payroll/components/payslips/PdfDownloadButton.tsx
//
// FR-PAY-004. Links directly to the backend's PDF endpoint (Section 19:
// "The PDF must NOT perform independent financial calculations. It
// consumes finalized/approved payroll values") — no PDF is built here.

import { Download } from "lucide-react";
import { PayslipStatus } from "../../types/payroll.types";

interface PdfDownloadButtonProps {
  status: PayslipStatus;
  pdfUrl: string | null;
}

export default function PdfDownloadButton({ status, pdfUrl }: PdfDownloadButtonProps) {
  if (status !== "generated" || !pdfUrl) {
    return (
      <p className="text-sm text-gray-500">
        PDF will be available once this payslip is generated.
      </p>
    );
  }

  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </a>
  );
}
