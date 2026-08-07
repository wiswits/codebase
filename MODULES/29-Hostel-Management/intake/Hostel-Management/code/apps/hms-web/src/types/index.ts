// Re-export shared types
export * from '@shared/schemas/hostel';
export * from '@shared/schemas/allocation';
export * from '@shared/schemas/attendance';
export * from '@shared/schemas/leave';
export * from '@shared/schemas/complaint';
export * from '@shared/schemas/report';

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  limit: number;
  cursor?: string;
  hasMore: boolean;
}

// Auth types
export interface AuthUser {
  apexUserId: string;
  orgId: string;
  campusIds: string[];
  roles: string[];
  studentId?: string;
  parentOf?: string[];
  permissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

// Component Props types
export interface WithChildren {
  children: React.ReactNode;
}

export interface WithClassName {
  className?: string;
}

export interface WithTestId {
  testId?: string;
}

export interface WithOnChange<T = any> {
  onChange?: (value: T) => void;
}

export interface WithValue<T = any> {
  value: T;
}

export interface WithDisabled {
  disabled?: boolean;
}

export interface WithLoading {
  loading?: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: Record<string, any>;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Filter types
export interface FilterOptions {
  search?: string;
  status?: string | string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

// Chart types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  fill?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  typography: {
    fontFamily: string;
    headingFamily: string;
    sizes: Record<string, string>;
    weights: Record<string, number>;
  };
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  permission?: string;
  children?: RouteConfig[];
  redirect?: string;
}

// Menu types
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  permission?: string;
  children?: MenuItem[];
  badge?: number;
  divider?: boolean;
}

// Breadcrumb types
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

// Tab types
export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: number;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
}

// Table types
export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  pagination?: {
    total: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
}

// Select types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

// Step types
export interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
  validation?: () => boolean;
}

// Wizard types
export interface WizardProps {
  steps: Step[];
  initialStep?: number;
  onComplete: (data: any) => void;
  onCancel?: () => void;
  showSteps?: boolean;
  showNavigation?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  completeLabel?: string;
  cancelLabel?: string;
}

// Export all type utilities
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type Nullable<T> = { [P in keyof T]: T[P] | null };
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export type DeepRequired<T> = T extends object ? {
  [P in keyof T]: DeepRequired<T[P]>;
} : T;