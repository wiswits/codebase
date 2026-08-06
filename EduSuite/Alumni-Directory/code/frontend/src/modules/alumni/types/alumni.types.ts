export type AlumniStatus =
  | "active"
  | "inactive";

export interface Alumni {
  id: number;
  organizationId: number;

  firstName: string;
  lastName: string;

  email: string | null;
  phone: string | null;

  batch: string;
  graduationYear: number;
  course: string;

  status: AlumniStatus;

  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AlumniListData {
  items: Alumni[];
  pagination: Pagination;
}

export interface AlumniQuery {
  search?: string;
  batch?: string;
  graduationYear?: number;
  course?: string;
  page?: number;
  limit?: number;
}

export interface AlumniBatch {
  batch: string;
  graduationYear: number;
  total: number;
}

export interface AlumniCourseStat {
  course: string;
  total: number;
}

export interface AlumniYearStat {
  graduationYear: number;
  total: number;
}

export interface AlumniStats {
  total: number;
  active: number;
  inactive: number;

  byCourse: AlumniCourseStat[];
  byGraduationYear: AlumniYearStat[];
  byBatch: AlumniBatch[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;

  error: {
    code: string;
    message: string;
  };
}