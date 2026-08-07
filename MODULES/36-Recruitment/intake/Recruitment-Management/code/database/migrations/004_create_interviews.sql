CREATE TABLE client_interviews (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    organization_id INT UNSIGNED NOT NULL,

    applicant_id INT UNSIGNED NOT NULL,

    vacancy_id INT UNSIGNED NOT NULL,

    interview_round TINYINT UNSIGNED NOT NULL DEFAULT 1,

    interview_type ENUM(
        'HR',
        'Technical',
        'Managerial',
        'Final'
    ) NOT NULL DEFAULT 'HR',

    interview_mode ENUM(
        'Offline',
        'Online',
        'Telephonic'
    ) NOT NULL DEFAULT 'Offline',

    interview_date DATE NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME DEFAULT NULL,

    venue VARCHAR(255),

    meeting_link VARCHAR(500),

    interviewer_name VARCHAR(150) NOT NULL,

    interviewer_email VARCHAR(150),

    interviewer_designation VARCHAR(150),

    rating DECIMAL(3,2),

    feedback TEXT,

    recommendation ENUM(
        'Strong Hire',
        'Hire',
        'Hold',
        'Reject'
    ) DEFAULT NULL,

    status ENUM(
        'Scheduled',
        'Completed',
        'Cancelled',
        'Rescheduled',
        'No Show'
    ) NOT NULL DEFAULT 'Scheduled',

    remarks TEXT,

    created_by INT UNSIGNED NOT NULL,

    updated_by INT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    is_deleted TINYINT(1) NOT NULL DEFAULT 0,

    deleted_by INT UNSIGNED DEFAULT NULL,

    deleted_at TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_interview_applicant
        FOREIGN KEY (applicant_id)
        REFERENCES client_applicants(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_interview_vacancy
        FOREIGN KEY (vacancy_id)
        REFERENCES client_job_vacancies(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_org (organization_id),

    INDEX idx_applicant (applicant_id),

    INDEX idx_vacancy (vacancy_id),

    INDEX idx_interview_date (interview_date),

    INDEX idx_status (status),

    INDEX idx_type (interview_type),

    INDEX idx_org_status (
        organization_id,
        status
    ),

    INDEX idx_org_date (
        organization_id,
        interview_date
    ),

    INDEX idx_org_deleted (
        organization_id,
        is_deleted
    )

)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;