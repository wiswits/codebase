-- ============================================================
-- EduSuite Event Management
-- Development Seed Data
-- ============================================================

-- Sample Events
INSERT INTO client_events
(org_id, title, description, event_type, start_datetime, end_datetime, location, capacity, status, created_by)
VALUES
(
    1,
    'Annual Science Exhibition',
    'Annual school science exhibition for students.',
    'academic',
    '2026-08-10 09:00:00',
    '2026-08-10 15:00:00',
    'Main Auditorium',
    300,
    'published',
    1
),
(
    1,
    'Inter School Sports Meet',
    'Sports competition between participating schools.',
    'sports',
    '2026-08-20 08:00:00',
    '2026-08-20 17:00:00',
    'School Ground',
    500,
    'published',
    1
);


-- Sample Resources
INSERT INTO client_event_resources
(org_id, name, resource_type, description, quantity, status)
VALUES
(
    1,
    'Projector',
    'equipment',
    'Auditorium presentation projector',
    2,
    'available'
),
(
    1,
    'Wireless Microphone',
    'equipment',
    'Wireless microphone for event presentations',
    4,
    'available'
);