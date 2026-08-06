import { apiRequest } from "./api";

export async function getResources(params = {}) {
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
    `/events/resources${query ? `?${query}` : ""}`
  );
}

export async function getResourceAvailability(
  resourceId,
  startTime,
  endTime
) {
  const params = new URLSearchParams();

  if (startTime && endTime) {
    params.set("startTime", startTime);
    params.set("endTime", endTime);
  }

  const query = params.toString();

  return apiRequest(
    `/events/resources/${resourceId}/availability${
      query ? `?${query}` : ""
    }`
  );
}

export async function bookResource(
  eventId,
  payload
) {
  return apiRequest(
    `/events/${eventId}/resources`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function removeResourceBooking(
  eventId,
  bookingId
) {
  return apiRequest(
    `/events/${eventId}/resources/${bookingId}`,
    {
      method: "DELETE",
    }
  );
}