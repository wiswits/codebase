-- ═══════════════════════════════════════════════════════════════
-- 0004_wb_note_key.sql — per-org key for encrypting counsellor session notes.
--
-- Session notes are AES-256-GCM encrypted (like the journal), but with a key
-- scoped to the org's counselling team rather than a single student. Wrapped by
-- the KMS master, same as journal keys.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wb_note_key (
  org_id         BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  key_encrypted  VARBINARY(512) NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rotated_at     DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Grant the wb runtime user access to the new table (created after 0002 runs).
GRANT SELECT, INSERT, UPDATE ON `wiswits`.`wb_note_key` TO '__WB_USER__'@'%';
FLUSH PRIVILEGES;
