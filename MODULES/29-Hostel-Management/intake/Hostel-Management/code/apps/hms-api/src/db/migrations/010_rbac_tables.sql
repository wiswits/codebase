-- RBAC Tables

-- Roles table
CREATE TABLE hms.role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions table
CREATE TABLE hms.permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (bridge between APEX users and roles)
CREATE TABLE hms.user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    apex_user_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES hms.role(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, apex_user_id, role_id)
);

-- Role permissions (bridge between roles and permissions)
CREATE TABLE hms.role_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES hms.role(id) ON DELETE CASCADE,
    permission TEXT NOT NULL REFERENCES hms.permission(permission) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role_id, permission)
);

-- Indexes
CREATE INDEX idx_role_name ON hms.role(name);
CREATE INDEX idx_permission_name ON hms.permission(permission);
CREATE INDEX idx_user_role_apex_user ON hms.user_role(apex_user_id);
CREATE INDEX idx_user_role_org ON hms.user_role(org_id);
CREATE INDEX idx_role_permission_role ON hms.role_permission(role_id);
CREATE INDEX idx_role_permission_perm ON hms.role_permission(permission);

-- RLS Policies
ALTER TABLE hms.role ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms.permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms.user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms.role_permission ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_user_role ON hms.user_role
    USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE hms.role IS 'System roles for RBAC';
COMMENT ON TABLE hms.permission IS 'System permissions for RBAC';
COMMENT ON TABLE hms.user_role IS 'User to role assignments (org-scoped)';
COMMENT ON TABLE hms.role_permission IS 'Role to permission mappings';