# EduSuite Student Observations — Database

## Module

Student Observations

Module Code:

STL-OBS

Module Key:

student_observations

Developer:

Khushboo

Responsibility:

Team Lead / MariaDB / Database Architecture


## Purpose

This directory contains the fresh MariaDB database implementation
for the EduSuite Student Observations module.

The module supports two canonical observation types:

- anecdotal
- class_school

Both observation types use one common database model.


## Database Technology

MariaDB

Backend database driver:

mysql2

Final EduSuite backend access must use the platform shared database
helpers rather than creating a module-local connection pool.

No ORM is required by this module.


## Main Table

client_student_observations


## Core Fields

- id
- org_id
- student_id
- author_id
- observation_type
- content
- created_at
- updated_at


## Observation Types

Canonical database values:

anecdotal

class_school


## Tenant Isolation

Student Observations is organization scoped.

Every applicable backend database operation must use the authenticated
organization context.

Conceptually:

Authenticated User
        ↓
req.user.org_id
        ↓
Student Observations Backend
        ↓
Repository
        ↓
WHERE org_id = ?
        ↓
MariaDB

The frontend must never be treated as the authority for organization
ownership.


## Author Attribution

Every observation retains author_id.

The backend must obtain/validate author identity through the approved
platform authentication/user context.

The frontend must not be trusted to declare an arbitrary author as the
authoritative identity.


## Student Relationship

Every observation retains student_id.

The final EduSuite integration must validate the student reference
against the platform's approved student data boundary.

Exact production foreign-key targets are intentionally not guessed in
this standalone package.


## Foreign Keys

This standalone implementation does not invent foreign keys to unknown
parent-platform table names.

During EduSuite integration, the following logical references must be
mapped against the authoritative platform schema:

org_id
→ organization/tenant entity

student_id
→ student entity

author_id
→ authenticated user/staff entity


## Index Strategy

Indexes are designed around tenant-first query patterns:

- org_id
- org_id + student_id
- org_id + author_id
- org_id + observation_type
- org_id + created_at


## Migration

Standalone development migration:

migrations/001_create_student_observations.sql

IMPORTANT:

001 is a standalone package sequence.

When this module is incorporated into the main EduSuite migration
stream, the migration must be renamed to the next valid migration
sequence number.

Migration files must never contain:

USE <database>;


## Seed Data

Development seed:

seeds/001_student_observations_demo.sql

Seed data is fictional and intended only for local development/testing.

Do not run development seed data against production environments.


## Verification

Database verification queries:

tests/verify_student_observations.sql

These queries verify:

- table existence;
- schema;
- indexes;
- demo records;
- tenant filtering;
- student filtering;
- author filtering;
- observation-type filtering;
- timestamps;
- canonical observation types.


## Backend Integration Rules

The backend must use parameterized SQL.

Do not concatenate request values directly into SQL.

Example conceptual query:

SELECT *
FROM client_student_observations
WHERE org_id = ?
  AND student_id = ?;

The final module must use the EduSuite shared database helpers.

Do not create a Student Observations-specific mysql.createPool().


## Security

Student observations contain sensitive student information.

Database records must therefore remain:

- organization scoped;
- student associated;
- author attributed;
- accessible only through authorized backend operations.

Frontend filtering is not a security mechanism.


## Audit Boundary

Create and edit operations require integration with the parent
EduSuite audit infrastructure.

Audit data is not duplicated into the Student Observations table.

The backend/platform layer owns audit execution.


## Production Integration Notes

Before incorporation into the main EduSuite platform:

1. Confirm the next valid migration number.
2. Confirm authoritative organization table/reference.
3. Confirm authoritative student table/reference.
4. Confirm authoritative user/staff table/reference.
5. Add approved foreign keys where the host schema requires them.
6. Confirm shared database helper import path.
7. Confirm migration runner compatibility.
8. Verify organization isolation.
9. Verify backend API/database field alignment.
10. Run integration tests.


## Folder Structure

khushboo-database/
|
|-- migrations/
|   `-- 001_create_student_observations.sql
|
|-- schema/
|   `-- student_observations_schema.sql
|
|-- seeds/
|   `-- 001_student_observations_demo.sql
|
|-- tests/
|   `-- verify_student_observations.sql
|
|-- .env.example
|
`-- README.md


## Status

Fresh Student Observations MariaDB implementation prepared for
development verification and subsequent EduSuite platform alignment.