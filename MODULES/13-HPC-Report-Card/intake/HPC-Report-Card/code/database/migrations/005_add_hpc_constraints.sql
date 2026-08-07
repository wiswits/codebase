ALTER TABLE client_hpc_entries
ADD CONSTRAINT uq_hpc_entry
UNIQUE (
    org_id,
    student_id,
    academic_cycle_id,
    competency_id
);

-- ============================================================
-- One finalized card per student per academic cycle
-- ============================================================

ALTER TABLE client_hpc_cards
ADD CONSTRAINT uq_hpc_card
UNIQUE (
    org_id,
    student_id,
    academic_cycle_id
);

-- ============================================================
-- Basic data validation
-- ============================================================

ALTER TABLE client_hpc_competencies
ADD CONSTRAINT chk_display_order
CHECK (display_order > 0);

ALTER TABLE client_hpc_entries
ADD CONSTRAINT chk_entry_value
CHECK (CHAR_LENGTH(entry_value) > 0);

ALTER TABLE client_hpc_cards
ADD CONSTRAINT chk_snapshot
CHECK (CHAR_LENGTH(snapshot_json) > 2);