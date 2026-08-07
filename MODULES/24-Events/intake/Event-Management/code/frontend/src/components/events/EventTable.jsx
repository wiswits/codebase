import {
  Eye,
  Pencil,
  CalendarDays,
} from "lucide-react";

import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";

export default function EventTable({
  events = [],
  onView,
  onEdit,
}) {
  if (!events.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No events found"
        description="There are no events matching your current selection."
      />
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Type</th>
            <th>Date</th>
            <th>Location</th>
            <th>Capacity</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <div className="table-primary">
                  <strong>
                    {event.title}
                  </strong>

                  <span>
                    Event #{event.id}
                  </span>
                </div>
              </td>

              <td>
                {event.eventType || "—"}
              </td>

              <td>
                {event.startDatetime
                  ? new Date(
                      event.startDatetime
                    ).toLocaleDateString(
                      "en-IN"
                    )
                  : "—"}
              </td>

              <td>
                {event.location || "—"}
              </td>

              <td>
                {event.capacity ?? "—"}
              </td>

              <td>
                <StatusBadge
                  status={event.status}
                />
              </td>

              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      onView?.(event)
                    }
                    title="View event"
                  >
                    <Eye size={17} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      onEdit?.(event)
                    }
                    title="Edit event"
                  >
                    <Pencil size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}