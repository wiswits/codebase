import {
  Boxes,
  CalendarDays,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function Bookings() {
  return (
    <div className="page-container">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            RESOURCE MANAGEMENT
          </div>

          <h1>Bookings</h1>

          <p>
            Manage resource reservations associated
            with institutional events.
          </p>
        </div>
      </section>

      <section className="panel bookings-intro">
        <div className="preview-icon">
          <Boxes size={28} />
        </div>

        <h2>Event Resource Bookings</h2>

        <p>
          Resource bookings are managed against
          individual events. Open an event to assign
          or remove resources.
        </p>

        <Link
          to="/events"
          className="primary-button"
        >
          <CalendarDays size={18} />
          Browse Events
        </Link>
      </section>
    </div>
  );
}