# WisWits Registration Management
## Database Schema Reference

**Module:** Registration Management  
**Database:** MariaDB  
**Implementation Location:** `final/database`  
**Purpose:** Final integrated Registration Management persistence layer

---

## 1. Overview

The Registration Management database supports three primary persistence
responsibilities:

1. Registration number-series management
2. Registration/admission register persistence
3. Registration document-checklist persistence

The database is designed for later integration with the main WisWits
multi-tenant SaaS database.

---

## 2. Important Contract Boundary

The CTO/Registration contract explicitly identifies:

```text
client_registration_number_series
```

as the registration number-series table.

The contract does not finalize the physical production table names for
the registration record and document checklist.

For this integrated implementation, the following names are used:

```text
client_registrations
client_registration_documents
```

These are implementation-level integration names and must not be
represented as CTO-mandated production names.

They may be mapped to the final WisWits schema during SaaS integration.

---

## 3. Tables

### `client_registration_number_series`

Purpose:

Maintains the current registration sequence for an organization and
academic session.

Key fields:

```text
id
organization_id
academic_session
prefix
current_sequence
created_at
updated_at
```

Unique boundary:

```text
organization_id + academic_session
```

Only one active sequence row can therefore exist for a given
organization/session combination in this implementation.

---

### `client_registrations`

Purpose:

Stores Registration Management records used by the Admission Register.

Important fields include:

```text
id
organization_id
registration_number
academic_session

student_first_name
student_middle_name
student_last_name

date_of_birth
gender

email
phone

guardian_name
guardian_phone

address_line
admission_class

status
notes

created_by
updated_by

created_at
updated_at
```

Registration number uniqueness is protected using:

```text
organization_id + registration_number
```

---

### `client_registration_documents`

Purpose:

Stores the document checklist associated with a registration.

Important fields:

```text
id
organization_id
registration_id

document_type
document_name
is_required

status
file_reference
remarks

verified_by
verified_at

created_at
updated_at
```

Each document type can occur once for a registration within an
organization in this implementation.

---

## 4. Relationships

```text
client_registration_number_series

       Organization / Session
                │
                │ supplies sequence
                ▼

       client_registrations
                │
                │ 1:N
                ▼
 client_registration_documents
```

`client_registration_documents.registration_id` references:

```text
client_registrations.id
```

Deleting a registration cascades to its checklist records in this
integration schema.

---

## 5. Registration Number Generation

The database does NOT independently generate the final registration
number.

The backend owns the number-generation operation.

Conceptual flow:

```text
Backend receives create-registration request
                 ↓
Determine trusted organization
                 ↓
Determine academic session
                 ↓
Lock/read organization-session sequence
                 ↓
Increment sequence
                 ↓
Construct registration number
                 ↓
Insert registration
                 ↓
Commit transaction
```

Example development format:

```text
ORG12-2026-0001
ORG12-2026-0002
ORG12-2026-0003
```

The final formatting convention must follow the agreed backend/module
contract.

---

## 6. Concurrency Requirement

Registration-number generation must be transactional.

Two concurrent registration requests must not receive the same
registration number.

The backend should perform sequence allocation inside a database
transaction using an appropriate row-locking/update strategy.

The database additionally protects:

```text
organization_id + registration_number
```

with a unique constraint.

---

## 7. Tenant Isolation

All module data is organization scoped.

Important tables therefore include:

```text
organization_id
```

Backend repository queries must use trusted tenant context.

A browser-supplied organization ID must not independently authorize
cross-organization access.

---

## 8. Host Database Integration

This standalone integration database intentionally does not create
duplicate:

```text
organizations
users
employees
students
academic_sessions
```

master tables.

During final WisWits SaaS integration, applicable identifiers should
be aligned with existing host tables.

Only then should additional production foreign keys be added.

---

## 9. Registration Status

The integration schema currently supports:

```text
draft
submitted
under_review
approved
rejected
cancelled
```

These values are implementation-level lifecycle values for the
integrated module.

If the final WisWits contract defines a different lifecycle, the
schema and backend must be aligned together.

---

## 10. Document Status

The integration schema currently supports:

```text
pending
submitted
verified
rejected
```

These values support the document-checklist workflow.

---

## 11. Security

Never commit production database credentials.

Real credentials belong in:

```text
.env
```

and `.env` must remain Git-ignored.

Only `.env.example` should be committed.

---

## 12. Migration Order

Run:

```text
migrations/001_create_registration_management.sql
```

Then:

```text
seeds/001_registration_demo_data.sql
```

Then:

```text
verification/verify_registration_management.sql
```

---

## 13. Final Architecture

```text
Registration Frontend
        ↓
Registration Backend API
        ↓
Backend Services
        ↓
Repositories
        ↓
MariaDB
```

The frontend must never communicate directly with MariaDB.

---

## 14. Status

This database is the persistence implementation used by the integrated
Registration Management module under:

```text
final/database
```

It must be tested with the final backend before the complete module is
considered integrated.