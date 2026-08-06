-- Complaint table
CREATE TABLE hms.complaint (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    hostel_id UUID NOT NULL REFERENCES hms.hostel(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('electrical', 'plumbing', 'furniture', 'cleanliness', 'other')),
    description TEXT NOT NULL,
    photo_keys TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaint_org_id ON hms.complaint(org_id);
CREATE INDEX idx_complaint_hostel_id ON hms.complaint(hostel_id);
CREATE INDEX idx_complaint_raised_by ON hms.complaint(raised_by);
CREATE INDEX idx_complaint_assigned_to ON hms.complaint(assigned_to);
CREATE INDEX idx_complaint_status ON hms.complaint(status);
CREATE INDEX idx_complaint_category ON hms.complaint(category);
CREATE INDEX idx_complaint_created_at ON hms.complaint(created_at);

-- Composite indexes
CREATE INDEX idx_complaint_hostel_status ON hms.complaint(hostel_id, status);
CREATE INDEX idx_complaint_assigned_status ON hms.complaint(assigned_to, status);

COMMENT ON TABLE hms.complaint IS 'Student complaints with status workflow';