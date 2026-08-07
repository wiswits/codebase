import { apiRequest } from "./api";

/* =========================================================
   EVENT API
   ========================================================= */

/**
 * GET /api/v1/events
 */
export async function getEvents(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();

  return apiRequest(
    `/events${query ? `?${query}` : ""}`
  );
}

/**
 * GET /api/v1/events/:eventId
 */
export async function getEventById(eventId) {
  return apiRequest(`/events/${eventId}`);
}

/**
 * POST /api/v1/events
 */
export async function createEvent(payload) {
  return apiRequest("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/v1/events/:eventId
 */
export async function updateEvent(
  eventId,
  payload
) {
  return apiRequest(`/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/v1/events/:eventId
 */
export async function deleteEvent(eventId) {
  return apiRequest(`/events/${eventId}`, {
    method: "DELETE",
  });
}

/**
 * PATCH /api/v1/events/:eventId/status
 */
export async function updateEventStatus(
  eventId,
  status
) {
  return apiRequest(
    `/events/${eventId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
  );
}

/* =========================================================
   RESOURCE API
   Matches existing EduSuite backend routes
   ========================================================= */

/**
 * GET /api/v1/events/resources
 */
export async function getResources(
  params = {}
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.set(key, value);
      }
    }
  );

  const query = searchParams.toString();

  return apiRequest(
    `/events/resources${
      query ? `?${query}` : ""
    }`
  );
}

/**
 * GET
 * /api/v1/events/resources/:resourceId/availability
 */
export async function getResourceAvailability(
  resourceId,
  params = {}
) {
  if (
    resourceId === undefined ||
    resourceId === null ||
    resourceId === ""
  ) {
    throw new Error(
      "Resource ID is required."
    );
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.set(key, value);
      }
    }
  );

  const query = searchParams.toString();

  return apiRequest(
    `/events/resources/${resourceId}/availability${
      query ? `?${query}` : ""
    }`
  );
}

/**
 * POST
 * /api/v1/events/:eventId/resources
 */
export async function bookResource(
  eventId,
  payload
) {
  if (
    eventId === undefined ||
    eventId === null ||
    eventId === ""
  ) {
    throw new Error(
      "Event ID is required to book a resource."
    );
  }

  return apiRequest(
    `/events/${eventId}/resources`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/**
 * DELETE
 * /api/v1/events/:eventId/resources/:bookingId
 */
export async function removeResourceBooking(
  eventId,
  bookingId
) {
  if (
    eventId === undefined ||
    eventId === null ||
    eventId === ""
  ) {
    throw new Error(
      "Event ID is required."
    );
  }

  if (
    bookingId === undefined ||
    bookingId === null ||
    bookingId === ""
  ) {
    throw new Error(
      "Booking ID is required."
    );
  }

  return apiRequest(
    `/events/${eventId}/resources/${bookingId}`,
    {
      method: "DELETE",
    }
  );
}