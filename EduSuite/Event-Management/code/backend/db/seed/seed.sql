-- Reproducible, tenant-scoped demo data for local development only.
-- Contains no real credentials or sensitive information.

INSERT INTO events (id, org_id, title, rsvp_enabled, rsvp_deadline, capacity)
VALUES
  (1, 1, 'Annual Science Fair', 1, DATE_ADD(NOW(), INTERVAL 14 DAY), 3),
  (2, 1, 'Parent-Teacher Conference', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
  (3, 2, 'Cross-Tenant Sample Event', 1, DATE_ADD(NOW(), INTERVAL 7 DAY), 100)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO event_resources (id, org_id, name, type, description)
VALUES
  (1, 1, 'Main Auditorium', 'room', 'Seats 200, has A/V system'),
  (2, 1, 'Projector Cart A', 'equipment', 'Portable projector + screen'),
  (3, 2, 'Conference Room B', 'room', 'Seats 20')
ON DUPLICATE KEY UPDATE name = VALUES(name);
