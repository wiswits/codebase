-- ============================================================
-- WisWits - Registration Management
-- Database Verification
-- File: verify_registration_management.sql
-- ============================================================

USE wiswits_registration;


-- ============================================================
-- TEST 1: DATABASE
-- ============================================================

SELECT DATABASE() AS active_database;


-- ============================================================
-- TEST 2: REQUIRED TABLES
-- ============================================================

SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'client_registration_number_series',
      'client_registrations',
      'client_registration_documents'
  )
ORDER BY table_name;


-- ============================================================
-- TEST 3: TABLE COUNT
-- Expected: 3
-- ============================================================

SELECT
    COUNT(*) AS required_table_count
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'client_registration_number_series',
      'client_registrations',
      'client_registration_documents'
  );


-- ============================================================
-- TEST 4: NUMBER SERIES
-- ============================================================

SELECT
    id,
    organization_id,
    academic_session,
    prefix,
    current_sequence,
    created_at,
    updated_at
FROM client_registration_number_series
ORDER BY organization_id, academic_session;


-- ============================================================
-- TEST 5: REGISTRATION COUNT
-- ============================================================

SELECT
    COUNT(*) AS registration_count
FROM client_registrations;


-- ============================================================
-- TEST 6: REGISTRATION REGISTER
-- ============================================================

SELECT
    id,
    organization_id,
    registration_number,
    academic_session,
    CONCAT_WS(
        ' ',
        student_first_name,
        student_middle_name,
        student_last_name
    ) AS student_name,
    admission_class,
    status,
    created_at
FROM client_registrations
ORDER BY created_at DESC;


-- ============================================================
-- TEST 7: REGISTRATION NUMBER UNIQUENESS
-- Expected: zero rows
-- ============================================================

SELECT
    organization_id,
    registration_number,
    COUNT(*) AS duplicate_count
FROM client_registrations
GROUP BY
    organization_id,
    registration_number
HAVING COUNT(*) > 1;


-- ============================================================
-- TEST 8: SERIES UNIQUENESS
-- Expected: zero rows
-- ============================================================

SELECT
    organization_id,
    academic_session,
    COUNT(*) AS duplicate_count
FROM client_registration_number_series
GROUP BY
    organization_id,
    academic_session
HAVING COUNT(*) > 1;


-- ============================================================
-- TEST 9: DOCUMENT CHECKLIST
-- ============================================================

SELECT
    d.id,
    r.registration_number,
    CONCAT_WS(
        ' ',
        r.student_first_name,
        r.student_middle_name,
        r.student_last_name
    ) AS student_name,
    d.document_type,
    d.document_name,
    d.is_required,
    d.status,
    d.file_reference,
    d.verified_at
FROM client_registration_documents d
INNER JOIN client_registrations r
    ON r.id = d.registration_id
   AND r.organization_id = d.organization_id
ORDER BY
    r.registration_number,
    d.document_name;


-- ============================================================
-- TEST 10: DOCUMENT STATUS SUMMARY
-- ============================================================

SELECT
    status,
    COUNT(*) AS document_count
FROM client_registration_documents
GROUP BY status
ORDER BY status;


-- ============================================================
-- TEST 11: REGISTRATION STATUS SUMMARY
-- ============================================================

SELECT
    status,
    COUNT(*) AS registration_count
FROM client_registrations
GROUP BY status
ORDER BY status;


-- ============================================================
-- TEST 12: ORPHAN DOCUMENTS
-- Expected: 0
-- ============================================================

SELECT
    COUNT(*) AS orphan_document_count
FROM client_registration_documents d
LEFT JOIN client_registrations r
    ON r.id = d.registration_id
WHERE r.id IS NULL;


-- ============================================================
-- TEST 13: TENANT RELATIONSHIP CONSISTENCY
-- Expected: 0
-- ============================================================

SELECT
    COUNT(*) AS tenant_mismatch_count
FROM client_registration_documents d
INNER JOIN client_registrations r
    ON r.id = d.registration_id
WHERE d.organization_id <> r.organization_id;


-- ============================================================
-- TEST 14: REGISTRATIONS WITHOUT DOCUMENT CHECKLIST
-- Informational
-- ============================================================

SELECT
    r.id,
    r.registration_number
FROM client_registrations r
LEFT JOIN client_registration_documents d
    ON d.registration_id = r.id
   AND d.organization_id = r.organization_id
WHERE d.id IS NULL;


-- ============================================================
-- TEST 15: INDEX VERIFICATION
-- ============================================================

SHOW INDEX
FROM client_registration_number_series;

SHOW INDEX
FROM client_registrations;

SHOW INDEX
FROM client_registration_documents;


-- ============================================================
-- TEST 16: FOREIGN KEY VERIFICATION
-- ============================================================

SELECT
    constraint_name,
    table_name,
    referenced_table_name
FROM information_schema.referential_constraints
WHERE constraint_schema = DATABASE();


-- ============================================================
-- FINAL
-- ============================================================

SELECT
    'Registration Management database verification completed.'
    AS verification_status;