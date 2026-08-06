CREATE TABLE client_applicant_stages (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    organization_id INT UNSIGNED NOT NULL,

    applicant_id INT UNSIGNED NOT NULL,

    vacancy_id INT UNSIGNED NOT NULL,

    from_stage ENUM(
        'Applied',
        'Screening',
        'Shortlisted',
        'Interview Scheduled',
        'Interviewed',
        'Selected',
        'Offered',
        'Hired',
        'Rejected'
    ) DEFAULT NULL,

    to_stage ENUM(
        'Applied',
        'Screening',
        'Shortlisted',
        'Interview Scheduled',
        'Interviewed',
        'Selected',
        'Offered',
        'Hired',
        'Rejected'
    ) NOT NULL,

    changed_by INT UNSIGNED NOT NULL,

    remarks TEXT,

    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_by INT UNSIGNED NOT NULL,

    updated_by INT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    is_deleted TINYINT(1) NOT NULL DEFAULT 0,

    deleted_by INT UNSIGNED DEFAULT NULL,

    deleted_at TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_stage_applicant
        FOREIGN KEY (applicant_id)
        REFERENCES client_applicants(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_stage_vacancy
        FOREIGN KEY (vacancy_id)
        REFERENCES client_job_vacancies(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_org (organization_id),

    INDEX idx_applicant (applicant_id),

    INDEX idx_vacancy (vacancy_id),

    INDEX idx_to_stage (to_stage),

    INDEX idx_changed_at (changed_at),

    INDEX idx_org_applicant (
        organization_id,
        applicant_id
    ),

    INDEX idx_org_stage (
        organization_id,
        to_stage
    ),

    INDEX idx_org_deleted (
        organization_id,
        is_deleted
    )

)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;