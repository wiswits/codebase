'use client';

import { usePayslip } from '../../hooks/usePayslip';
import { EmptyState, ErrorState, LoadingState } from '../shared/StateViews';
import { PayslipPreview } from './PayslipPreview';
import { PdfDownloadButton } from './PdfDownloadButton';

export function PayslipDetails({ payslipId }: { payslipId: number }) {
  const { payslip, status, errorMessage, refetch } = usePayslip(payslipId);

  if (status === 'loading') return <LoadingState label="Loading payslip…" />;
  if (status === 'error') return <ErrorState message={errorMessage ?? 'Something went wrong.'} onRetry={refetch} />;
  if (!payslip) return <EmptyState title="Payslip not found" />;

  return (
    <div className="flex flex-col items-center gap-4">
      <PayslipPreview payslip={payslip} />
      <PdfDownloadButton payslipId={payslip.id} disabled={payslip.status !== 'completed'} />
    </div>
  );
}
