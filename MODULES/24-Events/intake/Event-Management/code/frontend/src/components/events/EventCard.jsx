import {
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react";

import StatusBadge from "../common/StatusBadge";

export default function EventCard({
  event,
  onClick,
}) {
  if (!event) return null;

  const start = event.startDatetime
    ? new Date(event.startDatetime)
    : null;

  const end = event.endDatetime
    ? new Date(event.endDatetime)
    : null;

  return (
    <article
      className="event-card"
      onClick={() => onClick?.(event)}
    >
      <div className="event-card-header">
        <div className="event-card-icon">
          <CalendarDays size={21} />
        </div>

        <StatusBadge status={event.status} />
      </div>

      <div className="event-card-content">
        <span className="event-type">
          {event.eventType || "Event"}
        </span>

        <h3>{event.title}</h3>

        <p className="event-description">
          {event.description ||
            "No description provided."}
        </p>

        <div className="event-meta">
          <div>
            <CalendarDays size={15} />

            <span>
              {start
                ? start.toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "No date"}
            </span>
          </div>

          <div>
            <Clock3 size={15} />

            <span>
              {start
                ? start.toLocaleTimeString(
                    "en-IN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "No time"}

              {end &&
                ` – ${end.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}`}
            </span>
          </div>

          <div>
            <MapPin size={15} />

            <span>
              {event.location ||
                "Location not specified"}
            </span>
          </div>

          <div>
            <Users size={15} />

            <span>
              {event.capacity
                ? `${event.capacity} capacity`
                : "No capacity limit"}
            </span>
          </div>
        </div>
      </div>

      <div className="event-card-footer">
        <span>View event</span>
        <ArrowRight size={16} />
      </div>
    </article>
  );
}