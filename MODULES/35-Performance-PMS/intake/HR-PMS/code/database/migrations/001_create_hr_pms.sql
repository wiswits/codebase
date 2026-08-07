SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


CREATE TABLE IF NOT EXISTS client_appraisal_cycles (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,

    cycle_name VARCHAR(150) NOT NULL,

    cycle_code VARCHAR(50) NOT NULL,

    description TEXT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    review_due_date DATE NULL,

    status ENUM(
        'draft',
        'active',
        'completed',
        'archived'
    ) NOT NULL DEFAULT 'draft',

    created_by BIGINT UNSIGNED NOT NULL,

    updated_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_cycle_code_org
    (
        org_id,
        cycle_code
    ),

    INDEX idx_cycle_org (org_id),

    INDEX idx_cycle_status (status),

    INDEX idx_cycle_dates
    (
        start_date,
        end_date
    ),

    INDEX idx_created_by (created_by),

    CONSTRAINT chk_cycle_dates
        CHECK (end_date >= start_date)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

ALTER TABLE client_appraisal_cycles
COMMENT = 'Stores HR Performance Management appraisal cycles';

SET FOREIGN_KEY_CHECKS = 1;


SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS client_appraisal_goals (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,

    cycle_id BIGINT UNSIGNED NOT NULL,

    employee_id BIGINT UNSIGNED NOT NULL,

    goal_title VARCHAR(255) NOT NULL,

    goal_description TEXT NULL,

    category ENUM(
        'performance',
        'learning',
        'leadership',
        'attendance',
        'project',
        'behavior',
        'other'
    ) NOT NULL DEFAULT 'performance',

    priority ENUM(
        'low',
        'medium',
        'high',
        'critical'
    ) NOT NULL DEFAULT 'medium',

    weightage DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    target_value VARCHAR(255) NULL,

    achieved_value VARCHAR(255) NULL,

    progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'pending',
        'in_progress',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    remarks TEXT NULL,

    created_by BIGINT UNSIGNED NOT NULL,

    updated_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_goal_org (org_id),

    INDEX idx_goal_cycle (cycle_id),

    INDEX idx_goal_employee (employee_id),

    INDEX idx_goal_status (status),

    INDEX idx_goal_priority (priority),

    INDEX idx_goal_category (category),

    INDEX idx_goal_progress (progress_percentage),

    INDEX idx_goal_created_by (created_by),

    CONSTRAINT chk_goal_weightage
        CHECK (
            weightage >= 0
            AND weightage <= 100
        ),

    CONSTRAINT chk_goal_progress
        CHECK (
            progress_percentage >= 0
            AND progress_percentage <= 100
        ),

    CONSTRAINT fk_goal_cycle
        FOREIGN KEY (cycle_id)
        REFERENCES client_appraisal_cycles(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

ALTER TABLE client_appraisal_goals
COMMENT = 'Stores employee performance goals for each appraisal cycle';

SET FOREIGN_KEY_CHECKS = 1;


SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS client_appraisal_reviews (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,

    cycle_id BIGINT UNSIGNED NOT NULL,

    goal_id BIGINT UNSIGNED NOT NULL,

    employee_id BIGINT UNSIGNED NOT NULL,

    reviewer_id BIGINT UNSIGNED NULL,

    review_type ENUM(
        'self',
        'reviewer'
    ) NOT NULL,

    rating DECIMAL(3,2) NOT NULL,

    comments TEXT NULL,

    strengths TEXT NULL,

    improvements TEXT NULL,

    achievements TEXT NULL,

    review_status ENUM(
        'draft',
        'submitted',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'draft',

    submitted_at DATETIME NULL,

    approved_at DATETIME NULL,

    created_by BIGINT UNSIGNED NOT NULL,

    updated_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_review_org (org_id),

    INDEX idx_review_cycle (cycle_id),

    INDEX idx_review_goal (goal_id),

    INDEX idx_review_employee (employee_id),

    INDEX idx_review_reviewer (reviewer_id),

    INDEX idx_review_type (review_type),

    INDEX idx_review_status (review_status),

    INDEX idx_review_rating (rating),

    INDEX idx_review_created_by (created_by),

    CONSTRAINT chk_review_rating
        CHECK (
            rating >= 0
            AND rating <= 5
        ),

    CONSTRAINT fk_review_cycle
        FOREIGN KEY (cycle_id)
        REFERENCES client_appraisal_cycles(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_review_goal
        FOREIGN KEY (goal_id)
        REFERENCES client_appraisal_goals(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uk_review_unique
        UNIQUE (
            org_id,
            cycle_id,
            goal_id,
            employee_id,
            review_type
        )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

ALTER TABLE client_appraisal_reviews
COMMENT = 'Stores employee self reviews and reviewer evaluations';

SET FOREIGN_KEY_CHECKS = 1;