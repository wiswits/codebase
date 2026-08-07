CREATE TABLE IF NOT EXISTS client_hpc_competencies (

    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,

    domain_code VARCHAR(50) NOT NULL,

    domain_name VARCHAR(150) NOT NULL,

    competency_code VARCHAR(50) NOT NULL,

    competency_name VARCHAR(255) NOT NULL,

    descriptor_text TEXT NOT NULL,

    display_order INT NOT NULL DEFAULT 1,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_org_competency
    (
        org_id,
        competency_code
    )

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;