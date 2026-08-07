import { useState } from "react";

import {
  ArrowRight,
  Boxes,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import {
  getResourceAvailability,
} from "../../services/eventService";

export default function ResourceCard({
  resource,
  index = 0,
  onBook,
}) {
  const [showAvailability, setShowAvailability] =
    useState(false);

  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);

  const [availabilityData, setAvailabilityData] =
    useState(null);

  const [availabilityError, setAvailabilityError] =
    useState("");

  const id =
    resource?.id ??
    resource?.resourceId ??
    null;

  const name =
    resource?.name ??
    resource?.title ??
    "Untitled Resource";

  const description =
    resource?.description ??
    "Available Event Management resource.";

  const category =
    resource?.category ??
    resource?.type ??
    "Resource";

  const defaultAvailable =
    resource?.available ??
    resource?.isAvailable ??
    true;

  const apiAvailability =
    availabilityData?.available ??
    availabilityData?.isAvailable ??
    availabilityData?.data?.available ??
    availabilityData?.data?.isAvailable;

  const available =
    typeof apiAvailability === "boolean"
      ? apiAvailability
      : defaultAvailable;

  async function handleAvailability() {
    if (showAvailability) {
      setShowAvailability(false);
      return;
    }

    setShowAvailability(true);
    setAvailabilityError("");

    if (!id) {
      setAvailabilityError(
        "Resource ID is unavailable."
      );
      return;
    }

    try {
      setAvailabilityLoading(true);

      const response =
        await getResourceAvailability(id);

      setAvailabilityData(response);
    } catch (error) {
      console.error(
        "Availability check failed:",
        error
      );

      setAvailabilityError(
        error?.message ||
          "Unable to check availability."
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }

  return (
    <article
      className="resource-card"
      style={{
        "--resource-delay":
          `${index * 70}ms`,
      }}
    >
      <div className="resource-card-top">
        <div className="resource-card-icon">
          <Boxes size={22} />
        </div>

        <span
          className={`resource-availability-badge ${
            available
              ? "available"
              : "unavailable"
          }`}
        >
          <span />

          {available
            ? "Available"
            : "Unavailable"}
        </span>
      </div>

      <div className="resource-card-id">
        RESOURCE #{id ?? index + 1}
      </div>

      <h2>{name}</h2>

      <p className="resource-description">
        {description}
      </p>

      <div className="resource-category">
        {category}
      </div>

      {showAvailability && (
        <div className="resource-availability-panel">
          {availabilityLoading ? (
            <>
              <LoaderCircle
                size={17}
                className="spin-icon"
              />

              <div>
                <strong>
                  Checking availability
                </strong>
                <span>
                  Contacting backend...
                </span>
              </div>
            </>
          ) : availabilityError ? (
            <>
              <XCircle size={17} />

              <div>
                <strong>
                  Availability unavailable
                </strong>
                <span>
                  {availabilityError}
                </span>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={17} />

              <div>
                <strong>
                  Resource availability
                </strong>

                <span>
                  {available
                    ? "Currently available for booking."
                    : "Currently unavailable."}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="resource-card-footer">
        <button
          type="button"
          className="resource-action-button"
          onClick={handleAvailability}
          disabled={availabilityLoading}
        >
          <Clock3 size={17} />

          {showAvailability
            ? "Hide status"
            : "Availability"}
        </button>

        <button
          type="button"
          className="resource-book-button"
          onClick={() => onBook?.(resource)}
          disabled={!available}
        >
          <CalendarCheck size={17} />
          Book
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}