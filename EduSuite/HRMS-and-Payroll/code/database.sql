-- ============================================================
-- DATABASE: hrms_db
-- ============================================================

USE hrms_db;

-- ============================================================
-- 1. EMPLOYEES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  employee_code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  date_of_joining DATE NOT NULL,
  designation VARCHAR(120) NULL,
  department VARCHAR(100) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uq_employee_code (employee_code)
);

-- ============================================================
-- 2. EMPLOYEE DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  employee_id BIGINT UNSIGNED NOT NULL,
  doc_type ENUM('OFFER_LETTER','AGREEMENT','KYC','QUALIFICATION','CERTIFICATION','OTHER') NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_docs_org_emp (org_id, employee_id, deleted_at)
);

-- ============================================================
-- 3. EMPLOYEE QUALIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_qualifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  employee_id BIGINT UNSIGNED NOT NULL,
  qualification VARCHAR(200) NOT NULL,
  institution VARCHAR(200) NULL,
  issued_on DATE NULL,
  expires_on DATE NULL,
  document_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_qual_expiry (org_id, expires_on, deleted_at)
);

-- ============================================================
-- 4. LEAVE TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_types (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  accrual_per_month DECIMAL(5,2) NOT NULL DEFAULT 0,
  annual_cap DECIMAL(5,2) NULL,
  carry_forward_cap DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uq_lt_org_code (org_id, code)
);

-- ============================================================
-- 5. LEAVE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  employee_id BIGINT UNSIGNED NOT NULL,
  leave_type_id BIGINT UNSIGNED NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days DECIMAL(5,2) NOT NULL,
  reason TEXT NULL,
  status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_lr_org_emp (org_id, employee_id, status),
  INDEX idx_lr_dates (org_id, from_date, to_date)
);

-- ============================================================
-- 6. CPD RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cpd_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  employee_id BIGINT UNSIGNED NOT NULL,
  fy CHAR(7) NOT NULL,
  title VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NULL,
  activity_date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  status ENUM('SUBMITTED','VERIFIED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  verified_by BIGINT UNSIGNED NULL,
  verified_at DATETIME(3) NULL,
  reject_reason TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_cpd (org_id, employee_id, fy, status)
);

-- ============================================================
-- 7. APPRAISAL CYCLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appraisal_cycles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  name VARCHAR(150) NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  status ENUM('DRAFT','OPEN','REVIEW','CLOSED') NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL
);

-- ============================================================
-- 8. APPRAISALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appraisals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  cycle_id BIGINT UNSIGNED NOT NULL,
  employee_id BIGINT UNSIGNED NOT NULL,
  appraiser_id BIGINT UNSIGNED NOT NULL,
  self_rating DECIMAL(4,2) NULL,
  manager_rating DECIMAL(4,2) NULL,
  final_rating DECIMAL(4,2) NULL,
  status ENUM('PENDING_SELF','PENDING_MANAGER','COMPLETED') NOT NULL DEFAULT 'PENDING_SELF',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uq_appraisal (org_id, cycle_id, employee_id)
);

-- ============================================================
-- 9. APPRAISAL KRAS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appraisal_kras (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  appraisal_id BIGINT UNSIGNED NOT NULL,
  kra_title VARCHAR(255) NOT NULL,
  weightage_pct DECIMAL(5,2) NOT NULL,
  target TEXT NULL,
  achievement TEXT NULL,
  score DECIMAL(4,2) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_kra (org_id, appraisal_id)
);

-- ============================================================
-- 10. EXITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  employee_id BIGINT UNSIGNED NOT NULL,
  resignation_date DATE NOT NULL,
  notice_days_required SMALLINT UNSIGNED NOT NULL,
  last_working_day DATE NULL,
  exit_type ENUM('RESIGNATION','TERMINATION','RETIREMENT','DEATH','ABSCONDING') NOT NULL,
  reason TEXT NULL,
  status ENUM('INITIATED','APPROVED','CLEARANCE','SETTLED') NOT NULL DEFAULT 'INITIATED',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_exit (org_id, employee_id, status)
);

-- ============================================================
-- 11. FNF SETTLEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fnf_settlements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  exit_id BIGINT UNSIGNED NOT NULL,
  final_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  gratuity_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  leave_encashment DECIMAL(12,2) NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notice_recovery DECIMAL(12,2) NOT NULL DEFAULT 0,
  loan_recovery DECIMAL(12,2) NOT NULL DEFAULT 0,
  asset_recovery DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_settlement DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('DRAFT','APPROVED','PAID') NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uq_fnf (org_id, exit_id)
);

-- ============================================================
-- 12. SALARY COMPONENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_components (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  type ENUM('EARNING','DEDUCTION','EMPLOYER_CONTRIB') NOT NULL,
  is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uq_comp_org_code (org_id, code)
);

-- ============================================================
-- 13. EMPLOYEE SALARY STRUCTURES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_salary_structures (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  employee_id BIGINT UNSIGNED NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  ctc_annual DECIMAL(12,2) NOT NULL,
  gross_monthly DECIMAL(12,2) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_ess_lookup (org_id, employee_id, effective_from, effective_to)
);

-- ============================================================
-- 14. SALARY STRUCTURE COMPONENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_structure_components (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  structure_id BIGINT UNSIGNED NOT NULL,
  component_id BIGINT UNSIGNED NOT NULL,
  amount_monthly DECIMAL(12,2) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uq_ssc (org_id, structure_id, component_id)
);

-- ============================================================
-- 15. PAYROLL RUNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  period_month TINYINT UNSIGNED NOT NULL,
  period_year SMALLINT UNSIGNED NOT NULL,
  run_type ENUM('REGULAR','OFF_CYCLE','FNF','BONUS') NOT NULL DEFAULT 'REGULAR',
  status ENUM('DRAFT','LOCKED','APPROVED','PAID','REVERSED','DISCARDED') NOT NULL DEFAULT 'DRAFT',
  employee_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_gross DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_net DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  UNIQUE KEY uq_run_period (org_id, period_year, period_month, run_type)
);

-- ============================================================
-- 16. LEAVE TYPES DATA
-- ============================================================
INSERT IGNORE INTO leave_types (org_id, code, name, accrual_per_month, annual_cap, carry_forward_cap, is_paid) VALUES
(1, 'CL', 'Casual Leave', 1.0, 12, 3, TRUE),
(1, 'EL', 'Earned Leave', 1.5, 18, 6, TRUE),
(1, 'SL', 'Sick Leave', 1.0, 12, 3, TRUE),
(1, 'ML', 'Maternity Leave', 0, 26, 0, TRUE),
(1, 'COMP_OFF', 'Compensatory Off', 0, 10, 0, TRUE);

-- ============================================================
-- 17. SALARY COMPONENTS DATA
-- ============================================================
INSERT IGNORE INTO salary_components (org_id, code, name, type, is_taxable, display_order) VALUES
(1, 'BASIC', 'Basic Salary', 'EARNING', TRUE, 1),
(1, 'HRA', 'House Rent Allowance', 'EARNING', TRUE, 2),
(1, 'CONV', 'Conveyance Allowance', 'EARNING', FALSE, 3),
(1, 'SPECIAL', 'Special Allowance', 'EARNING', TRUE, 4),
(1, 'PF_EE', 'Provident Fund (Employee)', 'DEDUCTION', FALSE, 5),
(1, 'PF_ER', 'Provident Fund (Employer)', 'EMPLOYER_CONTRIB', FALSE, 6),
(1, 'ESI_EE', 'ESI (Employee)', 'DEDUCTION', FALSE, 7),
(1, 'ESI_ER', 'ESI (Employer)', 'EMPLOYER_CONTRIB', FALSE, 8),
(1, 'PT', 'Professional Tax', 'DEDUCTION', FALSE, 9),
(1, 'TDS', 'TDS', 'DEDUCTION', FALSE, 10);

-- ============================================================
-- 18. SHOW TABLES (CHECK)
-- ============================================================
SHOW TABLES;