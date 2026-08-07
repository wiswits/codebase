import type { ReactNode } from "react";

interface PermissionGuardProps {
  children: ReactNode;
  allowed?: boolean;
  fallback?: ReactNode;
}

export default function PermissionGuard({
  children,
  allowed = true,
  fallback = null,
}: PermissionGuardProps) {
  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}