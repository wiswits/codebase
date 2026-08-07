CREATE TABLE client_applicants (

    -- Primary Key
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Multi Tenant
    organization_id INT UNSIGNED NOT NULL,

    -- Vacancy Reference
    vacancy_id INT UNSIGNED NOT NULL,

    -- Applicant Details
    applicant_code VARCHAR(30) NOT NULL,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    full_name VARCHAR(200) NOT NULL,

    email VARCHAR(150) NOT NULL,

    phone VARCHAR(20) NOT NULL,

    alternate_phone VARCHAR(20),

    gender ENUM(
        'Male',
        'Female',
        'Other'
    ),

    date_of_birth DATE,

    current_city VARCHAR(100),

    current_state VARCHAR(100),

    current_country VARCHAR(100),

    address TEXT,

    -- Education
    highest_qualification VARCHAR(150),

    specialization VARCHAR(150),

    university VARCHAR(200),

    graduation_year YEAR,

    -- Experience
    total_experience DECIMAL(4,1) DEFAULT 0.0,

    current_company VARCHAR(200),

    current_designation VARCHAR(150),

    current_ctc DECIMAL(12,2),

    expected_ctc DECIMAL(12,2),

    notice_period INT,

    -- Resume
    resume_file VARCHAR(255),

    portfolio_url VARCHAR(255),

    linkedin_url VARCHAR(255),

    github_url VARCHAR(255),

    -- Recruitment Stage
    current_stage ENUM(
        'Applied',
        'Screening',
        'Shortlisted',
        'Interview Scheduled',
        'Interviewed',
        'Selected',
        'Offered',
        'Hired',
        'Rejected'
    ) NOT NULL DEFAULT 'Applied',

    application_source ENUM(
        'Website',
        'LinkedIn',
        'Referral',
        'Walk In',
        'Job Portal',
        'Campus',
        'Agency',
        'Other'
    ) DEFAULT 'Website',

    application_date DATE NOT NULL,

    status ENUM(
        'Active',
        'Inactive',
        'Hired',
        'Rejected'
    ) NOT NULL DEFAULT 'Active',

    recruiter_id INT UNSIGNED,

    notes TEXT,

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

    CONSTRAINT fk_applicant_vacancy
        FOREIGN KEY (vacancy_id)
        REFERENCES client_job_vacancies(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uk_org_applicant_code (
        organization_id,
        applicant_code
    ),

    UNIQUE KEY uk_org_email (
        organization_id,
        email
    ),

    INDEX idx_org (
        organization_id
    ),

    INDEX idx_vacancy (
        vacancy_id
    ),

    INDEX idx_stage (
        current_stage
    ),

    INDEX idx_status (
        status
    ),

    INDEX idx_application_date (
        application_date
    ),

    INDEX idx_recruiter (
        recruiter_id
    ),

    INDEX idx_phone (
        phone
    ),

    INDEX idx_org_stage (
        organization_id,
        current_stage
    ),

    INDEX idx_org_status (
        organization_id,
        status
    ),

    INDEX idx_org_vacancy (
        organization_id,
        vacancy_id
    ),

    INDEX idx_org_deleted (
        organization_id,
        is_deleted
    )

)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;