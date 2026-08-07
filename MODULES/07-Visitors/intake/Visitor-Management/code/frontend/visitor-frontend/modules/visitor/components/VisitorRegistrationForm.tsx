"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  VisitorService,
  type CheckInVisitorInput,
} from "@/services/visitor.service";

interface FormState {
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string;
  visitorType: string;
  purpose: string;
  hostId: string;
  hostName: string;
}

const initialForm: FormState = {
  visitorName: "",
  visitorPhone: "",
  visitorEmail: "",
  visitorType: "guest",
  purpose: "",
  hostId: "",
  hostName: "",
};

export default function VisitorRegistrationForm() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function handleChange(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError(null);

    const visitorName =
      form.visitorName.trim();

    const purpose =
      form.purpose.trim();

    const hostId =
      Number(form.hostId);

    if (!visitorName) {
      setError("Visitor name is required.");
      return;
    }

    if (!purpose) {
      setError(
        "Purpose of visit is required."
      );
      return;
    }

    if (
      !Number.isInteger(hostId) ||
      hostId <= 0
    ) {
      setError(
        "Please enter a valid host ID."
      );
      return;
    }

    const input: CheckInVisitorInput = {
      visitorName,
      purpose,
      hostId,
    };

    const visitorPhone =
      form.visitorPhone.trim();

    const visitorEmail =
      form.visitorEmail.trim();

    const visitorType =
      form.visitorType.trim();

    const hostName =
      form.hostName.trim();

    if (visitorPhone) {
      input.visitorPhone = visitorPhone;
    }

    if (visitorEmail) {
      input.visitorEmail = visitorEmail;
    }

    if (visitorType) {
      input.visitorType = visitorType;
    }

    if (hostName) {
      input.hostName = hostName;
    }

    setSubmitting(true);

    try {
      const response =
        await VisitorService.checkIn(input);

      const visitor = response.data;

      router.push(
        `/visitors/${visitor.id}`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check in visitor."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(initialForm);
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="registration-form"
    >
      {/* Visitor Information */}

      <section className="registration-section">
        <SectionHeader
          number="01"
          eyebrow="IDENTITY"
          title="Visitor Information"
          description="Enter the visitor's personal and contact information."
        />

        <div className="registration-grid registration-grid-four">
          <Field
            label="Visitor Name"
            hint="Required"
            required
          >
            <input
              type="text"
              name="visitorName"
              value={form.visitorName}
              onChange={handleChange}
              placeholder="Enter visitor name"
              disabled={submitting}
              autoComplete="name"
              required
            />
          </Field>

          <Field label="Phone Number">
            <input
              type="tel"
              name="visitorPhone"
              value={form.visitorPhone}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={submitting}
              autoComplete="tel"
            />
          </Field>

          <Field label="Email Address">
            <input
              type="email"
              name="visitorEmail"
              value={form.visitorEmail}
              onChange={handleChange}
              placeholder="name@example.com"
              disabled={submitting}
              autoComplete="email"
            />
          </Field>

          <Field label="Visitor Type">
            <select
              name="visitorType"
              value={form.visitorType}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="guest">
                Guest
              </option>

              <option value="parent">
                Parent
              </option>

              <option value="vendor">
                Vendor
              </option>

              <option value="contractor">
                Contractor
              </option>

              <option value="interview">
                Interview
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </Field>
        </div>
      </section>

      {/* Visit Information */}

      <section className="registration-section">
        <SectionHeader
          number="02"
          eyebrow="VISIT DETAILS"
          title="Host & Visit Information"
          description="Assign the appropriate host and record the purpose of this visit."
        />

        <div className="registration-grid registration-grid-two">
          <Field
            label="Host ID"
            hint="Required"
            required
          >
            <input
              type="number"
              name="hostId"
              value={form.hostId}
              onChange={handleChange}
              placeholder="Enter host ID"
              disabled={submitting}
              min="1"
              step="1"
              required
            />
          </Field>

          <Field label="Host Name">
            <input
              type="text"
              name="hostName"
              value={form.hostName}
              onChange={handleChange}
              placeholder="Enter host name"
              disabled={submitting}
            />
          </Field>
        </div>

        <div className="registration-purpose">
          <Field
            label="Purpose of Visit"
            hint="Required"
            required
          >
            <textarea
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              placeholder="Briefly describe the purpose of the visit..."
              disabled={submitting}
              rows={4}
              required
            />
          </Field>

          <div className="registration-purpose-meta">
            <span>
              Provide a clear reason for the
              visitor record.
            </span>

            <span>
              {form.purpose.length} characters
            </span>
          </div>
        </div>
      </section>

      {/* Error */}

      {error && (
        <div
          className="registration-error"
          role="alert"
        >
          <span className="registration-error-icon">
            !
          </span>

          <div>
            <strong>
              Unable to check in visitor
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Actions */}

      <footer className="registration-actions">
        <div className="registration-action-info">
          <span className="registration-ready-dot" />

          <div>
            <strong>
              Ready for registration
            </strong>

            <span>
              Required fields are marked with *
            </span>
          </div>
        </div>

        <div className="registration-action-buttons">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="registration-clear-btn"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="registration-submit-btn"
          >
            {submitting ? (
              <>
                <span className="registration-spinner" />
                Checking In...
              </>
            ) : (
              <>
                Check In Visitor
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </form>
  );
}

function SectionHeader({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="registration-section-header">
      <span className="registration-section-number">
        {number}
      </span>

      <div>
        <span className="registration-section-eyebrow">
          {eyebrow}
        </span>

        <h3>{title}</h3>

        <p>{description}</p>
      </div>
    </header>
  );
}

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="registration-field">
      <span className="registration-field-heading">
        <span>
          {label}

          {required && (
            <span className="registration-required">
              {" "}*
            </span>
          )}
        </span>

        {hint && (
          <span className="registration-field-hint">
            {hint}
          </span>
        )}
      </span>

      {children}
    </label>
  );
}