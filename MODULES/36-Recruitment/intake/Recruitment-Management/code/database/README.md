# Recruitment Management Database

## Module

Recruitment Management

## Database

MariaDB

---

## Folder Structure

database/

├── migrations/

├── seeds/

├── docs/

└── README.md

---

## Migration Order

1. 001_create_job_vacancies.sql

2. 002_create_applicants.sql

3. 003_create_applicant_stages.sql

4. 004_create_interviews.sql

5. 005_create_offer_letters.sql

6. 006_create_indexes.sql

---

## Seed

Run

recruitment_seed.sql

after completing all migrations.

---

## Tables

- client_job_vacancies

- client_applicants

- client_applicant_stages

- client_interviews

- client_offer_letters

---

## Features

- Multi-tenant architecture

- Organization isolation

- Foreign key constraints

- Soft delete

- Audit fields

- Optimized indexes

- Recruitment stage tracking

- Interview scheduling

- Offer management

---

## Integration Notes

- Do not use USE database statements.

- All queries must filter using organization_id.

- Use shared query and transaction helpers.

- Authentication is handled by the shared middleware.

- Permissions are managed by the central RBAC system.

- Audit logs should be recorded for all create, update, and delete operations.

---

## Developed For

WisWits SaaS Platform

Recruitment Management Module

Database Layer