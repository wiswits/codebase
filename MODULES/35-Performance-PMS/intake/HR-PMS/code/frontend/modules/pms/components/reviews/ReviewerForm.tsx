"use client";

import { useState } from "react";
import type { APIError, AppraisalReview, AppraisalReviewStatus } from "../../types";
import { Button } from "../shared/Button";
import { SelectField, TextAreaField } from "../shared/FormField";

interface ReviewerFormProps {
  employeeName: string;
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
  onCancel?: () => void;
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
 * Dedicated Reviewer Form component. Always represents review_type =
 * "reviewer" and is visually/semantically distinct from SelfReviewForm —
 * this UI is only ever used to review someone else, never oneself.
 */
export function ReviewerForm({
  employeeName,
  existingReview,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: ReviewerFormProps) {
  const isLocked = existingReview?.status === "submitted";
  const [comments, setComments] = useState(existingReview?.comments ?? "");
  const [strengths, setStrengths] = useState(existingReview?.strengths ?? "");
  const [improvementAreas, setImprovementAreas] = useState(existingReview?.improvementAreas ?? "");
  const [rating, setRating] = useState(existingReview?.rating?.toString() ?? "");
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const clientErrors: Record<string, string> = {};
  if (submittedOnce && !comments.trim()) {
    clientErrors.comments = "Please add review comments before submitting.";
  }
  const fieldErrors = { ...clientErrors, ...(serverError?.fieldErrors ?? {}) };

  return (
    <div className="rounded-lg border-l-4 border-l-[#B4762A] bg-[#FFFBF3] p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#7A4E1D]">
        <span aria-hidden="true">📋</span>
        Reviewing {employeeName}
      </div>

      {isLocked && (
        <p className="mb-4 text-sm text-slate-500">
          This review was submitted on{" "}
          {existingReview?.submittedAt && new Date(existingReview.submittedAt).toLocaleDateString()} and
          can no longer be edited.
        </p>
      )}

      <form
        noValidate
        aria-label={`Reviewer form for ${employeeName}`}
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
          label="Reviewer rating"
          value={rating}
          onChange={setRating}
          options={RATING_OPTIONS}
          selectProps={{ disabled: isLocked }}
        />
        <TextAreaField
          label="Overall assessment"
          required
          value={comments}
          onChange={setComments}
          error={fieldErrors.comments}
          rows={5}
          placeholder={`Summarize ${employeeName}'s performance this cycle.`}
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

        <div className="flex flex-wrap gap-3">
          {!isLocked && (
            <>
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
                Submit review
              </Button>
            </>
          )}
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
              Close
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
