# Recruitment Module Relationships

## Entity Relationship Diagram

client_job_vacancies

↓

1

↓

N

client_applicants

↓

1

↓

N

client_applicant_stages

↓

1

↓

N

client_interviews

↓

1

↓

N

client_offer_letters

---

## Relationships

### Job Vacancy → Applicants

One vacancy can receive many applicants.

Foreign Key

client_applicants.vacancy_id

---

### Applicant → Stage History

Each applicant can move through multiple recruitment stages.

Foreign Key

client_applicant_stages.applicant_id

---

### Applicant → Interviews

One applicant can attend multiple interview rounds.

Foreign Key

client_interviews.applicant_id

---

### Applicant → Offer Letter

One applicant can receive one or more offer records.

Foreign Key

client_offer_letters.applicant_id

---

### Vacancy → Interviews

Every interview belongs to one vacancy.

Foreign Key

client_interviews.vacancy_id

---

### Vacancy → Offer Letters

Every offer belongs to a vacancy.

Foreign Key

client_offer_letters.vacancy_id

---

## Multi-Tenant Design

Every table contains

organization_id

All backend queries must always filter by organization_id.