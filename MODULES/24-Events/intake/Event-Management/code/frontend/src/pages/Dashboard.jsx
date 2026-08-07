import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  Boxes,
  CalendarCheck,
  CalendarDays,
  Clock3,
  Plus,
  Users,
} from "lucide-react";

import { getEvents } from "../services/eventService";
import { getResources } from "../services/resourceService";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);

  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setBackendError("");

        const [eventResponse, resourceResponse] =
          await Promise.all([
            getEvents({ limit: 100 }),
            getResources({ limit: 100 }),
          ]);

        setEvents(
          eventResponse?.data?.events || []
        );

        setResources(
          resourceResponse?.data?.resources || []
        );
      } catch (error) {
        console.error(
          "Dashboard loading failed:",
          error
        );

        setBackendError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const upcomingEvents = useMemo(() => {
    const now = new Date();

    return events.filter((event) => {
      return (
        event.startDatetime &&
        new Date(event.startDatetime) >= now
      );
    });
  }, [events]);

  const stats = [
    {
      label: "Total Events",
      value: loading ? "—" : events.length,
      detail: "Across your workspace",
      icon: CalendarDays,
    },
    {
      label: "Upcoming Events",
      value: loading ? "—" : upcomingEvents.length,
      detail: "Scheduled activities",
      icon: CalendarCheck,
    },
    {
      label: "RSVP Responses",
      value: "Live",
      detail: "Available per event",
      icon: Users,
    },
    {
      label: "Resources",
      value: loading ? "—" : resources.length,
      detail: "Available for booking",
      icon: Boxes,
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            EVENT OPERATIONS
          </div>

          <h1>Good morning, Admin</h1>

          <p>
            Manage events, attendees and resources
            from one workspace.
          </p>
        </div>

        <Link
          to="/events/create"
          className="primary-button"
        >
          <Plus size={18} />
          Create Event
        </Link>
      </section>

      {backendError && (
        <div className="error-banner">
          <strong>Backend connection issue</strong>
          <span>{backendError}</span>
        </div>
      )}

      <section className="stats-grid">
        {stats.map(
          ({
            label,
            value,
            detail,
            icon: Icon,
          }) => (
            <article
              className="stat-card"
              key={label}
            >
              <div className="stat-card-top">
                <div className="stat-icon">
                  <Icon size={20} />
                </div>

                <span className="stat-indicator">
                  Live
                </span>
              </div>

              <div className="stat-value">
                {value}
              </div>

              <div className="stat-label">
                {label}
              </div>

              <div className="stat-detail">
                {detail}
              </div>
            </article>
          )
        )}
      </section>

      <section className="dashboard-grid">
        <article className="panel dashboard-feature">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                EVENTS
              </span>

              <h2>Event workspace</h2>

              <p>
                Create, publish and manage
                institutional events.
              </p>
            </div>

            <Link
              to="/events"
              className="text-link"
            >
              View events
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="empty-preview">
            <div className="preview-icon">
              <CalendarDays size={28} />
            </div>

            <h3>
              {events.length
                ? `${events.length} events available`
                : "Your event operations live here"}
            </h3>

            <p>
              Manage schedules, event details,
              publishing, RSVP responses and resource
              bookings from your WisWits workspace.
            </p>

            <Link
              to="/events"
              className="secondary-button"
            >
              Open Events
            </Link>
          </div>
        </article>

        <article className="panel quick-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                QUICK ACCESS
              </span>

              <h2>Management tools</h2>
            </div>
          </div>

          <Link
            to="/events/create"
            className="quick-action"
          >
            <div className="quick-icon">
              <Plus size={19} />
            </div>

            <div>
              <strong>Create an event</strong>
              <span>
                Schedule a new activity
              </span>
            </div>

            <ArrowRight size={17} />
          </Link>

          <Link
            to="/resources"
            className="quick-action"
          >
            <div className="quick-icon">
              <Boxes size={19} />
            </div>

            <div>
              <strong>Manage resources</strong>
              <span>
                Check availability and bookings
              </span>
            </div>

            <ArrowRight size={17} />
          </Link>

          <div className="quick-action">
            <div className="quick-icon">
              <Clock3 size={19} />
            </div>

            <div>
              <strong>Backend connected</strong>
              <span>
                Live Event Management API
              </span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}