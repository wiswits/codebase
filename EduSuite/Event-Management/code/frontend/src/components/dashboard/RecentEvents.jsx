import { useNavigate } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";

import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loader from "../common/Loader";

export default function RecentEvents({
  events = [],
  loading = false,
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="panel">
        <Loader text="Loading recent events..." />
      </div>
    );
  }

  return (
    <article className="panel recent-events-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">
            EVENTS
          </span>

          <h2>Recent Events</h2>

          <p>
            Latest activities from your event workspace.
          </p>
        </div>

        <button
          type="button"
          className="text-link"
          onClick={() => navigate("/events")}
        >
          View all
          <ArrowRight size={16} />
        </button>
      </div>

      {!events.length ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event to start managing activities."
          actionLabel="Create Event"
          onAction={() =>
            navigate("/events/create")
          }
        />
      ) : (
        <div className="recent-events-list">
          {events.slice(0, 5).map((event) => (
            <button
              type="button"
              key={event.id}
              className="recent-event-item"
              onClick={() =>
                navigate(`/events/${event.id}`)
              }
            >
              <div className="recent-event-icon">
                <CalendarDays size={18} />
              </div>

              <div className="recent-event-info">
                <strong>{event.title}</strong>

                <span>
                  {event.startDatetime
                    ? new Date(
                        event.startDatetime
                      ).toLocaleString("en-IN")
                    : "Date not available"}
                </span>
              </div>

              <StatusBadge
                status={event.status}
                showIcon={false}
              />

              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}