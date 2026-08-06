-- Enable RLS on all tables
DO $$ 
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'hms' AND tablename NOT IN ('audit_log')
    LOOP
        EXECUTE format('ALTER TABLE hms.%I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;

-- Create RLS policies for each table
CREATE POLICY tenant_isolation_hostel ON hms.hostel
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_building ON hms.building
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_wing ON hms.wing
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_floor ON hms.floor
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_room ON hms.room
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_bed ON hms.bed
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_allocation ON hms.allocation
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_transfer ON hms.transfer
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_attendance ON hms.attendance
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_leave_request ON hms.leave_request
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_gate_pass ON hms.gate_pass
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_complaint ON hms.complaint
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_fee_charge ON hms.fee_charge
    USING (org_id = current_setting('app.org_id')::uuid);

CREATE POLICY tenant_isolation_audit_log ON hms.audit_log
    USING (org_id = current_setting('app.org_id')::uuid);

-- Create app_user role
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN;
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hms TO app_user;
GRANT USAGE ON SCHEMA hms TO app_user;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA hms TO app_user;

COMMENT ON TABLE hms.audit_log IS 'Immutable audit trail with RLS tenant isolation';