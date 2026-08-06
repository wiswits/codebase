CREATE TABLE IF NOT EXISTS client_hpc_entries (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,

    student_id BIGINT UNSIGNED NOT NULL,

    academic_cycle_id BIGINT UNSIGNED NOT NULL,

    competency_id BIGINT UNSIGNED NOT NULL,

    entry_value VARCHAR(50) NOT NULL,

    remarks TEXT NULL,

    evaluator_id BIGINT UNSIGNED NOT NULL,

    status ENUM(
        'DRAFT',
        'IN_PROGRESS',
        'READY_FOR_REVIEW'
    ) NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_hpc_entry_competency
        FOREIGN KEY (competency_id)
        REFERENCES client_hpc_competencies(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;