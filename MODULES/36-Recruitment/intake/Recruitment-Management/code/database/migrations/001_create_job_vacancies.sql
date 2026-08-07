CREATE TABLE client_job_vacancies (

    -- Primary Key
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Multi Tenant
    organization_id INT UNSIGNED NOT NULL,

    -- Vacancy Information
    vacancy_code VARCHAR(30) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100),

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

    location VARCHAR(150),

    number_of_openings INT UNSIGNED NOT NULL DEFAULT 1,

    experience_required VARCHAR(100),

    salary_min DECIMAL(12,2),

    salary_max DECIMAL(12,2),

    currency VARCHAR(10) DEFAULT 'INR',

    job_description LONGTEXT,

    required_skills LONGTEXT,

    preferred_skills LONGTEXT,

    education_required VARCHAR(150),

    application_start_date DATE,

    application_end_date DATE,

    expected_joining_date DATE,

    hiring_manager_id INT UNSIGNED,

    recruiter_id INT UNSIGNED,

    status ENUM(
        'Draft',
        'Open',
        'On Hold',
        'Closed',
        'Cancelled'
    ) NOT NULL DEFAULT 'Draft',

    remarks TEXT,

    -- Audit Fields
    created_by INT UNSIGNED NOT NULL,

    updated_by INT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- Soft Delete
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,

    deleted_by INT UNSIGNED DEFAULT NULL,

    deleted_at TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uk_org_vacancy_code (
        organization_id,
        vacancy_code
    ),

    INDEX idx_org (
        organization_id
    ),

    INDEX idx_status (
        status
    ),

    INDEX idx_department (
        department
    ),

    INDEX idx_job_title (
        job_title
    ),

    INDEX idx_opening_dates (
        application_start_date,
        application_end_date
    ),

    INDEX idx_org_status (
        organization_id,
        status
    ),

    INDEX idx_org_department (
        organization_id,
        department
    ),

    INDEX idx_org_deleted (
        organization_id,
        is_deleted
    )

)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;