# Recruitment Management Database Schema

## Module

Recruitment Management

## Database

MariaDB

## Table List

| Table | Description |
|--------|-------------|
| client_job_vacancies | Stores job vacancy information |
| client_applicants | Stores applicant details |
| client_applicant_stages | Tracks applicant stage history |
| client_interviews | Stores interview schedules and feedback |
| client_offer_letters | Stores offer letter information |

---

# client_job_vacancies

Primary Key

- id

Columns

- organization_id
- vacancy_code
- job_title
- department
- designation
- employment_type
- work_mode
- location
- number_of_openings
- experience_required
- salary_min
- salary_max
- currency
- job_description
- required_skills
- preferred_skills
- education_required
- application_start_date
- application_end_date
- expected_joining_date
- hiring_manager_id
- recruiter_id
- status
- remarks

Audit

- created_by
- updated_by
- created_at
- updated_at

Soft Delete

- is_deleted
- deleted_by
- deleted_at

---

# client_applicants

Primary Key

- id

Foreign Key

- vacancy_id → client_job_vacancies.id

Columns

- organization_id
- applicant_code
- first_name
- last_name
- full_name
- email
- phone
- alternate_phone
- gender
- date_of_birth
- current_city
- current_state
- current_country
- address
- highest_qualification
- specialization
- university
- graduation_year
- total_experience
- current_company
- current_designation
- current_ctc
- expected_ctc
- notice_period
- resume_file
- portfolio_url
- linkedin_url
- github_url
- current_stage
- application_source
- application_date
- recruiter_id
- status
- notes

Audit Fields

- created_by
- updated_by
- created_at
- updated_at

Soft Delete

- is_deleted
- deleted_by
- deleted_at

---

# client_applicant_stages

Primary Key

- id

Foreign Keys

- applicant_id → client_applicants.id
- vacancy_id → client_job_vacancies.id

Columns

- organization_id
- from_stage
- to_stage
- changed_by
- remarks
- changed_at

Audit Fields

- created_by
- updated_by
- created_at
- updated_at

Soft Delete

- is_deleted
- deleted_by
- deleted_at

---

# client_interviews

Primary Key

- id

Foreign Keys

- applicant_id
- vacancy_id

Columns

- organization_id
- interview_round
- interview_type
- interview_mode
- interview_date
- start_time
- end_time
- venue
- meeting_link
- interviewer_name
- interviewer_email
- interviewer_designation
- rating
- feedback
- recommendation
- status
- remarks

Audit Fields

- created_by
- updated_by
- created_at
- updated_at

Soft Delete

- is_deleted
- deleted_by
- deleted_at

---

# client_offer_letters

Primary Key

- id

Foreign Keys

- applicant_id
- vacancy_id

Columns

- organization_id
- offer_reference
- offer_date
- joining_date
- designation
- department
- employment_type
- work_mode
- work_location
- salary
- bonus
- probation_months
- reporting_manager
- offer_document
- status
- accepted_on
- remarks

Audit Fields

- created_by
- updated_by
- created_at
- updated_at

Soft Delete

- is_deleted
- deleted_by
- deleted_at