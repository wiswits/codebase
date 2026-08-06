import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  CalendarDays,
  Clock,
  Edit3,
  MapPin,
  Users,
} from "lucide-react";

import Loader from "../components/common/Loader";
import StatusBadge from "../components/common/StatusBadge";
import RsvpPanel from "../components/rsvp/RsvpPanel";
import RsvpSummary from "../components/rsvp/RsvpSummary";
import ResourceBooking from "../components/resources/ResourceBooking";

import { getEventById } from "../services/eventService";

import {
  formatDate,
  formatTime,
} from "../utils/formatters";

export default function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const response =
          await getEventById(id);

        setEvent(
          response?.data?.event || null
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  if (loading) {
    return <Loader label="Loading event..." />;
  }

  if (error) {
    return (
      <div className="error-banner">
        {error}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="error-banner">
        Event not found.
      </div>
    );
  }

  return (
    <div className="page-container">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            EVENT DETAILS
          </div>

          <h1>{event.title}</h1>

          <p>
            {event.description ||
              "No description provided."}
          </p>
        </div>

        <Link
          to={`/events/${id}/edit`}
          className="secondary-button"
        >
          <Edit3 size={17} />
          Edit Event
        </Link>
      </section>

      <section className="detail-grid">
        <article className="panel event-info-panel">
          <div className="detail-status">
            <StatusBadge
              status={event.status}
            />
          </div>

          <div className="detail-list">
            <div className="detail-item">
              <CalendarDays size={20} />

              <div>
                <span>Date</span>
                <strong>
                  {formatDate(
                    event.startDatetime
                  )}
                </strong>
              </div>
            </div>

            <div className="detail-item">
              <Clock size={20} />

              <div>
                <span>Time</span>
                <strong>
                  {formatTime(
                    event.startDatetime
                  )}{" "}
                  –{" "}
                  {formatTime(
                    event.endDatetime
                  )}
                </strong>
              </div>
            </div>

            <div className="detail-item">
              <MapPin size={20} />

              <div>
                <span>Location</span>
                <strong>
                  {event.location || "—"}
                </strong>
              </div>
            </div>

            <div className="detail-item">
              <Users size={20} />

              <div>
                <span>Capacity</span>
                <strong>
                  {event.capacity ?? "—"}
                </strong>
              </div>
            </div>
          </div>
        </article>

        <RsvpPanel eventId={id} />

        <RsvpSummary eventId={id} />

        <ResourceBooking
          eventId={id}
          event={event}
        />
      </section>
    </div>
  );
}