-- Fee bridge table
CREATE TABLE hms.fee_charge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    apex_student_id UUID NOT NULL,
    apex_ledger_id UUID,
    charge_type TEXT NOT NULL CHECK (charge_type IN ('rent', 'deposit', 'damage', 'refund')),
    amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
    period_start DATE,
    period_end DATE,
    allocation_id UUID REFERENCES hms.allocation(id) ON DELETE SET NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    posted_at TIMESTAMPTZ
);

CREATE INDEX idx_fee_charge_org_id ON hms.fee_charge(org_id);
CREATE INDEX idx_fee_charge_student_id ON hms.fee_charge(apex_student_id);
CREATE INDEX idx_fee_charge_allocation_id ON hms.fee_charge(allocation_id);
CREATE INDEX idx_fee_charge_type ON hms.fee_charge(charge_type);
CREATE INDEX idx_fee_charge_idempotency ON hms.fee_charge(idempotency_key);
CREATE INDEX idx_fee_charge_posted_at ON hms.fee_charge(posted_at);

COMMENT ON TABLE hms.fee_charge IS 'Fee charges bridge to APEX Fee Module';