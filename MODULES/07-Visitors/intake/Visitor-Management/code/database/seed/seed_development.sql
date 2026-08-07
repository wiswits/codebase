-- ============================================================
-- Visitor Management
-- Development Seed Data
-- ============================================================
--
-- DEVELOPMENT / LOCAL TESTING ONLY.
-- Do not run against production databases.
--
-- No USE <database> statement is intentionally included.
-- ============================================================


INSERT INTO client_visitor_logs (
    org_id,
    visitor_name,
    visitor_phone,
    visitor_email,
    visitor_type,
    purpose,
    host_id,
    host_name,
    status,
    checked_in_by
)
VALUES (
    1,
    'Development Test Visitor',
    '9876543210',
    'visitor@example.com',
    'guest',
    'Visitor Management development testing',
    1,
    'Development Host',
    'checked_in',
    1
);