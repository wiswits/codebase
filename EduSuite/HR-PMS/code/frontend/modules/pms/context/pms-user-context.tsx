"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_MOCK_ROLE, MOCK_CURRENT_USERS } from "../mocks/seed-data";
import type { PmsCurrentUser, PmsPermission } from "../types";

/**
 * Frontend-only "current user" context for the PMS module.
 *
 * IMPORTANT: This exists to make permission-aware UI possible while the
 * frontend is developed independently, using mock roles. It is NOT an
 * authentication system — Engineering Standards §14/§15 require the real
 * EduSuite auth/RBAC mechanism, and the backend independently re-checks
 * every permission. The role switcher below is a development convenience
 * only and should be replaced by the real session/user once integrated.
 */

interface PmsUserContextValue {
  currentUser: PmsCurrentUser;
  hasPermission: (permission: PmsPermission) => boolean;
  /** DEV-ONLY: lets the demo switch between employee/manager/HR admin. */
  setMockRole: (role: keyof typeof MOCK_CURRENT_USERS) => void;
  mockRole: keyof typeof MOCK_CURRENT_USERS;
}

const PmsUserContext = createContext<PmsUserContextValue | null>(null);

export function PmsUserProvider({ children }: { children: ReactNode }) {
  const [mockRole, setMockRole] = useState<keyof typeof MOCK_CURRENT_USERS>(
    DEFAULT_MOCK_ROLE,
  );

  const currentUser = MOCK_CURRENT_USERS[mockRole];

  const value = useMemo<PmsUserContextValue>(
    () => ({
      currentUser,
      hasPermission: (permission) => currentUser.permissions.includes(permission),
      setMockRole,
      mockRole,
    }),
    [currentUser, mockRole],
  );

  return <PmsUserContext.Provider value={value}>{children}</PmsUserContext.Provider>;
}

export function usePmsUser(): PmsUserContextValue {
  const ctx = useContext(PmsUserContext);
  if (!ctx) {
    throw new Error("usePmsUser must be used within a PmsUserProvider");
  }
  return ctx;
}
