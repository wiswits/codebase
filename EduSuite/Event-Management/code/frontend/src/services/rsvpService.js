import { apiRequest } from "./api";

export async function submitRsvp(
  eventId,
  responseStatus
) {
  return apiRequest(`/events/${eventId}/rsvp`, {
    method: "PUT",
    body: JSON.stringify({
      responseStatus,
    }),
  });
}

export async function getRsvpSummary(
  eventId,
  params = {}
) {
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
    `/events/${eventId}/rsvps${
      query ? `?${query}` : ""
    }`
  );
}