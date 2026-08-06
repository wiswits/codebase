-- Allocation table with partial unique indexes for race condition prevention
CREATE TABLE hms.allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    bed_id UUID NOT NULL REFERENCES hms.bed(id) ON DELETE RESTRICT,
    apex_student_id UUID NOT NULL,
    hostel_id UUID NOT NULL REFERENCES hms.hostel(id) ON DELETE RESTRICT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    vacated_at TIMESTAMPTZ,
    allocated_by UUID NOT NULL,
    vacate_reason TEXT
);

-- The key constraint: One active allocation per bed
CREATE UNIQUE INDEX uniq_active_bed ON hms.allocation (bed_id) WHERE vacated_at IS NULL;

-- One active allocation per student
CREATE UNIQUE INDEX uniq_active_student ON hms.allocation (apex_student_id) WHERE vacated_at IS NULL;

CREATE INDEX idx_allocation_org_id ON hms.allocation(org_id);
CREATE INDEX idx_allocation_hostel_id ON hms.allocation(hostel_id);
CREATE INDEX idx_allocation_student_id ON hms.allocation(apex_student_id);
CREATE INDEX idx_allocation_bed_id ON hms.allocation(bed_id);
CREATE INDEX idx_allocation_vacated_at ON hms.allocation(vacated_at);
CREATE INDEX idx_allocation_allocated_at ON hms.allocation(allocated_at);

-- Transfer table
CREATE TABLE hms.transfer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    allocation_id UUID NOT NULL REFERENCES hms.allocation(id) ON DELETE CASCADE,
    requested_bed_id UUID NOT NULL REFERENCES hms.bed(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    approved_bed_id UUID REFERENCES hms.bed(id) ON DELETE SET NULL,
    reject_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transfer_org_id ON hms.transfer(org_id);
CREATE INDEX idx_transfer_allocation_id ON hms.transfer(allocation_id);
CREATE INDEX idx_transfer_status ON hms.transfer(status);
CREATE INDEX idx_transfer_created_at ON hms.transfer(created_at);

COMMENT ON TABLE hms.allocation IS 'Student bed allocation with active/inactive state';
COMMENT ON TABLE hms.transfer IS 'Bed transfer requests between allocations';