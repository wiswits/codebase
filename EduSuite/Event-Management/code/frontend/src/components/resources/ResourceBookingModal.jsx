import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  bookResource,
  getEvents,
} from "../../services/eventService";

export default function ResourceBookingModal({
  resource,
  onClose,
  onSuccess,
}) {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        setError("");

        const response = await getEvents();

        const eventData =
          Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.events)
                ? response.events
                : Array.isArray(response?.data?.events)
                  ? response.data.events
                  : [];

        setEvents(eventData);
      } catch (err) {
        console.error("Unable to load events:", err);

        setError(
          err?.message ||
            "Unable to load events."
        );
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, []);

  function getResourceId() {
    return (
      resource?.id ??
      resource?.resourceId ??
      null
    );
  }

  function convertToISO(value) {
    if (!value) {
      return null;
    }

    return new Date(value).toISOString();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const resourceId = getResourceId();

    if (!resourceId) {
      setError(
        "Resource ID is unavailable."
      );
      return;
    }

    if (!eventId) {
      setError("Please select an event.");
      return;
    }

    if (!startTime || !endTime) {
      setError(
        "Please select start and end time."
      );
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    try {
      setSubmitting(true);

      await bookResource(eventId, {
        resourceId: Number(resourceId),
        startTime: convertToISO(startTime),
        endTime: convertToISO(endTime),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(
        "Resource booking failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to book this resource."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const resourceName =
    resource?.name ??
    resource?.title ??
    "Resource";

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <div className="booking-modal">
        <div className="booking-modal-header">
          <div>
            <span className="section-kicker">
              RESOURCE BOOKING
            </span>

            <h2>Book {resourceName}</h2>

            <p>
              Assign this resource to an
              institutional event.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close booking modal"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="booking-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="error-banner">
              <strong>
                Booking could not be completed
              </strong>
              <span>{error}</span>
            </div>
          )}

          <div className="booking-field">
            <label htmlFor="booking-event">
              <CalendarDays size={16} />
              Event
            </label>

            <select
              id="booking-event"
              value={eventId}
              onChange={(event) =>
                setEventId(event.target.value)
              }
              disabled={
                loadingEvents || submitting
              }
              required
            >
              <option value="">
                {loadingEvents
                  ? "Loading events..."
                  : "Select an event"}
              </option>

              {events.map((item) => {
                const id =
                  item?.id ??
                  item?.eventId;

                const title =
                  item?.title ??
                  item?.name ??
                  `Event #${id}`;

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {title}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="booking-time-grid">
            <div className="booking-field">
              <label htmlFor="booking-start">
                <Clock3 size={16} />
                Start time
              </label>

              <input
                id="booking-start"
                type="datetime-local"
                value={startTime}
                onChange={(event) =>
                  setStartTime(
                    event.target.value
                  )
                }
                disabled={submitting}
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="booking-end">
                <Clock3 size={16} />
                End time
              </label>

              <input
                id="booking-end"
                type="datetime-local"
                value={endTime}
                onChange={(event) =>
                  setEndTime(
                    event.target.value
                  )
                }
                min={startTime || undefined}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="booking-resource-summary">
            <span>Selected resource</span>

            <strong>{resourceName}</strong>
          </div>

          <div className="booking-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                submitting ||
                loadingEvents
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="spin-icon"
                  />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}