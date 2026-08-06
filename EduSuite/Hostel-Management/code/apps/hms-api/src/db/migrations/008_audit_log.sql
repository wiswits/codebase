-- Audit log table
CREATE TABLE hms.audit_log (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    before JSONB,
    after JSONB,
    ip INET,
    at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_id ON hms.audit_log(org_id);
CREATE INDEX idx_audit_entity ON hms.audit_log(entity, entity_id);
CREATE INDEX idx_audit_actor ON hms.audit_log(actor_id);
CREATE INDEX idx_audit_action ON hms.audit_log(action);
CREATE INDEX idx_audit_at ON hms.audit_log(at DESC);

-- Immutability enforcement
REVOKE UPDATE, DELETE ON hms.audit_log FROM app_user;
GRANT INSERT ON hms.audit_log TO app_user;

COMMENT ON TABLE hms.audit_log IS 'Immutable audit trail for all mutations';