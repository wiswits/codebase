export type VisitorPermission =
  | "visitor.view"
  | "visitor.create"
  | "visitor.checkin"
  | "visitor.checkout"
  | "visitor.cancel"
  | "visitor.pass.generate"
  | "visitor.pass.print"
  | "visitor.report.view"
  | "visitor.report.export";

export type VisitorRole =
  | "admin"
  | "receptionist"
  | "security"
  | "staff"
  | "viewer";

const ROLE_PERMISSIONS: Record<
  VisitorRole,
  VisitorPermission[]
> = {
  admin: [
    "visitor.view",
    "visitor.create",
    "visitor.checkin",
    "visitor.checkout",
    "visitor.cancel",
    "visitor.pass.generate",
    "visitor.pass.print",
    "visitor.report.view",
    "visitor.report.export",
  ],

  receptionist: [
    "visitor.view",
    "visitor.create",
    "visitor.checkin",
    "visitor.checkout",
    "visitor.cancel",
    "visitor.pass.generate",
    "visitor.pass.print",
    "visitor.report.view",
  ],

  security: [
    "visitor.view",
    "visitor.checkin",
    "visitor.checkout",
    "visitor.pass.print",
  ],

  staff: [
    "visitor.view",
    "visitor.report.view",
  ],

  viewer: [
    "visitor.view",
  ],
};

export function hasVisitorPermission(
  role: VisitorRole,
  permission: VisitorPermission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyVisitorPermission(
  role: VisitorRole,
  permissions: VisitorPermission[]
): boolean {
  return permissions.some((permission) =>
    hasVisitorPermission(role, permission)
  );
}

export function hasAllVisitorPermissions(
  role: VisitorRole,
  permissions: VisitorPermission[]
): boolean {
  return permissions.every((permission) =>
    hasVisitorPermission(role, permission)
  );
}

export function getVisitorPermissions(
  role: VisitorRole
): VisitorPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}