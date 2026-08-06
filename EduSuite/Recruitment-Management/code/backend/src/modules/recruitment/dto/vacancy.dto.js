/**
 * Vacancy DTO (Data Transfer Object)
 * Used for API responses
 */

export class VacancyDTO {
  constructor(vacancy) {
    this.id = vacancy.id;
    this.vacancyCode = vacancy.vacancy_code;
    this.jobTitle = vacancy.job_title;
    this.department = vacancy.department;
    this.designation = vacancy.designation;
    this.employmentType = vacancy.employment_type;
    this.workMode = vacancy.work_mode;
    this.location = vacancy.location;
    this.numberOfOpenings = vacancy.number_of_openings;
    this.experienceRequired = vacancy.experience_required;
    this.salaryMin = vacancy.salary_min;
    this.salaryMax = vacancy.salary_max;
    this.currency = vacancy.currency;
    this.jobDescription = vacancy.job_description;
    this.requiredSkills = vacancy.required_skills;
    this.preferredSkills = vacancy.preferred_skills;
    this.educationRequired = vacancy.education_required;
    this.applicationStartDate = vacancy.application_start_date;
    this.applicationEndDate = vacancy.application_end_date;
    this.expectedJoiningDate = vacancy.expected_joining_date;
    this.hiringManagerId = vacancy.hiring_manager_id;
    this.recruiterId = vacancy.recruiter_id;
    this.status = vacancy.status;
    this.remarks = vacancy.remarks;
    this.createdBy = vacancy.created_by;
    this.updatedBy = vacancy.updated_by;
    this.createdAt = vacancy.created_at;
    this.updatedAt = vacancy.updated_at;
  }

  static fromEntity(vacancy) {
    if (!vacancy) return null;
    return new VacancyDTO(vacancy);
  }

  static fromEntities(vacancies) {
    if (!vacancies || !Array.isArray(vacancies)) return [];
    return vacancies.map(v => new VacancyDTO(v));
  }
}

/**
 * Create Vacancy Request DTO
 */
export class CreateVacancyRequestDTO {
  constructor(data) {
    this.vacancy_code = data.vacancyCode || data.vacancy_code;
    this.job_title = data.jobTitle || data.job_title;
    this.department = data.department;
    this.designation = data.designation;
    this.employment_type = data.employmentType || data.employment_type;
    this.work_mode = data.workMode || data.work_mode;
    this.location = data.location;
    this.number_of_openings = data.numberOfOpenings || data.number_of_openings;
    this.experience_required = data.experienceRequired || data.experience_required;
    this.salary_min = data.salaryMin || data.salary_min;
    this.salary_max = data.salaryMax || data.salary_max;
    this.currency = data.currency;
    this.job_description = data.jobDescription || data.job_description;
    this.required_skills = data.requiredSkills || data.required_skills;
    this.preferred_skills = data.preferredSkills || data.preferred_skills;
    this.education_required = data.educationRequired || data.education_required;
    this.application_start_date = data.applicationStartDate || data.application_start_date;
    this.application_end_date = data.applicationEndDate || data.application_end_date;
    this.expected_joining_date = data.expectedJoiningDate || data.expected_joining_date;
    this.hiring_manager_id = data.hiringManagerId || data.hiring_manager_id;
    this.recruiter_id = data.recruiterId || data.recruiter_id;
    this.status = data.status;
    this.remarks = data.remarks;
  }
}

export default VacancyDTO;