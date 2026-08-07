-- ============================================================
-- EduSuite - Student Observations
-- Developer: Khushboo
-- Database: MariaDB
-- Purpose: Create the Student Observations persistence model
--
-- IMPORTANT:
-- In the final EduSuite repository, rename this migration to
-- the next valid migration sequence number.
--
-- Do NOT add USE <database>;
-- ============================================================

CREATE TABLE IF NOT EXISTS client_student_observations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,

    observation_type ENUM(
        'anecdotal',
        'class_school'
    ) NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_student_observations_org (
        org_id
    ),

    INDEX idx_student_observations_org_student (
        org_id,
        student_id
    ),

    INDEX idx_student_observations_org_author (
        org_id,
        author_id
    ),

    INDEX idx_student_observations_org_type (
        org_id,
        observation_type
    ),

    INDEX idx_student_observations_org_created (
        org_id,
        created_at
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;