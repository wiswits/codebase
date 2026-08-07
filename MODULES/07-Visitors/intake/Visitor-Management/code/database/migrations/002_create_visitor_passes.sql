CREATE TABLE IF NOT EXISTS client_visitor_passes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,
    visitor_log_id BIGINT UNSIGNED NOT NULL,

    pass_code VARCHAR(100) NOT NULL,

    status ENUM(
        'active',
        'expired',
        'revoked'
    ) NOT NULL DEFAULT 'active',

    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    revoked_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_visitor_pass_code (
        org_id,
        pass_code
    ),

    KEY idx_pass_org (
        org_id
    ),

    KEY idx_pass_visitor (
        org_id,
        visitor_log_id
    ),

    KEY idx_pass_status (
        org_id,
        status
    ),

    KEY fk_visitor_pass_log (
        visitor_log_id
    ),

    CONSTRAINT fk_visitor_pass_log
        FOREIGN KEY (visitor_log_id)
        REFERENCES client_visitor_logs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;