import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import EventForm from "../components/events/EventForm";
import Loader from "../components/common/Loader";

import {
  getEventById,
  updateEvent,
} from "../services/eventService";

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  async function handleSubmit(values) {
    await updateEvent(id, values);

    navigate(`/events/${id}`);
  }

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

  return (
    <div className="page-container">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            EVENT MANAGEMENT
          </div>

          <h1>Edit Event</h1>

          <p>
            Update event information,
            scheduling and configuration.
          </p>
        </div>
      </section>

      <EventForm
        mode="edit"
        initialValues={event}
        onSubmit={handleSubmit}
      />
    </div>
  );
}