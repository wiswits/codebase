/**
 * Applicant DTO (Data Transfer Object)
 * Used for API responses
 */

export class ApplicantDTO {
  constructor(applicant) {
    this.id = applicant.id;
    this.applicantCode = applicant.applicant_code;
    this.vacancyId = applicant.vacancy_id;
    this.firstName = applicant.first_name;
    this.lastName = applicant.last_name;
    this.fullName = applicant.full_name;
    this.email = applicant.email;
    this.phone = applicant.phone;
    this.alternatePhone = applicant.alternate_phone;
    this.gender = applicant.gender;
    this.dateOfBirth = applicant.date_of_birth;
    this.currentCity = applicant.current_city;
    this.currentState = applicant.current_state;
    this.currentCountry = applicant.current_country;
    this.address = applicant.address;
    this.highestQualification = applicant.highest_qualification;
    this.specialization = applicant.specialization;
    this.university = applicant.university;
    this.graduationYear = applicant.graduation_year;
    this.totalExperience = applicant.total_experience;
    this.currentCompany = applicant.current_company;
    this.currentDesignation = applicant.current_designation;
    this.currentCTC = applicant.current_ctc;
    this.expectedCTC = applicant.expected_ctc;
    this.noticePeriod = applicant.notice_period;
    this.resumeFile = applicant.resume_file;
    this.portfolioUrl = applicant.portfolio_url;
    this.linkedinUrl = applicant.linkedin_url;
    this.githubUrl = applicant.github_url;
    this.currentStage = applicant.current_stage;
    this.applicationSource = applicant.application_source;
    this.applicationDate = applicant.application_date;
    this.status = applicant.status;
    this.recruiterId = applicant.recruiter_id;
    this.notes = applicant.notes;
    this.jobTitle = applicant.job_title;
    this.department = applicant.department;
    this.vacancyCode = applicant.vacancy_code;
    this.createdBy = applicant.created_by;
    this.updatedBy = applicant.updated_by;
    this.createdAt = applicant.created_at;
    this.updatedAt = applicant.updated_at;
  }

  static fromEntity(applicant) {
    if (!applicant) return null;
    return new ApplicantDTO(applicant);
  }

  static fromEntities(applicants) {
    if (!applicants || !Array.isArray(applicants)) return [];
    return applicants.map(a => new ApplicantDTO(a));
  }
}

/**
 * Create Applicant Request DTO
 */
export class CreateApplicantRequestDTO {
  constructor(data) {
    this.vacancy_id = data.vacancyId || data.vacancy_id;
    this.first_name = data.firstName || data.first_name;
    this.last_name = data.lastName || data.last_name;
    this.full_name = data.fullName || data.full_name;
    this.email = data.email;
    this.phone = data.phone;
    this.alternate_phone = data.alternatePhone || data.alternate_phone;
    this.gender = data.gender;
    this.date_of_birth = data.dateOfBirth || data.date_of_birth;
    this.current_city = data.currentCity || data.current_city;
    this.current_state = data.currentState || data.current_state;
    this.current_country = data.currentCountry || data.current_country;
    this.address = data.address;
    this.highest_qualification = data.highestQualification || data.highest_qualification;
    this.specialization = data.specialization;
    this.university = data.university;
    this.graduation_year = data.graduationYear || data.graduation_year;
    this.total_experience = data.totalExperience || data.total_experience;
    this.current_company = data.currentCompany || data.current_company;
    this.current_designation = data.currentDesignation || data.current_designation;
    this.current_ctc = data.currentCTC || data.current_ctc;
    this.expected_ctc = data.expectedCTC || data.expected_ctc;
    this.notice_period = data.noticePeriod || data.notice_period;
    this.resume_file = data.resumeFile || data.resume_file;
    this.portfolio_url = data.portfolioUrl || data.portfolio_url;
    this.linkedin_url = data.linkedinUrl || data.linkedin_url;
    this.github_url = data.githubUrl || data.github_url;
    this.current_stage = data.currentStage || data.current_stage;
    this.application_source = data.applicationSource || data.application_source;
    this.application_date = data.applicationDate || data.application_date;
    this.status = data.status;
    this.recruiter_id = data.recruiterId || data.recruiter_id;
    this.notes = data.notes;
  }
}

export default ApplicantDTO;