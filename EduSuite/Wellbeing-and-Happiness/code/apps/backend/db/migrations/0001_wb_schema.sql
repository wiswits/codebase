-- ═══════════════════════════════════════════════════════════════
-- 0001_wb_schema.sql — the 18 wellbeing tables (PRD Part 3.1)
--
-- ⚠️ SEPARATE concern from client_* tables. These are architecturally
--    isolated: separate DB user, separate grants (see 0002).
--    NO foreign keys to academic / financial / discipline tables. Ever.
-- ═══════════════════════════════════════════════════════════════

-- ─── CONSENT ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_consent (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id                    BIGINT UNSIGNED NOT NULL,
  student_id                BIGINT UNSIGNED NOT NULL,
  participates              TINYINT(1) NOT NULL DEFAULT 0,       -- master switch
  age_band                  ENUM('under_13','13_15','16_17','18_plus') NOT NULL,
  parent_consent_at         DATETIME NULL,
  parent_consent_by         BIGINT UNSIGNED NULL,
  parent_consent_token      VARCHAR(128) NULL,
  student_assent_at         DATETIME NULL,
  journal_enabled           TINYINT(1) NOT NULL DEFAULT 0,
  parent_can_see_individual TINYINT(1) NOT NULL DEFAULT 0,       -- always FALSE by default
  counsellor_can_read_journal TINYINT(1) NOT NULL DEFAULT 0,     -- always FALSE by default
  opted_out_at              DATETIME NULL,
  opt_out_reason            VARCHAR(255) NULL,                    -- optional, never required
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_consent_student (org_id, student_id),
  KEY idx_consent_participates (org_id, participates)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── DAILY PULSE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_pulse (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id           BIGINT UNSIGNED NOT NULL,
  student_id       BIGINT UNSIGNED NULL,                          -- NULL after anonymization
  date             DATE NOT NULL,
  mood             ENUM('great','good','okay','low','struggling') NOT NULL,
  energy_1_5       TINYINT UNSIGNED NULL,
  note             VARCHAR(200) NULL,                             -- optional
  context_tags_json JSON NULL,
  submitted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source           ENUM('app','web','kiosk') NOT NULL DEFAULT 'app',
  KEY idx_pulse_student_date (org_id, student_id, date),
  KEY idx_pulse_retention (submitted_at)
  -- ⚠️ TTL 365 days → student_id set NULL, row rolled into wb_pulse_aggregate
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wb_pulse_aggregate (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id               BIGINT UNSIGNED NOT NULL,
  class_no             VARCHAR(16) NOT NULL,
  section              VARCHAR(16) NULL,
  date                 DATE NOT NULL,
  mood_distribution_json JSON NOT NULL,
  avg_energy           DECIMAL(3,2) NULL,
  sample_size          INT UNSIGNED NOT NULL,
  computed_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_agg_class_date (org_id, class_no, section, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── JOURNAL ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_journal (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id                BIGINT UNSIGNED NOT NULL,
  student_id            BIGINT UNSIGNED NOT NULL,
  body_encrypted        BLOB NOT NULL,                           -- ⚠️ AES-256-GCM, per-student key
  iv                    VARBINARY(16) NOT NULL,
  auth_tag              VARBINARY(16) NOT NULL,
  mood_tag              VARCHAR(32) NULL,
  shared_with_counsellor TINYINT(1) NOT NULL DEFAULT 0,
  shared_at             DATETIME NULL,
  shared_case_id        BIGINT UNSIGNED NULL,
  word_count            INT UNSIGNED NULL,                       -- engagement metric only
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            DATETIME NULL,                           -- ⚠️ hard delete allowed HERE
  KEY idx_journal_student (org_id, student_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wb_journal_key (
  student_id     BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  key_encrypted  VARBINARY(512) NOT NULL,                        -- wrapped with master/KMS key
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rotated_at     DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ACTIVITIES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_activity (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id         BIGINT UNSIGNED NULL,                           -- NULL = global library
  content_id     VARCHAR(64) NULL,
  type           ENUM('breathe','meditate','journal_prompt','gratitude','movement',
                       'grounding','sleep','focus','reframe') NOT NULL,
  title_json     JSON NOT NULL,
  description_json JSON NULL,
  duration_min   TINYINT UNSIGNED NULL,
  age_band       ENUM('under_13','13_15','16_17','18_plus','all') NOT NULL DEFAULT 'all',
  difficulty     ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  audio_path     VARCHAR(255) NULL,
  script_json    JSON NULL,
  evidence_base  ENUM('CBT','mindfulness','DBT','positive_psych') NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wb_activity_log (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id         BIGINT UNSIGNED NOT NULL,
  student_id     BIGINT UNSIGNED NOT NULL,
  activity_id    BIGINT UNSIGNED NOT NULL,
  started_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at   DATETIME NULL,
  helpful_rating TINYINT UNSIGNED NULL,                          -- 1-5, optional
  KEY idx_actlog_student (org_id, student_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SIGNALS & FLAGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_signal (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id       BIGINT UNSIGNED NOT NULL,
  student_id   BIGINT UNSIGNED NOT NULL,
  source       ENUM('self_raise','pulse_trend','attendance','academic','teacher_concern',
                    'warden_concern','peer_report','counsellor_note','system') NOT NULL,
  signal_type  VARCHAR(64) NOT NULL,
  weight       SMALLINT NOT NULL,
  detail_json  JSON NULL,
  detected_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME NULL,
  KEY idx_signal_student (org_id, student_id, detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wb_flag (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id          BIGINT UNSIGNED NOT NULL,
  student_id      BIGINT UNSIGNED NOT NULL,
  severity        ENUM('green','amber','red') NOT NULL,          -- ⚠️ RED visible ONLY to counsellor
  score           SMALLINT NOT NULL,
  signals_json    JSON NULL,
  primary_driver  VARCHAR(64) NULL,
  status          ENUM('open','acknowledged','in_case','resolved','expired') NOT NULL DEFAULT 'open',
  opened_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at DATETIME NULL,
  acknowledged_by BIGINT UNSIGNED NULL,
  closed_at       DATETIME NULL,
  close_reason    VARCHAR(255) NULL,
  KEY idx_flag_queue (org_id, severity, status, opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CASES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_case (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id             BIGINT UNSIGNED NOT NULL,
  student_id         BIGINT UNSIGNED NOT NULL,
  flag_id            BIGINT UNSIGNED NULL,
  counsellor_id      BIGINT UNSIGNED NULL,
  status             ENUM('new','contacted','in_progress','monitoring','referred','closed','escalated')
                       NOT NULL DEFAULT 'new',
  priority           ENUM('routine','soon','urgent','crisis') NOT NULL DEFAULT 'routine',
  opened_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  first_contact_at   DATETIME NULL,
  sla_due_at         DATETIME NULL,
  sla_met            TINYINT(1) NULL,
  closed_at          DATETIME NULL,
  outcome            ENUM('resolved_internal','referred_external','ongoing_support',
                          'no_action_needed','transferred','student_left') NULL,
  followup_at        DATETIME NULL,
  followup_done_at   DATETIME NULL,
  parent_looped_in_at DATETIME NULL,
  parent_loop_reason VARCHAR(500) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_case_queue (org_id, status, priority, sla_due_at),
  KEY idx_case_counsellor (org_id, counsellor_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wb_session_note (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id         BIGINT UNSIGNED NOT NULL,
  case_id        BIGINT UNSIGNED NOT NULL,
  body_encrypted BLOB NOT NULL,                                  -- ⚠️ AES-256-GCM, counsellor key
  iv             VARBINARY(16) NOT NULL,
  auth_tag       VARBINARY(16) NOT NULL,
  session_type   ENUM('in_person','call','chat','observation','note') NOT NULL,
  duration_min   SMALLINT UNSIGNED NULL,
  counsellor_id  BIGINT UNSIGNED NOT NULL,
  at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_note_case (org_id, case_id, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wb_referral (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id            BIGINT UNSIGNED NOT NULL,
  case_id           BIGINT UNSIGNED NOT NULL,
  student_id        BIGINT UNSIGNED NOT NULL,
  referred_to       ENUM('school_psych','external_therapist','psychiatrist','helpline','ngo','medical')
                      NOT NULL,
  provider_name     VARCHAR(255) NULL,
  provider_contact  VARCHAR(255) NULL,
  reason_encrypted  BLOB NULL,
  parent_informed_at DATETIME NULL,
  parent_consent_at DATETIME NULL,
  referred_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  outcome           VARCHAR(255) NULL,
  KEY idx_referral_case (org_id, case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ANONYMOUS REPORTING ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_bullying_report (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id              BIGINT UNSIGNED NOT NULL,
  reporter_hash       CHAR(64) NULL,                             -- ⚠️ HMAC(student_id + daily_salt), NOT reversible
  reporter_class_hint VARCHAR(32) NULL,                          -- coarse: "Class 9", not "9-A"
  target_hint         VARCHAR(255) NULL,
  description_encrypted BLOB NULL,
  iv                  VARBINARY(16) NULL,
  auth_tag            VARBINARY(16) NULL,
  incident_type       ENUM('verbal','physical','social_exclusion','cyber','extortion',
                           'discrimination','other') NOT NULL,
  location_hint       VARCHAR(128) NULL,
  frequency           VARCHAR(64) NULL,
  status              ENUM('new','reviewing','investigating','action_taken','closed','insufficient_info')
                        NOT NULL DEFAULT 'new',
  assigned_to         BIGINT UNSIGNED NULL,
  reviewed_at         DATETIME NULL,
  action_summary      VARCHAR(1000) NULL,
  follow_up_token     VARCHAR(64) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_report_status (org_id, status, created_at)
  -- ⚠️ NO ip, NO user_agent, NO device_id, NO session link. By design.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── STAFF WELL-BEING ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_staff_check (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id              BIGINT UNSIGNED NOT NULL,
  staff_id            BIGINT UNSIGNED NOT NULL,
  week_start          DATE NOT NULL,
  workload_score      SMALLINT NULL,                             -- from HRMS event, not direct read
  self_rating_1_5     TINYINT UNSIGNED NULL,
  burnout_flag        TINYINT(1) NOT NULL DEFAULT 0,
  burnout_signals_json JSON NULL,
  acknowledged_at     DATETIME NULL,
  UNIQUE KEY uq_staff_week (org_id, staff_id, week_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── AUDIT ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_access_audit (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id       BIGINT UNSIGNED NOT NULL,
  actor_id     BIGINT UNSIGNED NOT NULL,
  actor_role   VARCHAR(32) NOT NULL,
  subject_type ENUM('student','case','journal','flag','report') NOT NULL,
  subject_id   BIGINT UNSIGNED NULL,
  action       ENUM('view','list','export','share','note','close') NOT NULL,
  table_name   VARCHAR(64) NULL,
  reason       VARCHAR(500) NOT NULL,                            -- ⚠️ MANDATORY, min 10 chars (enforced in code)
  ip_hash      CHAR(64) NULL,
  at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_subject (org_id, subject_type, subject_id),
  KEY idx_audit_actor (org_id, actor_id, at)
  -- ⚠️ APPEND-ONLY — enforced by triggers in 0003
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wb_guardrail_violation (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id           BIGINT UNSIGNED NULL,
  actor_id         BIGINT UNSIGNED NULL,
  guardrail        VARCHAR(64) NOT NULL,
  attempted_action VARCHAR(500) NULL,
  query_hash       CHAR(64) NULL,
  blocked_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CRISIS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wb_crisis_event (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  org_id                BIGINT UNSIGNED NOT NULL,
  student_id            BIGINT UNSIGNED NOT NULL,
  trigger_source        ENUM('keyword','self_report','teacher_report','peer_report',
                            'counsellor_assessment') NOT NULL,
  trigger_detail_encrypted BLOB NULL,
  iv                    VARBINARY(16) NULL,
  auth_tag              VARBINARY(16) NULL,
  severity              ENUM('concern','urgent','emergency') NOT NULL,
  flag_id               BIGINT UNSIGNED NULL,
  case_id               BIGINT UNSIGNED NULL,
  responded_at          DATETIME NULL,
  responded_by          BIGINT UNSIGNED NULL,
  actions_taken_json    JSON NULL,
  consent_overridden    TINYINT(1) NOT NULL DEFAULT 0,
  override_reason       VARCHAR(500) NULL,
  resolved_at           DATETIME NULL,
  outcome               VARCHAR(255) NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_crisis_student (org_id, student_id, created_at)
  -- ⚠️ Most sensitive table. Counsellor + platform_owner only (enforced in code).
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
