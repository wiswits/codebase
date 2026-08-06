export type RegistrationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "cancelled";

export type DocumentStatus =
  | "pending"
  | "submitted"
  | "verified"
  | "rejected";

export interface Registration {
  id: number;
  organizationId: number;
  registrationNumber: string;
  academicSession: string;

  studentFirstName: string;
  studentMiddleName: string | null;
  studentLastName: string;

  dateOfBirth: string | null;
  gender: string | null;

  email: string | null;
  phone: string | null;

  guardianName: string | null;
  guardianPhone: string | null;

  addressLine: string | null;
  admissionClass: string | null;

  status: RegistrationStatus;
  notes: string | null;

  createdBy: number | null;
  updatedBy: number | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRegistrationInput {
  academicSession: string;

  studentFirstName: string;
  studentMiddleName?: string | null;
  studentLastName: string;

  dateOfBirth?: string | null;
  gender?: string | null;

  email?: string | null;
  phone?: string | null;

  guardianName?: string | null;
  guardianPhone?: string | null;

  addressLine?: string | null;
  admissionClass?: string | null;

  status?: RegistrationStatus;
  notes?: string | null;

  createdBy?: number | null;
}

export interface UpdateRegistrationInput {
  academicSession?: string;

  studentFirstName?: string;
  studentMiddleName?: string | null;
  studentLastName?: string;

  dateOfBirth?: string | null;
  gender?: string | null;

  email?: string | null;
  phone?: string | null;

  guardianName?: string | null;
  guardianPhone?: string | null;

  addressLine?: string | null;
  admissionClass?: string | null;

  status?: RegistrationStatus;
  notes?: string | null;

  updatedBy?: number | null;
}

export interface RegistrationDocument {
  id: number;
  organizationId: number;
  registrationId: number;

  documentType: string;
  documentName: string;

  isRequired: boolean;
  status: DocumentStatus;

  fileReference: string | null;
  remarks: string | null;

  verifiedBy: number | null;
  verifiedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  documentType: string;
  documentName: string;

  isRequired?: boolean;
  status?: DocumentStatus;

  fileReference?: string | null;
  remarks?: string | null;

  verifiedBy?: number | null;
}

export interface UpdateDocumentInput {
  documentName?: string;
  isRequired?: boolean;
  status?: DocumentStatus;

  fileReference?: string | null;
  remarks?: string | null;

  verifiedBy?: number | null;
}

export interface NumberSeries {
  id: number;
  organizationId: number;
  academicSession: string;
  prefix: string;
  currentSequence: number;
  createdAt: Date;
  updatedAt: Date;
}