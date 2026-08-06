import { QueryParams, PaginationParams, SortParams } from './api.types';

export interface Offer {
  id: number;
  applicantId: number;
  vacancyId: number;
  offerReference: string;
  offerDate: string;
  joiningDate: string;
  designation: string;
  department: string;
  employmentType: string;
  workMode: string;
  workLocation: string;
  salary: number;
  bonus: number;
  probationMonths: number;
  reportingManager: string;
  offerDocument: string;
  status: string;
  acceptedOn: string;
  remarks: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  jobTitle?: string;
  vacancyCode?: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfferFilters extends QueryParams, PaginationParams, SortParams {
  applicantId?: number;
  vacancyId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface CreateOfferRequest {
  applicant_id: number;
  vacancy_id: number;
  offer_reference: string;
  offer_date: string;
  joining_date?: string;
  designation: string;
  department?: string;
  employment_type: string;
  work_mode: string;
  work_location?: string;
  salary: number;
  bonus?: number;
  probation_months?: number;
  reporting_manager?: string;
  offer_document?: string;
  status?: string;
  remarks?: string;
}

export interface UpdateOfferRequest extends Partial<CreateOfferRequest> {
  id: number;
  accepted_on?: string;
}

export interface UpdateOfferStatusRequest {
  status: string;
  accepted_on?: string;
}

export interface OfferStats {
  total_offers: number;
  draft: number;
  pending: number;
  sent: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  expired: number;
  avg_salary: number | null;
}