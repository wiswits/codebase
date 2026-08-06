CREATE TABLE client_offer_letters (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    organization_id INT UNSIGNED NOT NULL,

    applicant_id INT UNSIGNED NOT NULL,

    vacancy_id INT UNSIGNED NOT NULL,

    offer_reference VARCHAR(50) NOT NULL,

    offer_date DATE NOT NULL,

    joining_date DATE,

    designation VARCHAR(150) NOT NULL,

    department VARCHAR(100),

    employment_type ENUM(
        'Full Time',
        'Part Time',
        'Contract',
        'Internship',
        'Temporary'
    ) NOT NULL DEFAULT 'Full Time',

    work_mode ENUM(
        'On Site',
        'Remote',
        'Hybrid'
    ) NOT NULL DEFAULT 'On Site',

    work_location VARCHAR(150),

    salary DECIMAL(12,2) NOT NULL,

    bonus DECIMAL(12,2) DEFAULT NULL,

    probation_months TINYINT UNSIGNED DEFAULT NULL,

    reporting_manager VARCHAR(150),

    offer_document VARCHAR(255),

    status ENUM(
        'Draft',
        'Pending',
        'Sent',
        'Accepted',
        'Rejected',
        'Withdrawn',
        'Expired'
    ) NOT NULL DEFAULT 'Draft',

    accepted_on DATE DEFAULT NULL,

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

    CONSTRAINT fk_offer_applicant
        FOREIGN KEY (applicant_id)
        REFERENCES client_applicants(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_offer_vacancy
        FOREIGN KEY (vacancy_id)
        REFERENCES client_job_vacancies(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uk_org_offer_reference (
        organization_id,
        offer_reference
    ),

    INDEX idx_org (
        organization_id
    ),

    INDEX idx_applicant (
        applicant_id
    ),

    INDEX idx_vacancy (
        vacancy_id
    ),

    INDEX idx_status (
        status
    ),

    INDEX idx_offer_date (
        offer_date
    ),

    INDEX idx_joining_date (
        joining_date
    ),

    INDEX idx_org_status (
        organization_id,
        status
    ),

    INDEX idx_org_deleted (
        organization_id,
        is_deleted
    )

)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;