-- ============================================================
-- WisWits Alumni Directory
-- Migration: 001_create_alumni_directory_tables.sql
-- Module: STL-ALU
-- Database: MariaDB
-- Purpose: Create scratch/demo Alumni Directory persistence
-- ============================================================

CREATE TABLE IF NOT EXISTS client_alumni_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NULL,
    phone VARCHAR(30) NULL,

    batch VARCHAR(100) NOT NULL,
    graduation_year SMALLINT UNSIGNED NOT NULL,
    course VARCHAR(150) NOT NULL,

    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_alumni_org_id (org_id),
    INDEX idx_alumni_org_graduation_year (org_id, graduation_year),
    INDEX idx_alumni_org_batch (org_id, batch),
    INDEX idx_alumni_org_course (org_id, course),
    INDEX idx_alumni_org_status (org_id, status),

    INDEX idx_alumni_name (
        org_id,
        last_name,
        first_name
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;