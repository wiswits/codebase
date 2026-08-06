CREATE TABLE IF NOT EXISTS approval_workflows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  org_id INT NOT NULL,
  document_id INT NOT NULL,
  workflow_type VARCHAR(50) NOT NULL,
  approvers JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP,
  rejected_by INT,
  rejected_at TIMESTAMP,
  reason TEXT,
  comments TEXT,
  deadline DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);