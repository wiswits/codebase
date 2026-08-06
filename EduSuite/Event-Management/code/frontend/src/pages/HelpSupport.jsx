import { Link } from "react-router-dom";

import {
  ArrowRight,
  Boxes,
  CalendarDays,
  CalendarCheck,
  CircleHelp,
  Mail,
} from "lucide-react";

export default function HelpSupport() {
  return (
    <div className="page-container help-page page-enter">
      <section className="page-heading">
        <div>
          <span className="page-kicker">
            SUPPORT
          </span>

          <h1>Help & Support</h1>

          <p>
            Find guidance for managing events,
            resources and bookings.
          </p>
        </div>
      </section>

      <section className="help-intro-card">
        <div className="help-intro-icon">
          <CircleHelp size={26} />
        </div>

        <div>
          <h2>How can we help?</h2>

          <p>
            Explore common Event Management
            actions and workspace guidance.
          </p>
        </div>
      </section>

      <section className="help-grid">
        <Link
          to="/events"
          className="help-card"
        >
          <div className="help-card-icon">
            <CalendarDays size={22} />
          </div>

          <div className="help-card-content">
            <h3>Event Management</h3>

            <p>
              Create, review and manage
              institutional events.
            </p>
          </div>

          <ArrowRight
            className="help-arrow"
            size={19}
          />
        </Link>

        <Link
          to="/resources"
          className="help-card"
        >
          <div className="help-card-icon">
            <Boxes size={22} />
          </div>

          <div className="help-card-content">
            <h3>
              Resource Management
            </h3>

            <p>
              Review available resources and
              event allocations.
            </p>
          </div>

          <ArrowRight
            className="help-arrow"
            size={19}
          />
        </Link>

        <Link
          to="/bookings"
          className="help-card"
        >
          <div className="help-card-icon">
            <CalendarCheck size={22} />
          </div>

          <div className="help-card-content">
            <h3>Bookings</h3>

            <p>
              Review reservations associated
              with institutional events.
            </p>
          </div>

          <ArrowRight
            className="help-arrow"
            size={19}
          />
        </Link>

        <article className="help-card help-card-static">
          <div className="help-card-icon">
            <Mail size={22} />
          </div>

          <div className="help-card-content">
            <h3>Technical Support</h3>

            <p>
              Contact your EduSuite
              administrator for account or
              infrastructure assistance.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}