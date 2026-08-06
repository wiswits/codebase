import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import Button from "../common/Button";

const EMPTY_FORM = {
  title: "",
  description: "",
  eventType: "",
  startDatetime: "",
  endDatetime: "",
  location: "",
  capacity: "",
};

function toInputDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16);
}

export default function EventForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Save Event",
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!initialValues) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      title: initialValues.title || "",
      description:
        initialValues.description || "",
      eventType:
        initialValues.eventType || "",
      startDatetime: toInputDate(
        initialValues.startDatetime
      ),
      endDatetime: toInputDate(
        initialValues.endDatetime
      ),
      location:
        initialValues.location || "",
      capacity:
        initialValues.capacity ?? "",
    });
  }, [initialValues]);

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError("Event title is required.");
      return;
    }

    if (
      !form.startDatetime ||
      !form.endDatetime
    ) {
      setError(
        "Start and end date/time are required."
      );
      return;
    }

    const start = new Date(
      form.startDatetime
    );

    const end = new Date(
      form.endDatetime
    );

    if (end <= start) {
      setError(
        "End date/time must be after the start date/time."
      );
      return;
    }

    const payload = {
      title: form.title.trim(),

      description:
        form.description.trim() || null,

      eventType:
        form.eventType.trim() || null,

      startDatetime:
        start.toISOString(),

      endDatetime:
        end.toISOString(),

      location:
        form.location.trim() || null,

      capacity: form.capacity
        ? Number(form.capacity)
        : null,
    };

    await onSubmit?.(payload);
  }

  return (
    <form
      className="event-form panel"
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div className="form-grid">
        <label className="form-field form-field-wide">
          <span>Event title *</span>

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter event title"
            required
          />
        </label>

        <label className="form-field">
          <span>Event type</span>

          <input
            name="eventType"
            value={form.eventType}
            onChange={handleChange}
            placeholder="Academic, Sports, Workshop..."
          />
        </label>

        <label className="form-field">
          <span>Capacity</span>

          <input
            type="number"
            name="capacity"
            min="1"
            value={form.capacity}
            onChange={handleChange}
            placeholder="300"
          />
        </label>

        <label className="form-field">
          <span>Start date & time *</span>

          <input
            type="datetime-local"
            name="startDatetime"
            value={form.startDatetime}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field">
          <span>End date & time *</span>

          <input
            type="datetime-local"
            name="endDatetime"
            value={form.endDatetime}
            onChange={handleChange}
            required
          />
        </label>

        <label className="form-field form-field-wide">
          <span>Location</span>

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Main Auditorium"
          />
        </label>

        <label className="form-field form-field-wide">
          <span>Description</span>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="5"
            placeholder="Describe the event..."
          />
        </label>
      </div>

      <div className="form-actions">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          loading={loading}
          icon={Save}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}