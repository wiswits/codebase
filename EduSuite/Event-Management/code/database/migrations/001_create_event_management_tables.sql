-- ============================================================
-- EduSuite - Event Management Module
-- Migration: 001_create_event_management_tables.sql
-- Database: MariaDB
-- Purpose: Initial Event Management schema
-- ============================================================


-- ============================================================
-- 1. EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS client_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    org_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT NULL,

    event_type VARCHAR(100) NULL,

    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,

    location VARCHAR(255) NULL,
    capacity INT UNSIGNED NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'draft',

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_events_org_id (org_id),
    INDEX idx_events_org_status (org_id, status),
    INDEX idx_events_org_start (org_id, start_datetime)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. EVENT RSVPS
-- ============================================================

CREATE TABLE IF NOT EXISTS client_event_rsvps (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    org_id BIGINT UNSIGNED NOT NULL,
    event_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    response_status VARCHAR(30) NOT NULL DEFAULT 'pending',

    responded_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_event_rsvp (
        org_id,
        event_id,
        user_id
    ),

    INDEX idx_event_rsvps_org (org_id),
    INDEX idx_event_rsvps_event (org_id, event_id),
    INDEX idx_event_rsvps_user (org_id, user_id),

    CONSTRAINT fk_event_rsvp_event
        FOREIGN KEY (event_id)
        REFERENCES client_events(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. EVENT RESOURCES
-- ============================================================

CREATE TABLE IF NOT EXISTS client_event_resources (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    org_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,

    description TEXT NULL,

    quantity INT UNSIGNED NOT NULL DEFAULT 1,

    status VARCHAR(30) NOT NULL DEFAULT 'available',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_event_resources_org (org_id),
    INDEX idx_event_resources_type (org_id, resource_type),
    INDEX idx_event_resources_status (org_id, status)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. EVENT RESOURCE BOOKINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS client_event_resource_bookings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    org_id BIGINT UNSIGNED NOT NULL,

    event_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,

    quantity INT UNSIGNED NOT NULL DEFAULT 1,

    booking_start DATETIME NOT NULL,
    booking_end DATETIME NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'reserved',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_resource_booking_org (org_id),
    INDEX idx_resource_booking_event (org_id, event_id),
    INDEX idx_resource_booking_resource (
        org_id,
        resource_id,
        booking_start,
        booking_end
    ),

    CONSTRAINT fk_resource_booking_event
        FOREIGN KEY (event_id)
        REFERENCES client_events(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_resource_booking_resource
        FOREIGN KEY (resource_id)
        REFERENCES client_event_resources(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;