"use client";

import { useState } from "react";
import { GOAL_STATUS_LABELS } from "../../constants";
import type {
  APIError,
  AppraisalCycle,
  AppraisalGoal,
  AppraisalGoalStatus,
  CreateAppraisalGoalPayload,
} from "../../types";
import { Button } from "../shared/Button";
import { SelectField, TextAreaField, TextField } from "../shared/FormField";

interface GoalFormProps {
  cycles: AppraisalCycle[];
  initial?: AppraisalGoal;
  defaultCycleId?: string;
  submitting: boolean;
  serverError?: APIError;
  onSubmit: (payload: CreateAppraisalGoalPayload) => Promise<void>;
  onCancel: () => void;
}

export function GoalForm({
  cycles,
  initial,
  defaultCycleId,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [cycleId, setCycleId] = useState(initial?.cycleId ?? defaultCycleId ?? cycles[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "");
  const [status, setStatus] = useState<AppraisalGoalStatus>(initial?.status ?? "not_started");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const clientErrors: Record<string, string> = {};
  if (submittedOnce) {
    if (!title.trim()) clientErrors.title = "Goal title is required.";
    if (!cycleId) clientErrors.cycleId = "Select an appraisal cycle.";
    const weightNum = weight === "" ? undefined : Number(weight);
    if (weightNum !== undefined && (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100)) {
      clientErrors.weight = "Weight must be between 0 and 100.";
    }
  }
  const fieldErrors = { ...clientErrors, ...(serverError?.fieldErrors ?? {}) };

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmittedOnce(true);
        const weightNum = weight === "" ? undefined : Number(weight);
        if (!title.trim() || !cycleId) return;
        if (weightNum !== undefined && (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100)) return;
        await onSubmit({
          cycleId,
          title,
          description,
          weight: weightNum,
          status,
          dueDate: dueDate || undefined,
        });
      }}
      className="flex flex-col gap-4"
      aria-label={initial ? "Edit goal" : "Create goal"}
    >
      <SelectField
        label="Appraisal cycle"
        required
        value={cycleId}
        onChange={setCycleId}
        error={fieldErrors.cycleId}
        options={cycles.map((c) => ({ value: c.id, label: c.name }))}
      />
      <TextField
        label="Goal title"
        required
        value={title}
        onChange={setTitle}
        error={fieldErrors.title}
        placeholder="e.g. Ship the Q3 onboarding revamp"
      />
      <TextAreaField
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="What does success look like for this goal?"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          type="number"
          label="Weight (%)"
          value={weight}
          onChange={setWeight}
          error={fieldErrors.weight}
          min={0}
          max={100}
          hint="Optional — for reference only, not used to compute a score."
        />
        <SelectField
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as AppraisalGoalStatus)}
          options={Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <TextField type="date" label="Due date" value={dueDate} onChange={setDueDate} />
      </div>

      {serverError && !serverError.fieldErrors && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {serverError.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={submitting}>
          {initial ? "Save changes" : "Add goal"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
