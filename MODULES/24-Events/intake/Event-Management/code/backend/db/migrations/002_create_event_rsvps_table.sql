-- Backend Developer 2 scope: RSVP storage.
-- One RSVP per (event, user) enforced via UNIQUE KEY; upserts use
-- INSERT ... ON DUPLICATE KEY UPDATE against this constraint.

CREATE TABLE IF NOT EXISTS event_rsvps (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id      BIGINT UNSIGNED NOT NULL,
  event_id    BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  status      ENUM('going', 'maybe', 'not_going') NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_event_rsvps_event_user (event_id, user_id),
  INDEX idx_event_rsvps_org_event (org_id, event_id),
  INDEX idx_event_rsvps_org_event_status (org_id, event_id, status),

  CONSTRAINT fk_event_rsvps_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
