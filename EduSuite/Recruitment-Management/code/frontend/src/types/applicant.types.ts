import { QueryParams, PaginationParams, SortParams } from './api.types';

export interface Applicant {
  organizationId: number;
organization_id?: number;

recruiter_id?: number;
  id: number;
  applicantCode: string;
  vacancyId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  gender: string;
  dateOfBirth: string;
  currentCity: string;
  currentState: string;
  currentCountry: string;
  address: string;
  highestQualification: string;
  specialization: string;
  university: string;
  graduationYear: number;
  totalExperience: number;
  currentCompany: string;
  currentDesignation: string;
  currentCTC: number;
  expectedCTC: number;
  noticePeriod: number;
  resumeFile: string;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  currentStage: string;
  applicationSource: string;
  applicationDate: string;
  status: string;
  recruiterId: number;
  notes: string;
  jobTitle?: string;
  department?: string;
  vacancyCode?: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicantFilters extends QueryParams, PaginationParams, SortParams {
  search?: string;
  vacancyId?: number;
  currentStage?: string;
  status?: string;
  applicationSource?: string;
  gender?: string;
  minExperience?: number;
  maxExperience?: number;
  minCTC?: number;
  maxCTC?: number;
  city?: string;
  state?: string;
  country?: string;
  highestQualification?: string;
  fromDate?: string;
  toDate?: string;
  recruiterId?: number;
}

export interface CreateApplicantRequest {
  vacancy_id: number;
  first_name: string;
  last_name?: string;
  full_name?: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  gender?: string;
  date_of_birth?: string;
  current_city?: string;
  current_state?: string;
  current_country?: string;
  address?: string;
  highest_qualification?: string;
  specialization?: string;
  university?: string;
  graduation_year?: number;
  total_experience?: number;
  current_company?: string;
  current_designation?: string;
  current_ctc?: number;
  expected_ctc?: number;
  notice_period?: number;
  resume_file?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  current_stage?: string;
  application_source?: string;
  application_date?: string;
  status?: string;
  organization_id?: number;
  recruiter_id?: number;
  notes?: string;
}

export interface UpdateApplicantRequest extends Partial<CreateApplicantRequest> {
  id: number;
}

export interface BulkImportRequest {
  applicants: Partial<CreateApplicantRequest>[];
}

export interface BulkImportResponse {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  created: Array<{
    email: string;
    name: string;
    applicant_code: string;
  }>;
}

export interface Stage {
  id: number;
  applicantId: number;
  vacancyId: number;
  fromStage: string;
  toStage: string;
  changedBy: number;
  changedByName?: string;
  remarks: string;
  changedAt: string;
  createdAt: string;
  jobTitle?: string;
  vacancyCode?: string;
  applicantName?: string;
  applicantEmail?: string;
}