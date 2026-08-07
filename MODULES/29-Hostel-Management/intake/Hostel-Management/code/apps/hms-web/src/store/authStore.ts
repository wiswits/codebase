import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Types
export interface User {
  apexUserId: string;
  orgId: string;
  campusIds: string[];
  roles: string[];
  studentId?: string;
  parentOf?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Atoms
export const authStateAtom = atom<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
});

// Store token in localStorage for persistence
export const tokenAtom = atomWithStorage<string | null>('hms_auth_token', null);

// Derived atoms
export const isAuthenticatedAtom = atom(
  (get) => get(authStateAtom).isAuthenticated
);

export const userAtom = atom(
  (get) => get(authStateAtom).user
);

export const userRolesAtom = atom(
  (get) => get(authStateAtom).user?.roles || []
);

export const isStudentAtom = atom(
  (get) => get(authStateAtom).user?.roles?.includes('student') || false
);

export const isParentAtom = atom(
  (get) => get(authStateAtom).user?.roles?.includes('parent') || false
);

export const isAdminAtom = atom(
  (get) => get(authStateAtom).user?.roles?.some(r => r.includes('admin')) || false
);

// Actions
export const loginAtom = atom(
  null,
  async (get, set, { user, token }: { user: User; token: string }) => {
    set(authStateAtom, {
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    set(tokenAtom, token);
  }
);

export const logoutAtom = atom(
  null,
  async (get, set) => {
    set(authStateAtom, {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    set(tokenAtom, null);
  }
);

export const setLoadingAtom = atom(
  null,
  async (get, set, isLoading: boolean) => {
    set(authStateAtom, {
      ...get(authStateAtom),
      isLoading,
    });
  }
);

export const setErrorAtom = atom(
  null,
  async (get, set, error: string | null) => {
    set(authStateAtom, {
      ...get(authStateAtom),
      error,
    });
  }
);

// Hook
export function useAuthStore() {
  const [authState, setAuthState] = useAtom(authStateAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user] = useAtom(userAtom);
  const [userRoles] = useAtom(userRolesAtom);
  const [isStudent] = useAtom(isStudentAtom);
  const [isParent] = useAtom(isParentAtom);
  const [isAdmin] = useAtom(isAdminAtom);

  const login = useAtom(loginAtom)[1];
  const logout = useAtom(logoutAtom)[1];
  const setLoading = useAtom(setLoadingAtom)[1];
  const setError = useAtom(setErrorAtom)[1];

  return {
    state: authState,
    token,
    isAuthenticated,
    user,
    userRoles,
    isStudent,
    isParent,
    isAdmin,
    login,
    logout,
    setLoading,
    setError,
    setToken,
  };
}