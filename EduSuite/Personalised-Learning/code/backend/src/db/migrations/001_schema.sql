-- ═══════════════════════════════════════════════════════════════
-- WISWITS APEX OS — Personalized Learning Module (`pl`)
-- Migration 001 — The 24 tables (Blocks A–F)
--
-- Conventions:
--   • Every client-owned table starts with `client_pl_`.
--   • Every table carries org_id (multi-tenant). No query without org_id.
--   • Audit = created_by, created_at, updated_at, deleted_at (soft delete).
--   • wiswits_id (curriculum address, e.g. MATH10C01T02) is denormalized
--     onto hot tables for fast analytics.
--
-- ⚠️ TYPE CONVENTION (verified against the live platform schema):
--   • Own PK `id`                       → BIGINT UNSIGNED (responses grow huge).
--   • References to PLATFORM tables      → INT — matches client_students.id,
--     (org_id, student_id, subject_id,     client_organizations.id, client_subjects.id,
--      question_id, user-id-like *_by)     client_qb_questions.id (all INT(11)).
--   • References to OUR OWN tables        → BIGINT UNSIGNED (match our PKs).
--   • NO hard FK constraints to platform tables — the module stays decoupled
--     (CONTRACT: talk to other modules via API, not the DB).
-- ⚠️ RULE 20: this module NEVER references client_student_moods / wb_* tables.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- BLOCK A — ASSESSMENT CREATION
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_pl_blueprint (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id                  INT NOT NULL,
  name                    VARCHAR(200) NOT NULL,
  subject_id              INT NOT NULL,
  class_no                TINYINT UNSIGNED NOT NULL,
  chapter_weightage_json  JSON NULL,
  bloom_distribution_json JSON NULL,
  difficulty_mix_json     JSON NULL,
  type_mix_json           JSON NULL,
  total_marks             INT UNSIGNED NOT NULL DEFAULT 0,
  total_questions         INT UNSIGNED NOT NULL DEFAULT 0,
  duration_min            INT UNSIGNED NOT NULL DEFAULT 0,
  is_locked               TINYINT(1) NOT NULL DEFAULT 0,
  created_by              INT NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at              DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_bp_org_subject (org_id, subject_id, class_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_test (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id            INT NOT NULL,
  title             VARCHAR(255) NOT NULL,
  description       TEXT NULL,
  subject_id        INT NOT NULL,
  class_no          TINYINT UNSIGNED NOT NULL,
  stream            VARCHAR(32) NOT NULL DEFAULT 'none',
  type              ENUM('diagnostic','practice','unit','chapter','revision','recovery','mock','remedial') NOT NULL DEFAULT 'unit',
  source            ENUM('qbank','manual','blueprint','offline','omr','imported') NOT NULL DEFAULT 'qbank',
  mode              ENUM('online','offline','hybrid') NOT NULL DEFAULT 'online',
  total_marks       INT UNSIGNED NOT NULL DEFAULT 0,
  total_questions   INT UNSIGNED NOT NULL DEFAULT 0,
  duration_min      INT UNSIGNED NOT NULL DEFAULT 0,
  negative_marking  TINYINT(1) NOT NULL DEFAULT 0,
  negative_ratio    DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  blueprint_id      BIGINT UNSIGNED NULL,
  blueprint_json    JSON NULL,
  instructions_json JSON NULL,
  status            ENUM('draft','ready','published','closed','archived') NOT NULL DEFAULT 'draft',
  is_template       TINYINT(1) NOT NULL DEFAULT 0,
  template_of_id    BIGINT UNSIGNED NULL,
  created_by        INT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_test_org_subject (org_id, subject_id, class_no, status),
  KEY idx_test_org_status (org_id, status),
  KEY idx_test_blueprint (blueprint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_test_question (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id                 INT NOT NULL,
  test_id                BIGINT UNSIGNED NOT NULL,
  seq                    INT UNSIGNED NOT NULL,
  question_id            INT NULL,                      -- QBank reference
  wiswits_id             VARCHAR(24) NOT NULL,          -- denormalized address
  bloom                  VARCHAR(16) NULL,
  difficulty             VARCHAR(16) NULL,
  est_time_sec           INT UNSIGNED NULL,
  marks                  DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  negative_marks         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  question_snapshot_json JSON NOT NULL,                 -- ⚠️ FROZEN at test creation
  section_name           VARCHAR(64) NULL,
  is_optional            TINYINT(1) NOT NULL DEFAULT 0,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_seq (test_id, seq),
  KEY idx_tq_org_test (org_id, test_id),
  KEY idx_tq_wiswits (org_id, wiswits_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_question_map (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      INT NOT NULL,
  test_id     BIGINT UNSIGNED NOT NULL,
  paper_q_no  INT UNSIGNED NOT NULL,
  wiswits_id  VARCHAR(24) NOT NULL,
  bloom       VARCHAR(16) NULL,
  difficulty  VARCHAR(16) NULL,
  marks       DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  question_id INT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_map_test_q (test_id, paper_q_no),
  KEY idx_qmap_org_test (org_id, test_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- BLOCK B — ASSIGNMENT & DELIVERY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_pl_assignment (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id               INT NOT NULL,
  test_id              BIGINT UNSIGNED NOT NULL,
  target_type          ENUM('class','section','students','auto_group','batch') NOT NULL,
  target_json          JSON NULL,
  auto_group_rule_json JSON NULL,
  opens_at             DATETIME NULL,
  closes_at            DATETIME NULL,
  attempts_allowed     INT UNSIGNED NOT NULL DEFAULT 1,
  time_limit_min       INT UNSIGNED NULL,
  shuffle_questions    TINYINT(1) NOT NULL DEFAULT 0,
  shuffle_options      TINYINT(1) NOT NULL DEFAULT 0,
  show_solution        ENUM('never','after_submit','after_close','always') NOT NULL DEFAULT 'after_close',
  show_score           ENUM('never','after_submit','after_close') NOT NULL DEFAULT 'after_submit',
  allow_review         TINYINT(1) NOT NULL DEFAULT 1,
  allow_back           TINYINT(1) NOT NULL DEFAULT 1,
  proctoring_json      JSON NULL,
  mode                 ENUM('test','practice') NOT NULL DEFAULT 'test',
  status               ENUM('draft','scheduled','open','closed','archived') NOT NULL DEFAULT 'draft',
  created_by           INT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at           DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_asg_org_test (org_id, test_id),
  KEY idx_asg_org_status (org_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_assignment_student (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id        INT NOT NULL,
  assignment_id BIGINT UNSIGNED NOT NULL,
  student_id    INT NOT NULL,
  status        ENUM('assigned','started','submitted','evaluated','absent','excused') NOT NULL DEFAULT 'assigned',
  assigned_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asg_student (assignment_id, student_id),
  KEY idx_asgstu_org_student (org_id, student_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- BLOCK C — ATTEMPT & RESPONSE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_pl_attempt (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id           INT NOT NULL,
  assignment_id    BIGINT UNSIGNED NULL,
  test_id          BIGINT UNSIGNED NOT NULL,
  student_id       INT NOT NULL,
  attempt_no       INT UNSIGNED NOT NULL DEFAULT 1,
  started_at       DATETIME NULL,
  submitted_at     DATETIME NULL,
  evaluated_at     DATETIME NULL,
  score            DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  max_score        DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  percentage       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  correct_count    INT UNSIGNED NOT NULL DEFAULT 0,
  wrong_count      INT UNSIGNED NOT NULL DEFAULT 0,
  skipped_count    INT UNSIGNED NOT NULL DEFAULT 0,
  time_taken_sec   INT UNSIGNED NOT NULL DEFAULT 0,
  time_efficiency  DECIMAL(5,2) NULL,               -- actual/expected
  status           ENUM('in_progress','submitted','auto_submitted','evaluated','absent') NOT NULL DEFAULT 'in_progress',
  submit_reason    ENUM('manual','timeout','proctor','admin') NULL,
  device_json      JSON NULL,
  ip               VARCHAR(64) NULL,
  tab_switches     INT UNSIGNED NOT NULL DEFAULT 0,
  fullscreen_exits INT UNSIGNED NOT NULL DEFAULT 0,
  is_offline_entry TINYINT(1) NOT NULL DEFAULT 0,   -- paper test marks entry
  entered_by       INT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_att_org_student (org_id, student_id, test_id),
  KEY idx_att_org_test (org_id, test_id, status),
  KEY idx_att_assignment (assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ⭐⭐ THE RICHEST TABLE — every column earns its place (see spec 2.2)
CREATE TABLE IF NOT EXISTS client_pl_response (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id           INT NOT NULL,
  attempt_id       BIGINT UNSIGNED NOT NULL,
  test_question_id BIGINT UNSIGNED NOT NULL,
  question_id      INT NULL,
  wiswits_id       VARCHAR(24) NOT NULL,
  bloom            VARCHAR(16) NULL,
  difficulty       VARCHAR(16) NULL,
  answer_json      JSON NULL,                       -- {"selected":"B"} | {"value":42} | {"text":"..."}
  is_correct       TINYINT(1) NULL,
  marks_awarded    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  is_partial       TINYINT(1) NOT NULL DEFAULT 0,
  time_sec         INT UNSIGNED NULL,               -- ⭐ time on this question
  time_ratio       DECIMAL(6,3) NULL,               -- ⭐ time_sec / est_time_sec
  visits           INT UNSIGNED NOT NULL DEFAULT 0, -- ⭐ confusion indicator
  changed_count    INT UNSIGNED NOT NULL DEFAULT 0, -- ⭐ doubt indicator
  first_answer     VARCHAR(255) NULL,               -- ⭐⭐ instinct
  final_answer     VARCHAR(255) NULL,               -- ⭐⭐ overthinking signal
  marked_review    TINYINT(1) NOT NULL DEFAULT 0,
  answered_at      DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_resp_attempt_q (attempt_id, test_question_id),
  KEY idx_resp_org_wiswits (org_id, wiswits_id),
  KEY idx_resp_attempt (attempt_id),
  KEY idx_resp_question (org_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_attempt_event (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      INT NOT NULL,
  attempt_id  BIGINT UNSIGNED NOT NULL,
  question_id INT NULL,
  event       ENUM('view','answer','change','review','skip','back','blur','focus') NOT NULL,
  at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  meta_json   JSON NULL,
  PRIMARY KEY (id),
  KEY idx_evt_org_attempt (org_id, attempt_id, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- BLOCK D — ANALYSIS LAYER
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_pl_topic_score (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id           INT NOT NULL,
  student_id       INT NOT NULL,
  wiswits_id       VARCHAR(24) NOT NULL,
  subject_id       INT NOT NULL,
  attempted        INT UNSIGNED NOT NULL DEFAULT 0,
  correct          INT UNSIGNED NOT NULL DEFAULT 0,
  skipped          INT UNSIGNED NOT NULL DEFAULT 0,
  accuracy         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  avg_time_sec     DECIMAL(7,2) NULL,
  avg_time_ratio   DECIMAL(6,3) NULL,
  easy_acc         DECIMAL(5,2) NULL,
  medium_acc       DECIMAL(5,2) NULL,
  hard_acc         DECIMAL(5,2) NULL,
  variance         DECIMAL(7,3) NULL,
  first_attempt_at DATETIME NULL,
  last_attempt_at  DATETIME NULL,
  sample_size      INT UNSIGNED NOT NULL DEFAULT 0,
  trend            ENUM('improving','stable','declining') NULL,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_topic_student (org_id, student_id, wiswits_id),
  KEY idx_ts_org_wiswits (org_id, wiswits_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_bloom_score (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id         INT NOT NULL,
  student_id     INT NOT NULL,
  subject_id     INT NOT NULL,
  bloom          VARCHAR(16) NOT NULL,
  attempted      INT UNSIGNED NOT NULL DEFAULT 0,
  correct        INT UNSIGNED NOT NULL DEFAULT 0,
  accuracy       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  avg_time_ratio DECIMAL(6,3) NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bloom_student (org_id, student_id, subject_id, bloom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_skill_score (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id     INT NOT NULL,
  student_id INT NOT NULL,
  skill_tag  VARCHAR(64) NOT NULL,
  attempted  INT UNSIGNED NOT NULL DEFAULT 0,
  correct    INT UNSIGNED NOT NULL DEFAULT 0,
  accuracy   DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skill_student (org_id, student_id, skill_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ⭐⭐ THE CORE OUTPUT
CREATE TABLE IF NOT EXISTS client_pl_weak_area (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id              INT NOT NULL,
  student_id          INT NOT NULL,
  wiswits_id          VARCHAR(24) NOT NULL,
  subject_id          INT NOT NULL,
  severity            ENUM('critical','weak','borderline','strong','mastered') NOT NULL,
  accuracy            DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  sample_size         INT UNSIGNED NOT NULL DEFAULT 0,
  confidence          DECIMAL(4,3) NOT NULL DEFAULT 0.000,
  is_root_cause       TINYINT(1) NOT NULL DEFAULT 0,
  root_wiswits_id     VARCHAR(24) NULL,
  depth_from_root     INT UNSIGNED NOT NULL DEFAULT 0,
  dominant_error_type VARCHAR(48) NULL,
  dominant_bloom_gap  VARCHAR(16) NULL,
  detected_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status              ENUM('open','in_recovery','retesting','closed','decayed','overridden','escalated') NOT NULL DEFAULT 'open',
  closed_at           DATETIME NULL,
  override_by         INT NULL,
  override_reason     VARCHAR(255) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_weak_student_topic (org_id, student_id, wiswits_id),
  KEY idx_wa_org_student (org_id, student_id, status),
  KEY idx_wa_org_severity (org_id, severity, status),
  KEY idx_wa_root (org_id, root_wiswits_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_profile (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id               INT NOT NULL,
  student_id           INT NOT NULL,
  subject_id           INT NOT NULL,
  pace                 ENUM('fast','moderate','needs_time') NULL,
  behaviour            ENUM('rusher','overthinker','balanced','gives_up','erratic') NULL,
  consistency_score    DECIMAL(5,2) NULL,
  improvement_trend    DECIMAL(6,3) NULL,
  preferred_difficulty VARCHAR(16) NULL,
  bloom_profile_json   JSON NULL,
  strengths_json       JSON NULL,
  gaps_json            JSON NULL,
  error_signature_json JSON NULL,
  silly_mistake_rate   DECIMAL(5,2) NULL,
  concept_gap_rate     DECIMAL(5,2) NULL,
  guess_rate           DECIMAL(5,2) NULL,
  revision_rate        DECIMAL(5,2) NULL,
  coaching_note        TEXT NULL,
  computed_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profile_student_subject (org_id, student_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- BLOCK E — RECOVERY LAYER
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_pl_worksheet (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id                  INT NOT NULL,
  student_id              INT NOT NULL,
  target_wiswits_ids_json JSON NOT NULL,
  strategy                ENUM('root_first','symptom','mixed','revision','challenge','confidence_build') NOT NULL DEFAULT 'mixed',
  question_ids_json       JSON NULL,
  difficulty_ladder_json  JSON NULL,
  total_questions         INT UNSIGNED NOT NULL DEFAULT 0,
  est_time_min            INT UNSIGNED NOT NULL DEFAULT 0,
  pdf_path                VARCHAR(512) NULL,
  pdf_with_solutions_path VARCHAR(512) NULL,
  generated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by            INT NULL,
  generation_reason       TEXT NULL,
  assigned_at             DATETIME NULL,
  attempted_at            DATETIME NULL,
  attempt_id              BIGINT UNSIGNED NULL,
  score                   DECIMAL(5,2) NULL,
  status                  ENUM('generated','edited','assigned','attempted','reviewed','expired') NOT NULL DEFAULT 'generated',
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ws_org_student (org_id, student_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ⭐⭐⭐ THE LOOP TABLE — THE PROOF
CREATE TABLE IF NOT EXISTS client_pl_recovery_cycle (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id                 INT NOT NULL,
  student_id             INT NOT NULL,
  weak_area_id           BIGINT UNSIGNED NOT NULL,
  wiswits_id             VARCHAR(24) NOT NULL,
  cycle_no               INT UNSIGNED NOT NULL DEFAULT 1,
  detected_at            DATETIME NOT NULL,
  detected_accuracy      DECIMAL(5,2) NOT NULL,
  worksheet_id           BIGINT UNSIGNED NULL,
  worksheet_score        DECIMAL(5,2) NULL,
  worksheet_attempted_at DATETIME NULL,
  retest_attempt_id      BIGINT UNSIGNED NULL,
  retest_accuracy        DECIMAL(5,2) NULL,
  retest_at              DATETIME NULL,
  delta                  DECIMAL(6,2) NULL,
  outcome                ENUM('improved','no_change','worsened','closed','abandoned','coaching_instead') NULL,
  days_to_close          INT UNSIGNED NULL,
  closed_at              DATETIME NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rc_org_student (org_id, student_id),
  KEY idx_rc_weak_area (org_id, weak_area_id),
  KEY idx_rc_org_outcome (org_id, outcome, detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_practice_card (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id           INT NOT NULL,
  student_id       INT NOT NULL,
  question_id      INT NOT NULL,
  wiswits_id       VARCHAR(24) NOT NULL,
  ease_factor      DECIMAL(4,3) NOT NULL DEFAULT 2.500,
  interval_days    INT UNSIGNED NOT NULL DEFAULT 0,
  repetitions      INT UNSIGNED NOT NULL DEFAULT 0,
  due_at           DATETIME NULL,
  last_result      TINYINT(1) NULL,
  last_reviewed_at DATETIME NULL,
  lapses           INT UNSIGNED NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_card_student_q (org_id, student_id, question_id),
  KEY idx_card_due (org_id, student_id, due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ═══════════════════════════════════════════════════════════════
-- BLOCK F — INSIGHTS LAYER
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_pl_question_stat (
  id                         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id                     INT NOT NULL,
  question_id                INT NOT NULL,
  wiswits_id                 VARCHAR(24) NOT NULL,
  attempts                   INT UNSIGNED NOT NULL DEFAULT 0,
  correct                    INT UNSIGNED NOT NULL DEFAULT 0,
  p_value                    DECIMAL(5,4) NULL,
  discrimination_index       DECIMAL(5,4) NULL,
  point_biserial             DECIMAL(5,4) NULL,
  avg_time_sec               DECIMAL(7,2) NULL,
  avg_time_ratio             DECIMAL(6,3) NULL,
  distractor_json            JSON NULL,
  distractor_efficiency_json JSON NULL,
  flag                       ENUM('none','too_easy','too_hard','ambiguous','bad_distractor','non_discriminating','key_error') NOT NULL DEFAULT 'none',
  flag_reason                VARCHAR(255) NULL,
  updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qstat_org_q (org_id, question_id),
  KEY idx_qstat_flag (org_id, flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_class_insight (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id                   INT NOT NULL,
  test_id                  BIGINT UNSIGNED NOT NULL,
  class_no                 TINYINT UNSIGNED NULL,
  section                  VARCHAR(16) NULL,
  attempted_count          INT UNSIGNED NOT NULL DEFAULT 0,
  avg_score                DECIMAL(5,2) NULL,
  median_score             DECIMAL(5,2) NULL,
  std_dev                  DECIMAL(6,2) NULL,
  topper_score             DECIMAL(5,2) NULL,
  lowest_score             DECIMAL(5,2) NULL,
  weak_questions_json      JSON NULL,
  weak_topics_json         JSON NULL,
  distractor_insights_json JSON NULL,
  bloom_health_json        JSON NULL,
  time_health_json         JSON NULL,
  computed_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ci_org_test (org_id, test_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_alert (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id       INT NOT NULL,
  type         VARCHAR(48) NOT NULL,
  severity     ENUM('info','low','medium','high','critical') NOT NULL DEFAULT 'info',
  target_role  ENUM('student','teacher','parent','principal','admin') NULL,
  target_id    INT NULL,
  subject_type ENUM('student','question','topic','class') NULL,
  subject_id   INT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT NULL,
  action_json  JSON NULL,
  payload_json JSON NULL,
  status       ENUM('new','read','actioned','dismissed') NOT NULL DEFAULT 'new',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      DATETIME NULL,
  actioned_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_alert_org_role (org_id, target_role, status),
  KEY idx_alert_org_type (org_id, type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_digest (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id       INT NOT NULL,
  student_id   INT NOT NULL,
  parent_id    INT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  payload_json JSON NULL,
  channel      ENUM('email','whatsapp','app') NOT NULL DEFAULT 'app',
  sent_at      DATETIME NULL,
  opened_at    DATETIME NULL,
  clicked_at   DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_digest_org_student (org_id, student_id, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS client_pl_benchmark (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id          INT NOT NULL,
  scope           ENUM('class','section','school','batch') NOT NULL,
  scope_id        VARCHAR(64) NOT NULL,
  wiswits_id      VARCHAR(24) NULL,
  subject_id      INT NULL,
  test_id         BIGINT UNSIGNED NULL,
  avg_accuracy    DECIMAL(5,2) NULL,
  median_accuracy DECIMAL(5,2) NULL,
  topper_accuracy DECIMAL(5,2) NULL,
  p90             DECIMAL(5,2) NULL,
  p75             DECIMAL(5,2) NULL,
  p50             DECIMAL(5,2) NULL,
  p25             DECIMAL(5,2) NULL,
  sample_size     INT UNSIGNED NOT NULL DEFAULT 0,
  computed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bm_scope (org_id, scope, scope_id, test_id),
  KEY idx_bm_wiswits (org_id, wiswits_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
