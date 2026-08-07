-- ============================================================
-- WisWits - Student Observations
-- Database Schema Reference
-- Developer: Khushboo
-- ============================================================
--
-- AUTHORITATIVE MIGRATION:
-- migrations/001_create_student_observations.sql
--
-- This file documents the database contract.
-- It is NOT intended to be run after the migration.
-- ============================================================


-- ============================================================
-- TABLE
-- ============================================================

-- client_student_observations


-- ============================================================
-- COLUMN CONTRACT
-- ============================================================

-- id
--   Primary identifier for an observation.
--   BIGINT UNSIGNED AUTO_INCREMENT.
--
-- org_id
--   Owning WisWits organization / tenant.
--   Must be supplied by trusted backend/platform context.
--
-- student_id
--   Identifier of the student associated with the observation.
--
-- author_id
--   Identifier of the user who authored the observation.
--
-- observation_type
--   Canonical values:
--       anecdotal
--       class_school
--
-- content
--   Observation content.
--
-- created_at
--   Creation timestamp.
--
-- updated_at
--   Last modification timestamp.


-- ============================================================
-- LOGICAL RELATIONSHIPS
-- ============================================================

-- org_id
--      -> Parent platform organization entity
--
-- student_id
--      -> Parent platform student entity
--
-- author_id
--      -> Parent platform authenticated user/staff entity
--
-- Exact foreign-key targets are intentionally NOT declared here.
-- They must be mapped against the authoritative WisWits schema
-- during platform integration.


-- ============================================================
-- TENANT ISOLATION
-- ============================================================

-- Every applicable repository query must include org_id.
--
-- Conceptual example:
--
-- SELECT *
-- FROM client_student_observations
-- WHERE org_id = ?
--   AND student_id = ?;
--
-- org_id must come from trusted authenticated platform context.
-- It must not be accepted from the frontend as access authority.


-- ============================================================
-- SUPPORTED OBSERVATION TYPES
-- ============================================================

-- anecdotal
-- class_school
--
-- Both types belong to the SAME table and SAME module.


-- ============================================================
-- INDEX STRATEGY
-- ============================================================

-- org_id
--
-- (org_id, student_id)
--
-- (org_id, author_id)
--
-- (org_id, observation_type)
--
-- (org_id, created_at)
--
-- These indexes support tenant-first retrieval and the main
-- filtering/query patterns defined by the module contract.


-- ============================================================
-- MUTATION / AUDIT BOUNDARY
-- ============================================================

-- Audit data is NOT duplicated into this table.
--
-- Create/update operations must invoke the parent WisWits
-- shared audit infrastructure from the backend/module layer.