CREATE DATABASE IF NOT EXISTS wiswits_hpc;
USE wiswits_hpc;

-- ============================================================
-- HPC COMPETENCIES
-- ============================================================

CREATE TABLE client_hpc_competencies (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    org_id BIGINT NOT NULL,

    domain_code VARCHAR(50) NOT NULL,

    domain_name VARCHAR(150) NOT NULL,

    competency_code VARCHAR(50) NOT NULL,

    competency_name VARCHAR(255) NOT NULL,

    descriptor_text TEXT,

    display_order INT DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_competency (
        org_id,
        competency_code
    )

);

-- ============================================================
-- HPC ENTRIES
-- ============================================================

CREATE TABLE client_hpc_entries (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    org_id BIGINT NOT NULL,

    student_id BIGINT NOT NULL,

    academic_cycle_id BIGINT NOT NULL,

    competency_id BIGINT NOT NULL,

    evaluator_id BIGINT,

    entry_value VARCHAR(100),

    remarks TEXT,

    status ENUM(

        'DRAFT',
        'IN_PROGRESS',
        'READY_FOR_REVIEW',
        'FINALIZED'

    ) DEFAULT 'DRAFT',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_entry_competency

        FOREIGN KEY (competency_id)

        REFERENCES client_hpc_competencies(id)

        ON DELETE CASCADE,

    UNIQUE KEY uk_entry (

        org_id,
        student_id,
        academic_cycle_id,
        competency_id

    )

);

-- ============================================================
-- HPC FINALIZED CARDS
-- ============================================================

CREATE TABLE client_hpc_cards (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    org_id BIGINT NOT NULL,

    student_id BIGINT NOT NULL,

    academic_cycle_id BIGINT NOT NULL,

    status ENUM(

        'FINALIZED'

    ) DEFAULT 'FINALIZED',

    snapshot_json LONGTEXT NOT NULL,

    finalized_by BIGINT,

    finalized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_card (

        org_id,
        student_id,
        academic_cycle_id

    )

);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_competency_org
ON client_hpc_competencies(org_id);

CREATE INDEX idx_entry_student
ON client_hpc_entries(

    org_id,
    student_id

);

CREATE INDEX idx_entry_cycle
ON client_hpc_entries(

    academic_cycle_id

);

CREATE INDEX idx_entry_status
ON client_hpc_entries(

    status

);

CREATE INDEX idx_card_student
ON client_hpc_cards(

    org_id,
    student_id

);

CREATE INDEX idx_card_finalized
ON client_hpc_cards(

    finalized_at

);