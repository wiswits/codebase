-- ============================================================
-- WisWits - Registration Management
-- Database Migration
-- File: 001_create_registration_management.sql
--
-- Database: MariaDB
--
-- IMPORTANT:
-- client_registration_number_series is CTO-directed.
--
-- client_registrations and client_registration_documents are
-- integration schema names used by this implementation because
-- the Registration contract does not lock their final physical
-- production table names.
-- ============================================================

CREATE DATABASE IF NOT EXISTS wiswits_registration
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE wiswits_registration;


-- ============================================================
-- 1. REGISTRATION NUMBER SERIES
-- ============================================================

CREATE TABLE IF NOT EXISTS client_registration_number_series (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    organization_id BIGINT UNSIGNED NOT NULL,
    academic_session VARCHAR(50) NOT NULL,

    prefix VARCHAR(50) NOT NULL,
    current_sequence BIGINT UNSIGNED NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT uq_registration_series_org_session
        UNIQUE (organization_id, academic_session),

    INDEX idx_registration_series_org (
        organization_id
    ),

    INDEX idx_registration_series_session (
        academic_session
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. REGISTRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS client_registrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    organization_id BIGINT UNSIGNED NOT NULL,

    registration_number VARCHAR(100) NOT NULL,

    academic_session VARCHAR(50) NOT NULL,

    student_first_name VARCHAR(100) NOT NULL,
    student_middle_name VARCHAR(100) NULL,
    student_last_name VARCHAR(100) NOT NULL,

    date_of_birth DATE NULL,

    gender VARCHAR(30) NULL,

    email VARCHAR(255) NULL,
    phone VARCHAR(30) NULL,

    guardian_name VARCHAR(200) NULL,
    guardian_phone VARCHAR(30) NULL,

    address_line VARCHAR(500) NULL,

    admission_class VARCHAR(100) NULL,

    status ENUM(
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'cancelled'
    ) NOT NULL DEFAULT 'draft',

    notes TEXT NULL,

    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT uq_registration_org_number
        UNIQUE (
            organization_id,
            registration_number
        ),

    INDEX idx_registration_org (
        organization_id
    ),

    INDEX idx_registration_number (
        registration_number
    ),

    INDEX idx_registration_session (
        organization_id,
        academic_session
    ),

    INDEX idx_registration_status (
        organization_id,
        status
    ),

    INDEX idx_registration_student_name (
        student_last_name,
        student_first_name
    ),

    INDEX idx_registration_created_at (
        created_at
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. REGISTRATION DOCUMENT CHECKLIST
-- ============================================================

CREATE TABLE IF NOT EXISTS client_registration_documents (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    organization_id BIGINT UNSIGNED NOT NULL,

    registration_id BIGINT UNSIGNED NOT NULL,

    document_type VARCHAR(100) NOT NULL,

    document_name VARCHAR(200) NOT NULL,

    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    status ENUM(
        'pending',
        'submitted',
        'verified',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    file_reference VARCHAR(500) NULL,

    remarks VARCHAR(1000) NULL,

    verified_by BIGINT UNSIGNED NULL,
    verified_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_registration_document_registration
        FOREIGN KEY (registration_id)
        REFERENCES client_registrations(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_registration_document
        UNIQUE (
            organization_id,
            registration_id,
            document_type
        ),

    INDEX idx_registration_document_org (
        organization_id
    ),

    INDEX idx_registration_document_registration (
        registration_id
    ),

    INDEX idx_registration_document_status (
        organization_id,
        status
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

SELECT
    'Registration Management migration completed successfully.'
    AS migration_status;