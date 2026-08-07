START TRANSACTION;

-- ============================================================
-- Competencies
-- ============================================================

INSERT INTO client_hpc_competencies
(
    org_id,
    domain_code,
    domain_name,
    competency_code,
    competency_name,
    descriptor_text,
    display_order,
    is_active
)
VALUES

(1,'COM','Communication','COM001','Active Listening',
'Listens attentively during classroom activities.',
1,TRUE),

(1,'COM','Communication','COM002','Public Speaking',
'Speaks confidently in classroom discussions.',
2,TRUE),

(1,'CRT','Critical Thinking','CRT001','Problem Solving',
'Applies logical reasoning to solve problems.',
3,TRUE),

(1,'CRT','Critical Thinking','CRT002','Decision Making',
'Makes informed and responsible decisions.',
4,TRUE),

(1,'LDR','Leadership','LDR001','Team Collaboration',
'Works effectively within a team.',
5,TRUE),

(1,'LDR','Leadership','LDR002','Initiative',
'Takes initiative without constant supervision.',
6,TRUE);

-- ============================================================
-- Sample Student Entries
-- ============================================================

INSERT INTO client_hpc_entries
(
    org_id,
    student_id,
    academic_cycle_id,
    competency_id,
    entry_value,
    remarks,
    evaluator_id,
    status
)
VALUES

(1,101,2026,1,'A','Excellent listener.',5001,'READY_FOR_REVIEW'),

(1,101,2026,2,'B+','Improving communication skills.',5001,'READY_FOR_REVIEW'),

(1,101,2026,3,'A','Strong analytical thinking.',5001,'READY_FOR_REVIEW'),

(1,101,2026,4,'A','Makes good decisions.',5001,'READY_FOR_REVIEW');

-- ============================================================
-- Finalized Sample Card
-- ============================================================

INSERT INTO client_hpc_cards
(
    org_id,
    student_id,
    academic_cycle_id,
    status,
    snapshot_json,
    finalized_by
)
VALUES
(
    1,
    101,
    2026,
    'FINALIZED',
    '{
        "student":"101",
        "cycle":"2026",
        "overall":"Excellent",
        "status":"FINALIZED"
    }',
    9001
);

COMMIT;

SELECT 'Development seed inserted successfully.' AS Status;