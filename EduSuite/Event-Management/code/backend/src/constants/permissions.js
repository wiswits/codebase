/**
 * Permission identifiers used by the permission-based RBAC middleware.
 *
 * Backend Developer 2 scope note: this module does not own the
 * authoritative RBAC/permission catalog (Engineering Standards §15 says
 * existing RBAC infrastructure should be reused). Since no such
 * infrastructure exists yet in this repository, these constants define the
 * two permissions this module depends on. If a shared permission catalog is
 * introduced later, update the values here rather than scattering permission
 * strings through route files.
 */
module.exports = {
  // Required to view the RSVP summary for an event (per
  // EVENT_MANAGEMENT_CONTRACT.md: "Management permission for RSVP summary
  // endpoint.")
  EVENT_RSVP_MANAGE: 'event:rsvp:manage',

  // Required to create/remove resource bookings for an event.
  EVENT_RESOURCE_MANAGE: 'event:resource:manage',
};
