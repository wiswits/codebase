'use client';

import React, { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { WorkflowStatus } from '@/lib/types';
import { WORKFLOW_ORDER } from '@/lib/utils/constants';
import { statusLabel } from '@/lib/utils/formatters';

interface WorkflowStatusControlProps {
  currentStatus: WorkflowStatus | null;
  onUpdate: (status: WorkflowStatus) => Promise<void>;
}

export function WorkflowStatusControl({ currentStatus, onUpdate }: WorkflowStatusControlProps) {
  const [status, setStatus] = useState<WorkflowStatus>(currentStatus ?? 'DRAFT');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await onUpdate(status);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <Select
        label="Workflow status"
        value={status}
        onChange={(e) => setStatus(e.target.value as WorkflowStatus)}
        options={WORKFLOW_ORDER.map((s) => ({ label: statusLabel(s), value: s }))}
        className="w-56"
      />
      <Button
        variant="secondary"
        onClick={handleUpdate}
        isLoading={isSaving}
        disabled={status === currentStatus}
      >
        Update status
      </Button>
    </div>
  );
}
