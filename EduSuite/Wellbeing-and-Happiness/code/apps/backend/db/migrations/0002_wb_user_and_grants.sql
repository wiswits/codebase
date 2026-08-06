-- ═══════════════════════════════════════════════════════════════
-- 0002_wb_user_and_grants.sql — DB-level enforcement (PRD Part 1.2)
--
-- Code guards are not enough. Lock it at the DB too. If code ever writes a
-- banned JOIN, MySQL itself rejects it because this user cannot even SELECT
-- the academic/financial/discipline tables.
--
-- ⚠️ Placeholders __WB_USER__ / __WB_PASSWORD__ are substituted by db/migrate.js
--    from env (WB_DB_USER / WB_DB_PASSWORD). Do not hardcode a password here.
-- ═══════════════════════════════════════════════════════════════

CREATE USER IF NOT EXISTS '__WB_USER__'@'%' IDENTIFIED BY '__WB_PASSWORD__';

-- Reset to a clean slate so re-running migrations is idempotent.
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '__WB_USER__'@'%';

-- ── Full access to wb_* only ────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_consent`             TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_pulse`               TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_pulse_aggregate`     TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_journal`             TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_journal_key`         TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_activity`            TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_activity_log`        TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_signal`              TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_flag`                TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_case`                TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_session_note`        TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_referral`            TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_bullying_report`     TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_staff_check`         TO '__WB_USER__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON `wiswits`.`wb_crisis_event`        TO '__WB_USER__'@'%';
-- Audit + violation tables: INSERT + SELECT only. No UPDATE/DELETE at the grant
-- level either (triggers block it too — belt and suspenders).
GRANT SELECT, INSERT ON `wiswits`.`wb_access_audit`        TO '__WB_USER__'@'%';
GRANT SELECT, INSERT ON `wiswits`.`wb_guardrail_violation` TO '__WB_USER__'@'%';

-- ── Minimum-columns student view (no name, no marks, no fees) ────
-- Aggregate queries need class/section/dob — nothing that identifies a child.
CREATE OR REPLACE VIEW wb_student_view AS
SELECT id, org_id, class_no, section, gender, dob, admission_date
FROM client_students
WHERE deleted_at IS NULL;

GRANT SELECT ON `wiswits`.`wb_student_view` TO '__WB_USER__'@'%';

-- ── EXPLICITLY: these tables do not exist for the wb user ────────
-- (No GRANT was ever issued for them; the REVOKE ALL above guarantees it.
--  Listed here so the intent is unmistakable and reviewable.)
--   client_exam_result, client_pl_attempt, client_pl_response,
--   client_pl_topic_score, client_pl_weak_area, client_fees,
--   client_fee_ledger, client_discipline, client_hostel_incident

FLUSH PRIVILEGES;
