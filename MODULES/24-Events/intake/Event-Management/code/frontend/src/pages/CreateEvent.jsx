import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  Save,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

import { createEvent } from "../services/eventService";

const initialForm = {
  title: "",
  type: "",
  capacity: "",
  startDate: "",
  endDate: "",
  location: "",
  description: "",
};

export default function CreateEvent() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function validateForm() {
    if (!form.title.trim()) {
      return "Please enter an event title.";
    }

    if (!form.type) {
      return "Please select an event type.";
    }

    if (!form.startDate) {
      return "Please select the event start date and time.";
    }

    if (!form.endDate) {
      return "Please select the event end date and time.";
    }

    if (
      new Date(form.endDate).getTime() <=
      new Date(form.startDate).getTime()
    ) {
      return "End date must be later than the start date.";
    }

    if (!form.location.trim()) {
      return "Please enter the event location.";
    }

    if (
      form.capacity &&
      Number(form.capacity) <= 0
    ) {
      return "Capacity must be greater than zero.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * Keep these property names aligned with your backend.
       * If your backend DTO uses different field names,
       * we will map them here rather than changing the UI.
       */
      const payload = {
        title: form.title.trim(),
        type: form.type,
        capacity: form.capacity
          ? Number(form.capacity)
          : null,
        startDate: form.startDate,
        endDate: form.endDate,
        location: form.location.trim(),
        description: form.description.trim(),
      };

      await createEvent(payload);

      setSuccess(true);

      setTimeout(() => {
        navigate("/events");
      }, 900);
    } catch (err) {
      console.error(
        "Create event failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to create the event. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container create-event-page">
      {/* PAGE HEADER */}

      <section className="create-page-header">
        <div>
          <button
            type="button"
            className="back-link"
            onClick={() => navigate("/events")}
          >
            <ArrowLeft size={16} />
            Events
          </button>

          <span className="page-kicker">
            EVENT MANAGEMENT
          </span>

          <h1>Create Event</h1>

          <p>
            Create and configure a new institutional
            event for your WisWits workspace.
          </p>
        </div>

        <div className="create-header-badge">
          <Sparkles size={17} />

          <span>New Event</span>
        </div>
      </section>

      {/* SUCCESS */}

      {success && (
        <div className="create-success-banner">
          <div className="success-check">
            ✓
          </div>

          <div>
            <strong>
              Event created successfully
            </strong>

            <span>
              Redirecting to your event workspace...
            </span>
          </div>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="error-banner">
          <strong>
            We couldn't save this event.
          </strong>

          <span>{error}</span>
        </div>
      )}

      <form
        className="create-event-layout"
        onSubmit={handleSubmit}
      >
        {/* MAIN FORM */}

        <section className="panel create-event-form-card">
          <div className="create-card-header">
            <div className="create-card-icon">
              <CalendarDays size={22} />
            </div>

            <div>
              <h2>Event information</h2>

              <p>
                Enter the core information attendees
                will see for this event.
              </p>
            </div>
          </div>

          <div className="create-form-body">
            {/* TITLE */}

            <div className="form-field form-field-full">
              <label htmlFor="title">
                Event title
                <span>*</span>
              </label>

              <div className="input-shell">
                <FileText size={18} />

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Annual Science Exhibition"
                  autoComplete="off"
                />
              </div>

              <small>
                Use a clear and recognizable event name.
              </small>
            </div>

            {/* EVENT TYPE */}

            <div className="form-field">
              <label htmlFor="type">
                Event type
                <span>*</span>
              </label>

              <div className="input-shell">
                <Tag size={18} />

                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="">
                    Select event type
                  </option>

                  <option value="academic">
                    Academic
                  </option>

                  <option value="sports">
                    Sports
                  </option>

                  <option value="workshop">
                    Workshop
                  </option>

                  <option value="cultural">
                    Cultural
                  </option>

                  <option value="seminar">
                    Seminar
                  </option>

                  <option value="conference">
                    Conference
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>
            </div>

            {/* CAPACITY */}

            <div className="form-field">
              <label htmlFor="capacity">
                Capacity
              </label>

              <div className="input-shell">
                <Users size={18} />

                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="300"
                />
              </div>
            </div>

            {/* START */}

            <div className="form-field">
              <label htmlFor="startDate">
                Start date & time
                <span>*</span>
              </label>

              <div className="input-shell">
                <Clock3 size={18} />

                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* END */}

            <div className="form-field">
              <label htmlFor="endDate">
                End date & time
                <span>*</span>
              </label>

              <div className="input-shell">
                <Clock3 size={18} />

                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* LOCATION */}

            <div className="form-field form-field-full">
              <label htmlFor="location">
                Location
                <span>*</span>
              </label>

              <div className="input-shell">
                <MapPin size={18} />

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Main Auditorium"
                />
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="form-field form-field-full">
              <label htmlFor="description">
                Description
              </label>

              <div className="textarea-shell">
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  maxLength={1000}
                  placeholder="Describe the event, its purpose and any important information for attendees..."
                />
              </div>

              <div className="field-footer">
                <small>
                  Optional event information
                </small>

                <small>
                  {form.description.length}/1000
                </small>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="create-form-footer">
            <button
              type="button"
              className="secondary-button create-cancel-button"
              onClick={() =>
                navigate("/events")
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button create-save-button"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Creating event...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Event
                </>
              )}
            </button>
          </div>
        </section>

        {/* SIDE PREVIEW */}

        <aside className="create-event-sidebar">
          <div className="panel create-preview-card">
            <span className="section-kicker">
              PREVIEW
            </span>

            <h3>
              {form.title ||
                "Your event title"}
            </h3>

            <p>
              {form.description ||
                "Your event description will appear here as you complete the form."}
            </p>

            <div className="preview-divider" />

            <div className="preview-meta">
              <div>
                <CalendarDays size={17} />

                <span>
                  {form.startDate
                    ? new Date(
                        form.startDate
                      ).toLocaleString()
                    : "Date not selected"}
                </span>
              </div>

              <div>
                <MapPin size={17} />

                <span>
                  {form.location ||
                    "Location not selected"}
                </span>
              </div>

              <div>
                <Users size={17} />

                <span>
                  {form.capacity
                    ? `${form.capacity} attendees`
                    : "Capacity not set"}
                </span>
              </div>
            </div>
          </div>

          <div className="create-tip-card">
            <Sparkles size={18} />

            <div>
              <strong>
                Event setup tip
              </strong>

              <p>
                Review dates, capacity and location
                before publishing the event.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}