import { WorkflowStatus } from '@/lib/types';

export const STATUS_STYLES: Record<WorkflowStatus, string> = {
  DRAFT: 'bg-slate-400 text-white border-transparent',
  IN_PROGRESS: 'bg-amber-500 text-white border-transparent',
  READY_FOR_REVIEW: 'bg-blue-500 text-white border-transparent',
  FINALIZED: 'bg-emerald-500 text-white border-transparent',
};

export const WORKFLOW_ORDER: WorkflowStatus[] = [
  'DRAFT',
  'IN_PROGRESS',
  'READY_FOR_REVIEW',
  'FINALIZED',
];
