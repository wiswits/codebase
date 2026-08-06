CREATE DATABASE IF NOT EXISTS edusuite;
USE edusuite;

CREATE TABLE IF NOT EXISTS organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  settings JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('super_admin', 'admin', 'coordinator', 'teacher', 'staff') NOT NULL,
  permissions JSON,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_email_org (email, org_id)
);

CREATE TABLE IF NOT EXISTS document_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('certificate', 'id_card', 'bonafide', 'tc', 'migration', 
            'character', 'admit_card', 'report_card', 'fee_receipt',
            'appointment', 'experience', 'salary_slip', 'hostel_card',
            'bus_pass', 'gate_pass', 'custom') NOT NULL,
  category VARCHAR(100),
  description TEXT,
  design_data JSON NOT NULL,
  placeholder_data JSON,
  version VARCHAR(20) DEFAULT '1.0',
  status ENUM('draft', 'review', 'approved', 'published', 'archived') DEFAULT 'draft',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  template_id INT,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSON,
  status ENUM('draft', 'review', 'approved', 'signed', 'published', 
              'generated', 'printed', 'downloaded', 'shared', 
              'verified', 'revoked', 'archived') DEFAULT 'draft',
  issue_date DATE,
  expiry_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES document_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS document_signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  signer_id INT NOT NULL,
  signature_image_url VARCHAR(500),
  signature_hash VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signer_role VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (signer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  verification_code VARCHAR(100) UNIQUE NOT NULL,
  qr_code_url VARCHAR(500),
  hash_value VARCHAR(255) NOT NULL,
  status ENUM('pending', 'verified', 'failed', 'expired') DEFAULT 'pending',
  verified_by_ip VARCHAR(50),
  verified_by_user_id INT,
  verification_count INT DEFAULT 0,
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(50),
  user_agent TEXT,
  device_info JSON,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  document_ids JSON,
  job_type VARCHAR(50) NOT NULL,
  status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
  total_pages INT,
  completed_pages INT DEFAULT 0,
  printer_name VARCHAR(100),
  priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
  created_by INT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS generation_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  template_id INT NOT NULL,
  document_ids JSON,
  total_count INT NOT NULL,
  processed_count INT DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  parameters JSON,
  created_by INT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES document_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS id_card_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  student_id VARCHAR(50),
  staff_id VARCHAR(50),
  full_name VARCHAR(255) NOT NULL,
  photo_url VARCHAR(500),
  designation VARCHAR(100),
  department VARCHAR(100),
  roll_number VARCHAR(50),
  class VARCHAR(50),
  section VARCHAR(10),
  blood_group VARCHAR(10),
  emergency_contact VARCHAR(50),
  valid_until DATE,
  additional_fields JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

INSERT INTO organizations (name, subdomain, email) 
VALUES ('Sunrise Public School', 'sunrise', 'admin@sunrise.edu');

INSERT INTO users (org_id, email, password_hash, first_name, last_name, role) 
VALUES (1, 'admin@sunrise.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjO.ZcpOZxZq', 'Admin', 'User', 'super_admin');