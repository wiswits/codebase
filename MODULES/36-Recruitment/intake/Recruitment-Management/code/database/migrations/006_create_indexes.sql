ALTER TABLE client_job_vacancies
ADD INDEX idx_vacancy_org_status (
    organization_id,
    status
);

ALTER TABLE client_job_vacancies
ADD INDEX idx_vacancy_department_status (
    organization_id,
    department,
    status
);

ALTER TABLE client_job_vacancies
ADD INDEX idx_vacancy_dates (
    application_start_date,
    application_end_date
);

ALTER TABLE client_job_vacancies
ADD INDEX idx_vacancy_recruiter (
    recruiter_id
);

ALTER TABLE client_applicants
ADD INDEX idx_applicant_org_stage (
    organization_id,
    current_stage
);

ALTER TABLE client_applicants
ADD INDEX idx_applicant_org_status (
    organization_id,
    status
);

ALTER TABLE client_applicants
ADD INDEX idx_applicant_org_vacancy (
    organization_id,
    vacancy_id
);

ALTER TABLE client_applicants
ADD INDEX idx_applicant_recruiter (
    recruiter_id
);

ALTER TABLE client_applicants
ADD INDEX idx_applicant_name (
    full_name
);

ALTER TABLE client_applicants
ADD INDEX idx_applicant_email (
    email
);

ALTER TABLE client_applicants
ADD INDEX idx_applicant_phone (
    phone
);

ALTER TABLE client_applicant_stages
ADD INDEX idx_stage_org_applicant (
    organization_id,
    applicant_id
);

ALTER TABLE client_applicant_stages
ADD INDEX idx_stage_org_to_stage (
    organization_id,
    to_stage
);

ALTER TABLE client_applicant_stages
ADD INDEX idx_stage_changed_at (
    changed_at
);

ALTER TABLE client_interviews
ADD INDEX idx_interview_org_date (
    organization_id,
    interview_date
);

ALTER TABLE client_interviews
ADD INDEX idx_interview_org_status (
    organization_id,
    status
);

ALTER TABLE client_interviews
ADD INDEX idx_interview_applicant_date (
    applicant_id,
    interview_date
);

ALTER TABLE client_interviews
ADD INDEX idx_interview_round (
    interview_round
);

ALTER TABLE client_offer_letters
ADD INDEX idx_offer_org_status (
    organization_id,
    status
);

ALTER TABLE client_offer_letters
ADD INDEX idx_offer_joining_date (
    joining_date
);

ALTER TABLE client_offer_letters
ADD INDEX idx_offer_applicant (
    applicant_id
);

ALTER TABLE client_offer_letters
ADD INDEX idx_offer_reference (
    offer_reference
);