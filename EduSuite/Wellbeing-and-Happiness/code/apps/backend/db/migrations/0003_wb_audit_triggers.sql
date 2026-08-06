-- ═══════════════════════════════════════════════════════════════
-- 0003_wb_audit_triggers.sql — audit log is append-only (PRD Part 1.2)
--
-- Accountability only means something if it cannot be rewritten. These
-- triggers make UPDATE and DELETE on wb_access_audit impossible — even for
-- an admin, even for a DBA. The record of who-saw-what is permanent.
--
-- Note: written as single-statement triggers (no BEGIN/END, no DELIMITER) so
-- they run through a plain multi-statement driver connection without a client
-- DELIMITER directive. Works on MySQL 8 and MariaDB 10.5+.
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS wb_audit_no_update;
DROP TRIGGER IF EXISTS wb_audit_no_delete;

CREATE TRIGGER wb_audit_no_update
BEFORE UPDATE ON wb_access_audit
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'wb_access_audit is append-only. Updates are forbidden.';

CREATE TRIGGER wb_audit_no_delete
BEFORE DELETE ON wb_access_audit
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'wb_access_audit is append-only. Deletes are forbidden.';
