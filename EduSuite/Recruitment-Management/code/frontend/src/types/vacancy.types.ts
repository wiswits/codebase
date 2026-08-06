import { QueryParams, PaginationParams, SortParams } from './api.types';

export interface Vacancy {
  id: number;
  vacancyCode: string;
  jobTitle: string;
  department: string;
  designation: string;
  employmentType: string;
  workMode: string;
  location: string;
  numberOfOpenings: number;
  experienceRequired: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  jobDescription: string;
  requiredSkills: string;
  preferredSkills: string;
  educationRequired: string;
  applicationStartDate: string;
  applicationEndDate: string;
  expectedJoiningDate: string;
  hiringManagerId: number;
  recruiterId: number;
  status: string;
  remarks: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface VacancyFilters extends QueryParams, PaginationParams, SortParams {
  search?: string;
  status?: string;
  department?: string;
  employmentType?: string;
  workMode?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateVacancyRequest {
  vacancy_code: string;
  job_title: string;
  department: string;
  designation?: string;
  employment_type: string;
  work_mode: string;
  location?: string;
  number_of_openings: number;
  experience_required?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  job_description?: string;
  required_skills?: string;
  preferred_skills?: string;
  education_required?: string;
  application_start_date: string;
  application_end_date: string;
  expected_joining_date?: string;
  hiring_manager_id?: number;
  recruiter_id?: number;
  status?: string;
  remarks?: string;
}

export interface UpdateVacancyRequest extends Partial<CreateVacancyRequest> {
  id: number;
}

export interface VacancyStats {
  total_vacancies: number;
  open_vacancies: number;
  draft_vacancies: number;
  on_hold_vacancies: number;
  closed_vacancies: number;
  cancelled_vacancies: number;
  total_openings: number;
}