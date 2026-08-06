/**
 * Offer DTO (Data Transfer Object)
 * Used for API responses
 */

export class OfferDTO {
  constructor(offer) {
    this.id = offer.id;
    this.applicantId = offer.applicant_id;
    this.vacancyId = offer.vacancy_id;
    this.offerReference = offer.offer_reference;
    this.offerDate = offer.offer_date;
    this.joiningDate = offer.joining_date;
    this.designation = offer.designation;
    this.department = offer.department;
    this.employmentType = offer.employment_type;
    this.workMode = offer.work_mode;
    this.workLocation = offer.work_location;
    this.salary = offer.salary;
    this.bonus = offer.bonus;
    this.probationMonths = offer.probation_months;
    this.reportingManager = offer.reporting_manager;
    this.offerDocument = offer.offer_document;
    this.status = offer.status;
    this.acceptedOn = offer.accepted_on;
    this.remarks = offer.remarks;
    this.applicantName = offer.applicant_name;
    this.applicantEmail = offer.applicant_email;
    this.applicantPhone = offer.applicant_phone;
    this.jobTitle = offer.job_title;
    this.vacancyCode = offer.vacancy_code;
    this.department = offer.vacancy_department || offer.department;
    this.createdBy = offer.created_by;
    this.updatedBy = offer.updated_by;
    this.createdAt = offer.created_at;
    this.updatedAt = offer.updated_at;
  }

  static fromEntity(offer) {
    if (!offer) return null;
    return new OfferDTO(offer);
  }

  static fromEntities(offers) {
    if (!offers || !Array.isArray(offers)) return [];
    return offers.map(o => new OfferDTO(o));
  }
}

/**
 * Create Offer Request DTO
 */
export class CreateOfferRequestDTO {
  constructor(data) {
    this.applicant_id = data.applicantId || data.applicant_id;
    this.vacancy_id = data.vacancyId || data.vacancy_id;
    this.offer_reference = data.offerReference || data.offer_reference;
    this.offer_date = data.offerDate || data.offer_date;
    this.joining_date = data.joiningDate || data.joining_date;
    this.designation = data.designation;
    this.department = data.department;
    this.employment_type = data.employmentType || data.employment_type;
    this.work_mode = data.workMode || data.work_mode;
    this.work_location = data.workLocation || data.work_location;
    this.salary = data.salary;
    this.bonus = data.bonus;
    this.probation_months = data.probationMonths || data.probation_months;
    this.reporting_manager = data.reportingManager || data.reporting_manager;
    this.offer_document = data.offerDocument || data.offer_document;
    this.status = data.status;
    this.remarks = data.remarks;
  }
}

/**
 * Update Offer Status Request DTO
 */
export class UpdateOfferStatusDTO {
  constructor(data) {
    this.status = data.status;
    this.accepted_on = data.acceptedOn || data.accepted_on;
    this.remarks = data.remarks;
  }
}

export default OfferDTO;