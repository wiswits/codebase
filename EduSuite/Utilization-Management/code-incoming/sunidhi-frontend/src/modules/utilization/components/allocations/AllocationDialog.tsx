// src/modules/utilization/components/allocations/AllocationDialog.tsx
//
// Lightweight modal wrapper around AllocationForm, used when creating
// an allocation directly from an EmployeeProfile page instead of the
// full-page /utilization/allocations/new route.

"use client";

import { X } from "lucide-react";
import AllocationForm from "./AllocationForm";

interface AllocationDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AllocationDialog({ open, onClose }: AllocationDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <AllocationForm />
      </div>
    </div>
  );
}
