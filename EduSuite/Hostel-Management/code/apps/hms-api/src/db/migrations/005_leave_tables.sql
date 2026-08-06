-- Leave request table
CREATE TABLE hms.leave_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    hostel_id UUID NOT NULL REFERENCES hms.hostel(id) ON DELETE CASCADE,
    apex_student_id UUID NOT NULL,
    from_ts TIMESTAMPTZ NOT NULL,
    to_ts TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_parent' CHECK (status IN ('pending_parent', 'pending_warden', 'approved', 'rejected', 'cancelled')),
    parent_decided_by UUID,
    parent_decided_at TIMESTAMPTZ,
    warden_decided_by UUID,
    warden_decided_at TIMESTAMPTZ,
    reject_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (to_ts > from_ts)
);

CREATE INDEX idx_leave_org_id ON hms.leave_request(org_id);
CREATE INDEX idx_leave_hostel_id ON hms.leave_request(hostel_id);
CREATE INDEX idx_leave_student_id ON hms.leave_request(apex_student_id);
CREATE INDEX idx_leave_status ON hms.leave_request(status);
CREATE INDEX idx_leave_from_ts ON hms.leave_request(from_ts);
CREATE INDEX idx_leave_to_ts ON hms.leave_request(to_ts);
CREATE INDEX idx_leave_created_at ON hms.leave_request(created_at);

-- Composite indexes
CREATE INDEX idx_leave_student_status ON hms.leave_request(apex_student_id, status);
CREATE INDEX idx_leave_hostel_status ON hms.leave_request(hostel_id, status);

-- Gate pass table
CREATE TABLE hms.gate_pass (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    leave_id UUID NOT NULL UNIQUE REFERENCES hms.leave_request(id) ON DELETE CASCADE,
    pass_code TEXT NOT NULL UNIQUE,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    exit_scanned_at TIMESTAMPTZ,
    entry_scanned_at TIMESTAMPTZ
);

CREATE INDEX idx_gatepass_org_id ON hms.gate_pass(org_id);
CREATE INDEX idx_gatepass_leave_id ON hms.gate_pass(leave_id);
CREATE INDEX idx_gatepass_pass_code ON hms.gate_pass(pass_code);
CREATE INDEX idx_gatepass_valid_from ON hms.gate_pass(valid_from);
CREATE INDEX idx_gatepass_valid_to ON hms.gate_pass(valid_to);

COMMENT ON TABLE hms.leave_request IS 'Student leave requests with parent/warden approval workflow';
COMMENT ON TABLE hms.gate_pass IS 'Gate pass QR codes generated from approved leave requests';