export type ObservationType = "anecdotal" | "class_school";

export interface Student {
  id: number;
  name: string;
  studentCode: string;
  className: string;
  sectionName: string;
}

export interface ObservationAuthor {
  id: number;
  name: string;
  role: string;
}

export interface Observation {
  id: number;
  organizationId: number;
  studentId: number;
  authorId: number;
  observationType: ObservationType;
  content: string;
  createdAt: string;
  updatedAt: string;

  student?: Student;
  author?: ObservationAuthor;
}

export interface ObservationFormValues {
  studentId: number | null;
  observationType: ObservationType | "";
  content: string;
}

export interface CreateObservationPayload {
  studentId: number;
  observationType: ObservationType;
  content: string;
}

export interface UpdateObservationPayload {
  observationType: ObservationType;
  content: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}