import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Plus,
  RefreshCw,
} from "lucide-react";

import EventTable from "../components/events/EventTable";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";

import { getEvents } from "../services/eventService";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await getEvents();

      setEvents(
        response?.data?.events || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="page-container">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            EVENT MANAGEMENT
          </div>

          <h1>Events</h1>

          <p>
            Create, publish and manage
            institutional events.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="secondary-button"
            onClick={loadEvents}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <Link
            to="/events/create"
            className="primary-button"
          >
            <Plus size={18} />
            Create Event
          </Link>
        </div>
      </section>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <Loader label="Loading events..." />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Create your first institutional event to get started."
        />
      ) : (
        <EventTable
          events={events}
          onRefresh={loadEvents}
        />
      )}
    </div>
  );
}