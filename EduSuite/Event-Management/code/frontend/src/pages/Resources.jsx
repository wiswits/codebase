import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Boxes,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import ResourceCard from "../components/resources/ResourceCard";
import ResourceBookingModal from "../components/resources/ResourceBookingModal";

import {
  getResources,
} from "../services/eventService";

export default function Resources() {
  const [resources, setResources] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedResource, setSelectedResource] =
    useState(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadResources =
    useCallback(async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getResources();

        const resourceData =
          Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.resources)
                ? response.resources
                : Array.isArray(
                    response?.data?.resources
                  )
                  ? response.data.resources
                  : [];

        setResources(resourceData);
      } catch (err) {
        console.error(
          "Resource loading failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to load resources."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  function handleBookingSuccess() {
    setSuccessMessage(
      "Resource booked successfully."
    );

    loadResources(true);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  }

  return (
    <div className="page-container resources-page page-enter">
      <section className="page-heading resource-heading">
        <div>
          <span className="page-kicker">
            RESOURCE MANAGEMENT
          </span>

          <h1>Resources</h1>

          <p>
            Browse resources, check availability
            and assign them to events.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button resource-refresh-button"
          onClick={() =>
            loadResources(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "spin-icon"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      {successMessage && (
        <div className="success-banner">
          <CheckCircle2 size={18} />

          <div>
            <strong>Booking confirmed</strong>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <strong>
            Unable to load resources
          </strong>

          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="resource-loading-grid">
          {[1, 2, 3].map((item) => (
            <div
              className="resource-skeleton"
              key={item}
            >
              <div className="skeleton-icon" />
              <div className="skeleton-line skeleton-short" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-medium" />
            </div>
          ))}
        </div>
      ) : resources.length > 0 ? (
        <section className="resource-grid">
          {resources.map(
            (resource, index) => (
              <ResourceCard
                key={
                  resource.id ??
                  resource.resourceId ??
                  index
                }
                resource={resource}
                index={index}
                onBook={
                  setSelectedResource
                }
              />
            )
          )}
        </section>
      ) : (
        <section className="resource-empty-state">
          <div className="resource-empty-icon">
            <Boxes size={27} />
          </div>

          <h2>
            No resources available
          </h2>

          <p>
            Resources added to the Event
            Management workspace will appear
            here.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              loadResources(true)
            }
          >
            <RefreshCw size={17} />
            Check again
          </button>
        </section>
      )}

      {selectedResource && (
        <ResourceBookingModal
          resource={selectedResource}
          onClose={() =>
            setSelectedResource(null)
          }
          onSuccess={
            handleBookingSuccess
          }
        />
      )}
    </div>
  );
}