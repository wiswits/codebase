import { useState } from "react";
import { CalendarCheck } from "lucide-react";

import Button from "../common/Button";

export default function ResourceBooking({
  eventId,
  resource,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!eventId) {
      setError(
        "An event must be selected before booking a resource."
      );
      return;
    }

    if (!resource?.id) {
      setError(
        "A resource must be selected."
      );
      return;
    }

    if (!startTime || !endTime) {
      setError(
        "Start and end times are required."
      );
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError(
        "End time must be after start time."
      );
      return;
    }

    await onSubmit?.({
      eventId: Number(eventId),

      resourceId: Number(
        resource.id
      ),

      startTime:
        start.toISOString(),

      endTime:
        end.toISOString(),
    });
  }

  return (
    <form
      className="resource-booking-form"
      onSubmit={handleSubmit}
    >
      <div className="booking-resource">
        <div className="resource-icon">
          <CalendarCheck size={21} />
        </div>

        <div>
          <span>
            Booking resource
          </span>

          <strong>
            {resource?.name ||
              resource?.title ||
              "Selected resource"}
          </strong>
        </div>
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <label className="form-field">
        <span>Start time *</span>

        <input
          type="datetime-local"
          value={startTime}
          onChange={(event) =>
            setStartTime(
              event.target.value
            )
          }
          required
        />
      </label>

      <label className="form-field">
        <span>End time *</span>

        <input
          type="datetime-local"
          value={endTime}
          onChange={(event) =>
            setEndTime(
              event.target.value
            )
          }
          required
        />
      </label>

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
          icon={CalendarCheck}
        >
          Confirm Booking
        </Button>
      </div>
    </form>
  );
}