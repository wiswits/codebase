-- Backend Developer 2 scope: bookable resources catalog (rooms, projectors,
-- equipment, etc.) that events can reserve via event_resource_bookings.

CREATE TABLE IF NOT EXISTS event_resources (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id      BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(100) NULL,
  description VARCHAR(500) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_event_resources_org_id (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
