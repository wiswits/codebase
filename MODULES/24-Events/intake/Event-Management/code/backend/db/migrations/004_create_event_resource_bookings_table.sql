-- Backend Developer 2 scope: resource bookings tied to an event.
-- Conflict detection (RESOURCE_CONFLICT) is enforced in the application
-- layer at booking time (resource.service.js -> findOverlappingBookings,
-- guarded by SELECT ... FOR UPDATE inside a transaction), rather than only
-- at the database layer, because "overlap" cannot be expressed as a simple
-- SQL UNIQUE constraint.

CREATE TABLE IF NOT EXISTS event_resource_bookings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id        BIGINT UNSIGNED NOT NULL,
  event_id      BIGINT UNSIGNED NOT NULL,
  resource_id   BIGINT UNSIGNED NOT NULL,
  start_time    DATETIME NOT NULL,
  end_time      DATETIME NOT NULL,
  booked_by     BIGINT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_bookings_org_resource_time (org_id, resource_id, start_time, end_time),
  INDEX idx_bookings_org_event (org_id, event_id),

  CONSTRAINT fk_bookings_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_bookings_resource
    FOREIGN KEY (resource_id) REFERENCES event_resources(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_bookings_time_order
    CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
