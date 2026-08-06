'use client';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface FinalizeActionProps {
  onFinalize: () => Promise<void>;
  disabled?: boolean;
}

export function FinalizeAction({ onFinalize, disabled }: FinalizeActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onFinalize();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} disabled={disabled} variant="secondary">
        <CheckCircle2 className="h-4 w-4" />
        Finalize report card
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Finalize this HPC report card?"
        message="This creates a permanent, immutable snapshot. All competencies must already be complete, and this cannot be undone."
        confirmLabel="Finalize"
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
