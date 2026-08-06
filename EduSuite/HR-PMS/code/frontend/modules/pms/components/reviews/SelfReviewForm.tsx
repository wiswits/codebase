"use client";

import { useState } from "react";
import type { APIError, AppraisalReview, AppraisalReviewStatus } from "../../types";
import { Button } from "../shared/Button";
import { SelectField, TextAreaField } from "../shared/FormField";

interface SelfReviewFormProps {
  cycleId: string;
  goalId?: string;
  existingReview?: AppraisalReview;
  submitting: boolean;
  serverError?: APIError;
  onSubmit: (values: {
    comments: string;
    strengths: string;
    improvementAreas: string;
    rating: number | undefined;
    status: AppraisalReviewStatus;
  }) => Promise<void>;
}

const RATING_OPTIONS = [
  { value: "", label: "No rating yet" },
  { value: "1", label: "1 — Needs improvement" },
  { value: "2", label: "2 — Developing" },
  { value: "3", label: "3 — Meets expectations" },
  { value: "4", label: "4 — Exceeds expectations" },
  { value: "5", label: "5 — Outstanding" },
];

/**
 * Dedicated Self Review component. Always represents review_type = "self"
 * and is visually/semantically distinct from ReviewerForm — this UI must
 * never be reused to submit on someone else's behalf.
 */
export function SelfReviewForm({
  existingReview,
  submitting,
  serverError,
  onSubmit,
}: SelfReviewFormProps) {
  const isLocked = existingReview?.status === "submitted";
  const [comments, setComments] = useState(existingReview?.comments ?? "");
  const [strengths, setStrengths] = useState(existingReview?.strengths ?? "");
  const [improvementAreas, setImprovementAreas] = useState(existingReview?.improvementAreas ?? "");
  const [rating, setRating] = useState(existingReview?.rating?.toString() ?? "");
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const clientErrors: Record<string, string> = {};
  if (submittedOnce && !comments.trim()) {
    clientErrors.comments = "Please add your self-review comments before submitting.";
  }
  const fieldErrors = { ...clientErrors, ...(serverError?.fieldErrors ?? {}) };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-md bg-[#EEF3F8] px-3 py-2 text-sm font-medium text-[#1F3A5F]">
        <span aria-hidden="true">🧑</span>
        You are completing your own self review
      </div>

      {isLocked && (
        <p className="mb-4 text-sm text-slate-500">
          This self review was submitted on{" "}
          {existingReview?.submittedAt && new Date(existingReview.submittedAt).toLocaleDateString()} and
          can no longer be edited.
        </p>
      )}

      <form
        noValidate
        aria-label="Self review form"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmittedOnce(true);
          await onSubmit({
            comments,
            strengths,
            improvementAreas,
            rating: rating ? Number(rating) : undefined,
            status: "submitted",
          });
        }}
        className="flex flex-col gap-4"
      >
        <SelectField
          label="Self rating"
          value={rating}
          onChange={setRating}
          options={RATING_OPTIONS}
          hint="Optional. The final rating shown in the summary is supplied by the backend, not calculated here."
          selectProps={{ disabled: isLocked }}
        />
        <TextAreaField
          label="Overall comments"
          required
          value={comments}
          onChange={setComments}
          error={fieldErrors.comments}
          rows={5}
          placeholder="Summarize what you accomplished this cycle."
          textareaProps={{ disabled: isLocked }}
        />
        <TextAreaField
          label="Strengths"
          value={strengths}
          onChange={setStrengths}
          rows={3}
          textareaProps={{ disabled: isLocked }}
        />
        <TextAreaField
          label="Areas for improvement"
          value={improvementAreas}
          onChange={setImprovementAreas}
          rows={3}
          textareaProps={{ disabled: isLocked }}
        />

        {serverError && !serverError.fieldErrors && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {serverError.message}
          </p>
        )}

        {!isLocked && (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={async () => {
                await onSubmit({
                  comments,
                  strengths,
                  improvementAreas,
                  rating: rating ? Number(rating) : undefined,
                  status: "draft",
                });
              }}
            >
              Save draft
            </Button>
            <Button type="submit" loading={submitting}>
              Submit self review
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
