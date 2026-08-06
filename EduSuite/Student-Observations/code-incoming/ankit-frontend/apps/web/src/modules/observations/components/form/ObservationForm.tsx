"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  OBSERVATION_CONTENT_MAX_LENGTH,
  OBSERVATION_CONTENT_MIN_LENGTH,
} from "../../constants/observation.constants";

import {
  createObservation,
  getStudents,
  updateObservation,
} from "../../services/observationsApi";

import type {
  Observation,
  ObservationFormValues,
  Student,
} from "../../types/observation.types";

import ObservationTypeSelector from "./ObservationTypeSelector";
import StudentSelector from "./StudentSelector";

interface ObservationFormProps {
  mode: "create" | "edit";
  observation?: Observation;
}

interface FormErrors {
  studentId?: string;
  observationType?: string;
  content?: string;
}

export default function ObservationForm({
  mode,
  observation,
}: ObservationFormProps) {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [values, setValues] = useState<ObservationFormValues>({
    studentId: observation?.studentId ?? null,
    observationType: observation?.observationType ?? "",
    content: observation?.content ?? "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        setStudentsLoading(true);
        setLoadError(null);

        const response = await getStudents();
        setStudents(response.data);
      } catch (err) {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Unable to load students."
        );
      } finally {
        setStudentsLoading(false);
      }
    }

    void loadStudents();
  }, []);

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!values.studentId) {
      nextErrors.studentId = "Please select a student.";
    }

    if (!values.observationType) {
      nextErrors.observationType =
        "Please select an observation type.";
    }

    const trimmedContent = values.content.trim();

    if (!trimmedContent) {
      nextErrors.content = "Observation content is required.";
    } else if (
      trimmedContent.length < OBSERVATION_CONTENT_MIN_LENGTH
    ) {
      nextErrors.content = `Please enter at least ${OBSERVATION_CONTENT_MIN_LENGTH} characters.`;
    } else if (
      trimmedContent.length > OBSERVATION_CONTENT_MAX_LENGTH
    ) {
      nextErrors.content = `Observation cannot exceed ${OBSERVATION_CONTENT_MAX_LENGTH} characters.`;
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFeedback(null);

    if (!validate()) return;

    if (
      !values.studentId ||
      !values.observationType
    ) {
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "create") {
        const response = await createObservation({
          studentId: values.studentId,
          observationType: values.observationType,
          content: values.content,
        });

        setFeedback(response.message ?? "Observation created.");

        setTimeout(() => {
          router.push(`/observations/${response.data.id}`);
        }, 500);
      } else {
        if (!observation) {
          throw new Error("Observation information is unavailable.");
        }

        const response = await updateObservation(
          observation.id,
          {
            observationType: values.observationType,
            content: values.content,
          }
        );

        setFeedback(response.message ?? "Observation updated.");

        setTimeout(() => {
          router.push(`/observations/${response.data.id}`);
        }, 500);
      }
    } catch (err) {
      setFeedback(
        err instanceof Error
          ? err.message
          : "Unable to save observation."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-[#0F2147]">
          {mode === "create"
            ? "Create Student Observation"
            : "Edit Student Observation"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {mode === "create"
            ? "Record a new observation for a student."
            : "Update the permitted observation information."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-7 p-6"
      >
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {feedback && (
          <div className="rounded-lg border border-[#C8A04E]/40 bg-[#C8A04E]/10 p-4 text-sm font-medium text-[#0F2147]">
            {feedback}
          </div>
        )}

        <StudentSelector
          students={students}
          value={values.studentId}
          disabled={studentsLoading || mode === "edit"}
          error={errors.studentId}
          onChange={(studentId) =>
            setValues((current) => ({
              ...current,
              studentId,
            }))
          }
        />

        <ObservationTypeSelector
          value={values.observationType}
          error={errors.observationType}
          onChange={(observationType) =>
            setValues((current) => ({
              ...current,
              observationType,
            }))
          }
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="content"
              className="text-sm font-semibold text-[#0F2147]"
            >
              Observation <span className="text-red-600">*</span>
            </label>

            <span className="text-xs text-slate-400">
              {values.content.length}/
              {OBSERVATION_CONTENT_MAX_LENGTH}
            </span>
          </div>

          <textarea
            id="content"
            rows={8}
            maxLength={OBSERVATION_CONTENT_MAX_LENGTH}
            value={values.content}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            placeholder="Enter the student observation..."
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-[#0F2147] outline-none transition placeholder:text-slate-400 focus:border-[#C8A04E] focus:ring-2 focus:ring-[#C8A04E]/20"
          />

          {errors.content && (
            <p className="text-sm text-red-600">
              {errors.content}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#0F2147] transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || studentsLoading}
            className="rounded-lg bg-[#0F2147] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : mode === "create"
                ? "Create Observation"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}