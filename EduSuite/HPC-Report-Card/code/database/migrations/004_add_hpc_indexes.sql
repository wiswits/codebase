CREATE INDEX idx_hpc_competencies_org
ON client_hpc_competencies(org_id);

CREATE INDEX idx_hpc_competencies_domain
ON client_hpc_competencies(domain_code);

CREATE INDEX idx_hpc_competencies_active
ON client_hpc_competencies(is_active);

CREATE INDEX idx_hpc_competencies_display
ON client_hpc_competencies(display_order);

-- ============================================================
-- client_hpc_entries
-- ============================================================

CREATE INDEX idx_hpc_entries_org
ON client_hpc_entries(org_id);

CREATE INDEX idx_hpc_entries_student
ON client_hpc_entries(student_id);

CREATE INDEX idx_hpc_entries_cycle
ON client_hpc_entries(academic_cycle_id);

CREATE INDEX idx_hpc_entries_competency
ON client_hpc_entries(competency_id);

CREATE INDEX idx_hpc_entries_status
ON client_hpc_entries(status);

CREATE INDEX idx_hpc_entries_evaluator
ON client_hpc_entries(evaluator_id);

CREATE INDEX idx_hpc_entries_created
ON client_hpc_entries(created_at);

-- ============================================================
-- client_hpc_cards
-- ============================================================

CREATE INDEX idx_hpc_cards_org
ON client_hpc_cards(org_id);

CREATE INDEX idx_hpc_cards_student
ON client_hpc_cards(student_id);

CREATE INDEX idx_hpc_cards_cycle
ON client_hpc_cards(academic_cycle_id);

CREATE INDEX idx_hpc_cards_status
ON client_hpc_cards(status);

CREATE INDEX idx_hpc_cards_finalized
ON client_hpc_cards(finalized_at);