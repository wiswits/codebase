import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Types
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  toasts: Toast[];
  modals: Record<string, boolean>;
  isLoading: Record<string, boolean>;
}

// Atoms
const uiStateAtom = atom<UIState>({
  sidebarCollapsed: false,
  theme: 'light',
  language: 'en',
  toasts: [],
  modals: {},
  isLoading: {},
});

// Persistent theme
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('hms_theme', 'light');
export const languageAtom = atomWithStorage<string>('hms_language', 'en');
export const sidebarCollapsedAtom = atomWithStorage<boolean>('hms_sidebar_collapsed', false);

// Derived atoms
export const sidebarStateAtom = atom(
  (get) => get(sidebarCollapsedAtom)
);

export const themeStateAtom = atom(
  (get) => get(themeAtom)
);

export const languageStateAtom = atom(
  (get) => get(languageAtom)
);

// Toast actions
export const addToastAtom = atom(
  null,
  async (get, set, { type, message }: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const state = get(uiStateAtom);
    set(uiStateAtom, {
      ...state,
      toasts: [...state.toasts, { id, type, message }],
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const currentState = get(uiStateAtom);
      set(uiStateAtom, {
        ...currentState,
        toasts: currentState.toasts.filter(t => t.id !== id),
      });
    }, 5000);
  }
);

export const removeToastAtom = atom(
  null,
  async (get, set, id: string) => {
    const state = get(uiStateAtom);
    set(uiStateAtom, {
      ...state,
      toasts: state.toasts.filter(t => t.id !== id),
    });
  }
);

export const clearToastsAtom = atom(
  null,
  async (get, set) => {
    const state = get(uiStateAtom);
    set(uiStateAtom, {
      ...state,
      toasts: [],
    });
  }
);

// Modal actions
export const openModalAtom = atom(
  null,
  async (get, set, id: string) => {
    const state = get(uiStateAtom);
    set(uiStateAtom, {
      ...state,
      modals: { ...state.modals, [id]: true },
    });
  }
);

export const closeModalAtom = atom(
  null,
  async (get, set, id: string) => {
    const state = get(uiStateAtom);
    set(uiStateAtom, {
      ...state,
      modals: { ...state.modals, [id]: false },
    });
  }
);

export const toggleModalAtom = atom(
  null,
  async (get, set, id: string) => {
    const state = get(uiStateAtom);
    set(uiStateAtom, {
      ...state,
      modals: { ...state.modals, [id]: !state.modals[id] },
    });
  }
);

// Loading actions
export const setLoadingAtom = atom(
  null,
  async (get, set, { id, loading }: { id: string; loading: boolean }) => {
    const state = get(uiStateAtom);
    set(uiStateAtom, {
      ...state,
      isLoading: { ...state.isLoading, [id]: loading },
    });
  }
);

// Sidebar actions
export const toggleSidebarAtom = atom(
  null,
  async (get, set) => {
    const current = get(sidebarCollapsedAtom);
    set(sidebarCollapsedAtom, !current);
  }
);

export const setSidebarCollapsedAtom = atom(
  null,
  async (get, set, collapsed: boolean) => {
    set(sidebarCollapsedAtom, collapsed);
  }
);

// Theme actions
export const setThemeAtom = atom(
  null,
  async (get, set, theme: 'light' | 'dark' | 'system') => {
    set(themeAtom, theme);
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
);

// Language actions
export const setLanguageAtom = atom(
  null,
  async (get, set, language: string) => {
    set(languageAtom, language);
  }
);

// Hook
export function useUIStore() {
  const [sidebarCollapsed] = useAtom(sidebarStateAtom);
  const [theme] = useAtom(themeStateAtom);
  const [language] = useAtom(languageStateAtom);
  const [uiState] = useAtom(uiStateAtom);
  
  const toggleSidebar = useAtom(toggleSidebarAtom)[1];
  const setSidebarCollapsed = useAtom(setSidebarCollapsedAtom)[1];
  const setTheme = useAtom(setThemeAtom)[1];
  const setLanguage = useAtom(setLanguageAtom)[1];
  
  const addToast = useAtom(addToastAtom)[1];
  const removeToast = useAtom(removeToastAtom)[1];
  const clearToasts = useAtom(clearToastsAtom)[1];
  
  const openModal = useAtom(openModalAtom)[1];
  const closeModal = useAtom(closeModalAtom)[1];
  const toggleModal = useAtom(toggleModalAtom)[1];
  
  const setLoading = useAtom(setLoadingAtom)[1];

  return {
    // State
    sidebarCollapsed,
    theme,
    language,
    toasts: uiState.toasts,
    modals: uiState.modals,
    isLoading: uiState.isLoading,
    
    // Sidebar actions
    toggleSidebar,
    setSidebarCollapsed,
    
    // Theme actions
    setTheme,
    
    // Language actions
    setLanguage,
    
    // Toast actions
    addToast,
    removeToast,
    clearToasts,
    
    // Modal actions
    openModal,
    closeModal,
    toggleModal,
    
    // Loading actions
    setLoading,
  };
}