CREATE TABLE IF NOT EXISTS client_visitor_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    org_id BIGINT UNSIGNED NOT NULL,

    visitor_name VARCHAR(150) NOT NULL,
    visitor_phone VARCHAR(30) NULL,
    visitor_email VARCHAR(150) NULL,
    visitor_type VARCHAR(50) NULL,

    purpose VARCHAR(255) NOT NULL,

    host_id BIGINT UNSIGNED NOT NULL,
    host_name VARCHAR(150) NULL,

    check_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_at DATETIME NULL,

    status ENUM(
        'checked_in',
        'checked_out',
        'cancelled'
    ) NOT NULL DEFAULT 'checked_in',

    checked_in_by BIGINT UNSIGNED NULL,
    checked_out_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

   PRIMARY KEY (id),

KEY idx_visitor_org (
    org_id
),

KEY idx_visitor_org_status (
    org_id,
    status
),

KEY idx_visitor_org_checkin (
    org_id,
    check_in_at
),

KEY idx_visitor_host (
    org_id,
    host_id
),

KEY idx_visitor_name (
    org_id,
    visitor_name
)

    
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;