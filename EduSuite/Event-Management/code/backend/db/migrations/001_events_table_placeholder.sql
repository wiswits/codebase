-- =============================================================================
-- PLACEHOLDER / INTERFACE-DEPENDENCY MIGRATION -- NOT BACKEND DEVELOPER 2 SCOPE
-- =============================================================================
-- Event CRUD (creating, updating, deleting events, and the authoritative
-- `events` table) belongs to Backend Developer 1's module, per
-- EVENT_MANAGEMENT_CONTRACT.md ("Do NOT implement Event CRUD").
--
-- This repository was empty (only a .gitkeep) when Backend Developer 2's
-- work began, so no `events` table existed yet for the RSVP and Resource
-- Booking features (this module) to reference via foreign key.
--
-- This migration creates the MINIMUM columns the RSVP/Resource modules
-- read (id, org_id, title, rsvp_enabled, rsvp_deadline, capacity) so this
-- module is runnable and testable in isolation.
--
-- ACTION REQUIRED BEFORE MERGE: reconcile this with Backend Developer 1's
-- actual `events` migration. If BD1's migration already exists or is
-- merged first, DELETE this file and point the foreign keys in
-- 002/004 at their table instead of applying this one.
-- =============================================================================

CREATE TABLE IF NOT EXISTS events (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id          BIGINT UNSIGNED NOT NULL,
  title           VARCHAR(255) NOT NULL,
  rsvp_enabled    TINYINT(1) NOT NULL DEFAULT 0,
  rsvp_deadline   DATETIME NULL,
  capacity        INT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_events_org_id (org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
