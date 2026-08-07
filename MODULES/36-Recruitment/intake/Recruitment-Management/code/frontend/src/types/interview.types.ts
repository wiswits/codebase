import { QueryParams, PaginationParams, SortParams } from './api.types';

export interface Interview {
  id: number;
  applicantId: number;
  vacancyId: number;
  interviewRound: number;
  interviewType: string;
  interviewMode: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  meetingLink: string;
  interviewerName: string;
  interviewerEmail: string;
  interviewerDesignation: string;
  rating: number;
  feedback: string;
  recommendation: string;
  status: string;
  remarks: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  jobTitle?: string;
  vacancyCode?: string;
  department?: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewFilters extends QueryParams, PaginationParams, SortParams {
  applicantId?: number;
  vacancyId?: number;
  status?: string;
  interviewType?: string;
  interviewMode?: string;
  interviewerName?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateInterviewRequest {
  applicant_id: number;
  vacancy_id: number;
  interview_round?: number;
  interview_type: string;
  interview_mode: string;
  interview_date: string;
  start_time: string;
  end_time?: string;
  venue?: string;
  meeting_link?: string;
  interviewer_name: string;
  interviewer_email?: string;
  interviewer_designation?: string;
  status?: string;
  remarks?: string;
}

export interface UpdateInterviewRequest extends Partial<CreateInterviewRequest> {
  id: number;
  rating?: number;
  feedback?: string;
  recommendation?: string;
}

export interface UpdateInterviewStatusRequest {
  status: string;
  feedback?: string;
  rating?: number;
  recommendation?: string;
}

export interface InterviewStats {
  total_interviews: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
  no_show: number;
  avg_rating: number | null;
}