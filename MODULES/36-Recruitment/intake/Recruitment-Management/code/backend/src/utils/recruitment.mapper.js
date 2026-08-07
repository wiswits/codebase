/**
 * Recruitment Module Mapper Functions
 * Converts database models to DTOs and vice versa
 */

import { formatDate, formatCurrency } from './recruitment.helper.js';

/**
 * Map vacancy database record to DTO
 */
export const mapVacancyToDTO = (vacancy) => {
  if (!vacancy) return null;
  
  return {
    id: vacancy.id,
    vacancyCode: vacancy.vacancy_code,
    jobTitle: vacancy.job_title,
    department: vacancy.department,
    designation: vacancy.designation,
    employmentType: vacancy.employment_type,
    workMode: vacancy.work_mode,
    location: vacancy.location,
    numberOfOpenings: vacancy.number_of_openings,
    experienceRequired: vacancy.experience_required,
    salaryMin: vacancy.salary_min,
    salaryMax: vacancy.salary_max,
    currency: vacancy.currency,
    jobDescription: vacancy.job_description,
    requiredSkills: vacancy.required_skills,
    preferredSkills: vacancy.preferred_skills,
    educationRequired: vacancy.education_required,
    applicationStartDate: formatDate(vacancy.application_start_date),
    applicationEndDate: formatDate(vacancy.application_end_date),
    expectedJoiningDate: formatDate(vacancy.expected_joining_date),
    hiringManagerId: vacancy.hiring_manager_id,
    recruiterId: vacancy.recruiter_id,
    status: vacancy.status,
    remarks: vacancy.remarks,
    createdBy: vacancy.created_by,
    updatedBy: vacancy.updated_by,
    createdAt: vacancy.created_at,
    updatedAt: vacancy.updated_at,
    isDeleted: vacancy.is_deleted,
  };
};

/**
 * Map multiple vacancies to DTOs
 */
export const mapVacanciesToDTO = (vacancies) => {
  if (!vacancies || !Array.isArray(vacancies)) return [];
  return vacancies.map(mapVacancyToDTO);
};

/**
 * Map applicant database record to DTO
 */
export const mapApplicantToDTO = (applicant) => {
  if (!applicant) return null;
  
  return {
    id: applicant.id,
    applicantCode: applicant.applicant_code,
    vacancyId: applicant.vacancy_id,
    firstName: applicant.first_name,
    lastName: applicant.last_name,
    fullName: applicant.full_name,
    email: applicant.email,
    phone: applicant.phone,
    alternatePhone: applicant.alternate_phone,
    gender: applicant.gender,
    dateOfBirth: formatDate(applicant.date_of_birth),
    currentCity: applicant.current_city,
    currentState: applicant.current_state,
    currentCountry: applicant.current_country,
    address: applicant.address,
    highestQualification: applicant.highest_qualification,
    specialization: applicant.specialization,
    university: applicant.university,
    graduationYear: applicant.graduation_year,
    totalExperience: applicant.total_experience,
    currentCompany: applicant.current_company,
    currentDesignation: applicant.current_designation,
    currentCTC: applicant.current_ctc,
    expectedCTC: applicant.expected_ctc,
    noticePeriod: applicant.notice_period,
    resumeFile: applicant.resume_file,
    portfolioUrl: applicant.portfolio_url,
    linkedinUrl: applicant.linkedin_url,
    githubUrl: applicant.github_url,
    currentStage: applicant.current_stage,
    applicationSource: applicant.application_source,
    applicationDate: formatDate( applicant.application_date),
    status: applicant.status,
    recruiterId: applicant.recruiter_id,
    notes: applicant.notes,
    jobTitle: applicant.job_title,
    department: applicant.department,
    vacancyCode: applicant.vacancy_code,
    createdBy: applicant.created_by,
    updatedBy: applicant.updated_by,
    createdAt: applicant.created_at,
    updatedAt: applicant.updated_at,
  };
};

/**
 * Map multiple applicants to DTOs
 */
export const mapApplicantsToDTO = (applicants) => {
  if (!applicants || !Array.isArray(applicants)) return [];
  return applicants.map(mapApplicantToDTO);
};

/**
 * Map stage database record to DTO
 */
export const mapStageToDTO = (stage) => {
  if (!stage) return null;
  
  return {
    id: stage.id,
    applicantId: stage.applicant_id,
    vacancyId: stage.vacancy_id,
    fromStage: stage.from_stage,
    toStage: stage.to_stage,
    changedBy: stage.changed_by,
    changedByName: stage.changed_by_name,
    remarks: stage.remarks,
    changedAt: stage.changed_at,
    createdAt: stage.created_at,
    jobTitle: stage.job_title,
    vacancyCode: stage.vacancy_code,
    applicantName: stage.applicant_name,
    applicantEmail: stage.applicant_email,
  };
};

/**
 * Map multiple stages to DTOs
 */
export const mapStagesToDTO = (stages) => {
  if (!stages || !Array.isArray(stages)) return [];
  return stages.map(mapStageToDTO);
};

/**
 * Map interview database record to DTO
 */
export const mapInterviewToDTO = (interview) => {
  if (!interview) return null;
  
  return {
    id: interview.id,
    applicantId: interview.applicant_id,
    vacancyId: interview.vacancy_id,
    interviewRound: interview.interview_round,
    interviewType: interview.interview_type,
    interviewMode: interview.interview_mode,
    interviewDate: formatDate(interview.interview_date),
    startTime: interview.start_time,
    endTime: interview.end_time,
    venue: interview.venue,
    meetingLink: interview.meeting_link,
    interviewerName: interview.interviewer_name,
    interviewerEmail: interview.interviewer_email,
    interviewerDesignation: interview.interviewer_designation,
    rating: interview.rating,
    feedback: interview.feedback,
    recommendation: interview.recommendation,
    status: interview.status,
    remarks: interview.remarks,
    applicantName: interview.applicant_name,
    applicantEmail: interview.applicant_email,
    applicantPhone: interview.applicant_phone,
    jobTitle: interview.job_title,
    vacancyCode: interview.vacancy_code,
    department: interview.department,
    createdBy: interview.created_by,
    updatedBy: interview.updated_by,
    createdAt: interview.created_at,
    updatedAt: interview.updated_at,
  };
};

/**
 * Map multiple interviews to DTOs
 */
export const mapInterviewsToDTO = (interviews) => {
  if (!interviews || !Array.isArray(interviews)) return [];
  return interviews.map(mapInterviewToDTO);
};

/**
 * Map offer database record to DTO
 */
export const mapOfferToDTO = (offer) => {
  if (!offer) return null;
  
  return {
    id: offer.id,
    applicantId: offer.applicant_id,
    vacancyId: offer.vacancy_id,
    offerReference: offer.offer_reference,
    offerDate: formatDate(offer.offer_date),
    joiningDate: formatDate(offer.joining_date),
    designation: offer.designation,
    department: offer.department,
    employmentType: offer.employment_type,
    workMode: offer.work_mode,
    workLocation: offer.work_location,
    salary: offer.salary,
    bonus: offer.bonus,
    probationMonths: offer.probation_months,
    reportingManager: offer.reporting_manager,
    offerDocument: offer.offer_document,
    status: offer.status,
    acceptedOn: formatDate(offer.accepted_on),
    remarks: offer.remarks,
    applicantName: offer.applicant_name,
    applicantEmail: offer.applicant_email,
    applicantPhone: offer.applicant_phone,
    jobTitle: offer.job_title,
    vacancyCode: offer.vacancy_code,
    department: offer.vacancy_department || offer.department,
    createdBy: offer.created_by,
    updatedBy: offer.updated_by,
    createdAt: offer.created_at,
    updatedAt: offer.updated_at,
  };
};

/**
 * Map multiple offers to DTOs
 */
export const mapOffersToDTO = (offers) => {
  if (!offers || !Array.isArray(offers)) return [];
  return offers.map(mapOfferToDTO);
};

/**
 * Map dashboard stats to DTO
 */
export const mapDashboardStatsToDTO = (stats) => {
  return {
    vacancies: {
      total: stats.vacancies?.total_vacancies || 0,
      open: stats.vacancies?.open_vacancies || 0,
      draft: stats.vacancies?.draft_vacancies || 0,
      onHold: stats.vacancies?.on_hold_vacancies || 0,
      closed: stats.vacancies?.closed_vacancies || 0,
      cancelled: stats.vacancies?.cancelled_vacancies || 0,
      totalOpenings: stats.vacancies?.total_openings || 0,
    },
    applicants: {
      total: stats.applicants?.total || 0,
      byStage: stats.applicants?.by_stage || {},
    },
    interviews: {
      total: stats.interviews?.total_interviews || 0,
      scheduled: stats.interviews?.scheduled || 0,
      completed: stats.interviews?.completed || 0,
      cancelled: stats.interviews?.cancelled || 0,
      rescheduled: stats.interviews?.rescheduled || 0,
      noShow: stats.interviews?.no_show || 0,
      avgRating: stats.interviews?.avg_rating || null,
    },
    offers: {
      total: stats.offers?.total_offers || 0,
      draft: stats.offers?.draft || 0,
      pending: stats.offers?.pending || 0,
      sent: stats.offers?.sent || 0,
      accepted: stats.offers?.accepted || 0,
      rejected: stats.offers?.rejected || 0,
      withdrawn: stats.offers?.withdrawn || 0,
      expired: stats.offers?.expired || 0,
      avgSalary: stats.offers?.avg_salary || null,
    },
  };
};

export default {
  mapVacancyToDTO,
  mapVacanciesToDTO,
  mapApplicantToDTO,
  mapApplicantsToDTO,
  mapStageToDTO,
  mapStagesToDTO,
  mapInterviewToDTO,
  mapInterviewsToDTO,
  mapOfferToDTO,
  mapOffersToDTO,
  mapDashboardStatsToDTO,
};