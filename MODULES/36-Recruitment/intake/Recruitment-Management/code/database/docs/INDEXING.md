# Recruitment Database Indexes

## client_job_vacancies

- idx_org
- idx_status
- idx_department
- idx_job_title
- idx_opening_dates
- idx_org_status
- idx_org_department
- idx_org_deleted

---

## client_applicants

- idx_org
- idx_vacancy
- idx_stage
- idx_status
- idx_application_date
- idx_recruiter
- idx_phone
- idx_org_stage
- idx_org_status
- idx_org_vacancy
- idx_org_deleted

---

## client_applicant_stages

- idx_org
- idx_applicant
- idx_vacancy
- idx_to_stage
- idx_changed_at
- idx_org_applicant
- idx_org_stage
- idx_org_deleted

---

## client_interviews

- idx_org
- idx_applicant
- idx_vacancy
- idx_interview_date
- idx_status
- idx_type
- idx_org_status
- idx_org_date
- idx_org_deleted

---

## client_offer_letters

- idx_org
- idx_applicant
- idx_vacancy
- idx_status
- idx_offer_date
- idx_joining_date
- idx_org_status
- idx_org_deleted

---

## Purpose

Indexes are used to improve query performance for:

- Vacancy listing
- Applicant search
- Stage tracking
- Interview scheduling
- Offer management
- Organization-based filtering