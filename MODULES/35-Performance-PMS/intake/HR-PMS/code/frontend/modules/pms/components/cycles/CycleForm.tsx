"use client";

import { useState } from "react";
import { CYCLE_STATUS_LABELS } from "../../constants";
import type {
  APIError,
  AppraisalCycle,
  AppraisalCycleStatus,
  CreateAppraisalCyclePayload,
} from "../../types";
import { Button } from "../shared/Button";
import { SelectField, TextAreaField, TextField } from "../shared/FormField";

interface CycleFormProps {
  initial?: AppraisalCycle;
  submitting: boolean;
  serverError?: APIError;
  onSubmit: (payload: CreateAppraisalCyclePayload) => Promise<void>;
  onCancel: () => void;
}

export function CycleForm({ initial, submitting, serverError, onSubmit, onCancel }: CycleFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [status, setStatus] = useState<AppraisalCycleStatus>(initial?.status ?? "draft");
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const clientErrors: Record<string, string> = {};
  if (submittedOnce) {
    if (!name.trim()) clientErrors.name = "Cycle name is required.";
    if (!startDate) clientErrors.startDate = "Start date is required.";
    if (!endDate) clientErrors.endDate = "End date is required.";
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      clientErrors.endDate = "End date must be after the start date.";
    }
  }
  const fieldErrors = { ...clientErrors, ...(serverError?.fieldErrors ?? {}) };

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmittedOnce(true);
        if (!name.trim() || !startDate || !endDate) return;
        if (new Date(startDate) >= new Date(endDate)) return;
        await onSubmit({ name, description, startDate, endDate, status });
      }}
      className="flex flex-col gap-4"
      aria-label={initial ? "Edit appraisal cycle" : "Create appraisal cycle"}
    >
      <TextField
        label="Cycle name"
        required
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        placeholder="e.g. H1 2027 Performance Cycle"
      />
      <TextAreaField
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Optional summary of this cycle"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          type="date"
          label="Start date"
          required
          value={startDate}
          onChange={setStartDate}
          error={fieldErrors.startDate}
        />
        <TextField
          type="date"
          label="End date"
          required
          value={endDate}
          onChange={setEndDate}
          error={fieldErrors.endDate}
        />
      </div>
      <SelectField
        label="Status"
        value={status}
        onChange={(v) => setStatus(v as AppraisalCycleStatus)}
        options={Object.entries(CYCLE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
      />

      {serverError && !serverError.fieldErrors && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {serverError.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={submitting}>
          {initial ? "Save changes" : "Create cycle"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
