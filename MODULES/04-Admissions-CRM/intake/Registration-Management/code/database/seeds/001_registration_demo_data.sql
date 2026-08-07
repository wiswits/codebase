-- ============================================================
-- WisWits - Registration Management
-- Development / Integration Seed Data
-- File: 001_registration_demo_data.sql
-- ============================================================

USE wiswits_registration;


-- ============================================================
-- 1. NUMBER SERIES
-- ============================================================

INSERT INTO client_registration_number_series (
    organization_id,
    academic_session,
    prefix,
    current_sequence
)
VALUES (
    12,
    '2026-2027',
    'ORG12-2026',
    3
)
ON DUPLICATE KEY UPDATE
    prefix = VALUES(prefix),
    current_sequence = GREATEST(
        current_sequence,
        VALUES(current_sequence)
    );


-- ============================================================
-- 2. DEMO REGISTRATIONS
-- ============================================================

INSERT INTO client_registrations (
    organization_id,
    registration_number,
    academic_session,
    student_first_name,
    student_middle_name,
    student_last_name,
    date_of_birth,
    gender,
    email,
    phone,
    guardian_name,
    guardian_phone,
    address_line,
    admission_class,
    status,
    notes,
    created_by
)
VALUES
(
    12,
    'ORG12-2026-0001',
    '2026-2027',
    'Aarav',
    NULL,
    'Sharma',
    '2012-05-14',
    'Male',
    'aarav.sharma@example.com',
    '9000000001',
    'Rajesh Sharma',
    '9111111111',
    'New Delhi, India',
    'Grade 9',
    'approved',
    'Demo registration for integration testing.',
    1
),
(
    12,
    'ORG12-2026-0002',
    '2026-2027',
    'Ananya',
    NULL,
    'Verma',
    '2013-08-22',
    'Female',
    'ananya.verma@example.com',
    '9000000002',
    'Sunil Verma',
    '9222222222',
    'Noida, India',
    'Grade 8',
    'under_review',
    'Registration awaiting final review.',
    1
),
(
    12,
    'ORG12-2026-0003',
    '2026-2027',
    'Kabir',
    NULL,
    'Mehta',
    '2012-11-03',
    'Male',
    'kabir.mehta@example.com',
    '9000000003',
    'Rohit Mehta',
    '9333333333',
    'Gurugram, India',
    'Grade 9',
    'submitted',
    'Registration submitted with pending documents.',
    1
)
ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;


-- ============================================================
-- 3. DOCUMENT CHECKLIST - REGISTRATION 1
-- ============================================================

INSERT INTO client_registration_documents (
    organization_id,
    registration_id,
    document_type,
    document_name,
    is_required,
    status,
    file_reference,
    remarks,
    verified_by,
    verified_at
)
SELECT
    12,
    r.id,
    'birth_certificate',
    'Birth Certificate',
    TRUE,
    'verified',
    '/demo/documents/birth-certificate-aarav.pdf',
    'Verified successfully.',
    1,
    NOW()
FROM client_registrations r
WHERE r.organization_id = 12
  AND r.registration_number = 'ORG12-2026-0001'
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    file_reference = VALUES(file_reference),
    remarks = VALUES(remarks);


INSERT INTO client_registration_documents (
    organization_id,
    registration_id,
    document_type,
    document_name,
    is_required,
    status,
    file_reference,
    remarks,
    verified_by,
    verified_at
)
SELECT
    12,
    r.id,
    'previous_school_record',
    'Previous School Record',
    TRUE,
    'verified',
    '/demo/documents/school-record-aarav.pdf',
    'Verified successfully.',
    1,
    NOW()
FROM client_registrations r
WHERE r.organization_id = 12
  AND r.registration_number = 'ORG12-2026-0001'
ON DUPLICATE KEY UPDATE
    status = VALUES(status);


-- ============================================================
-- 4. DOCUMENT CHECKLIST - REGISTRATION 2
-- ============================================================

INSERT INTO client_registration_documents (
    organization_id,
    registration_id,
    document_type,
    document_name,
    is_required,
    status,
    file_reference,
    remarks
)
SELECT
    12,
    r.id,
    'birth_certificate',
    'Birth Certificate',
    TRUE,
    'submitted',
    '/demo/documents/birth-certificate-ananya.pdf',
    'Pending verification.'
FROM client_registrations r
WHERE r.organization_id = 12
  AND r.registration_number = 'ORG12-2026-0002'
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    file_reference = VALUES(file_reference),
    remarks = VALUES(remarks);


INSERT INTO client_registration_documents (
    organization_id,
    registration_id,
    document_type,
    document_name,
    is_required,
    status
)
SELECT
    12,
    r.id,
    'previous_school_record',
    'Previous School Record',
    TRUE,
    'pending'
FROM client_registrations r
WHERE r.organization_id = 12
  AND r.registration_number = 'ORG12-2026-0002'
ON DUPLICATE KEY UPDATE
    status = VALUES(status);


-- ============================================================
-- 5. DOCUMENT CHECKLIST - REGISTRATION 3
-- ============================================================

INSERT INTO client_registration_documents (
    organization_id,
    registration_id,
    document_type,
    document_name,
    is_required,
    status
)
SELECT
    12,
    r.id,
    'birth_certificate',
    'Birth Certificate',
    TRUE,
    'pending'
FROM client_registrations r
WHERE r.organization_id = 12
  AND r.registration_number = 'ORG12-2026-0003'
ON DUPLICATE KEY UPDATE
    status = VALUES(status);


INSERT INTO client_registration_documents (
    organization_id,
    registration_id,
    document_type,
    document_name,
    is_required,
    status
)
SELECT
    12,
    r.id,
    'previous_school_record',
    'Previous School Record',
    TRUE,
    'pending'
FROM client_registrations r
WHERE r.organization_id = 12
  AND r.registration_number = 'ORG12-2026-0003'
ON DUPLICATE KEY UPDATE
    status = VALUES(status);


-- ============================================================
-- SEED COMPLETE
-- ============================================================

SELECT
    'Registration Management demo data inserted successfully.'
    AS seed_status;