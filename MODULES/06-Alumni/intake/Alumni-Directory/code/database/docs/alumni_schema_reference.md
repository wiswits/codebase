# WisWits Alumni Directory — Database Schema Reference

**Module:** Alumni Directory  
**Module Code:** STL-ALU  
**Module Key:** alumni  
**Database:** MariaDB  
**Implementation:** Scratch / Demo  
**Owner:** Khushboo — Team Lead / Database / Integration  

---

## 1. Purpose

This document defines the database structure used by the scratch
WisWits Alumni Directory implementation.

The database supports:

- Alumni Directory
- Alumni Profile
- Search
- Filters
- Batch View
- Dashboard Statistics
- Pagination
- Organization/Tenant Isolation

The database is designed for the standalone module integration stage.

Final platform-specific reconciliation may be performed by the
Founder/CTO during platform integration.

---

## 2. Main Table

The Alumni Directory uses:

client_alumni_profiles

This table stores the approved alumni profile information required by
the Alumni Directory API contract.

---

## 3. Schema

| Column | Type | Required | Purpose |
|---|---|---|---|
| id | BIGINT UNSIGNED | Yes | Alumni record identifier |
| org_id | BIGINT UNSIGNED | Yes | Organization/tenant ownership |
| first_name | VARCHAR(100) | Yes | Alumni first name |
| last_name | VARCHAR(100) | Yes | Alumni last name |
| email | VARCHAR(255) | No | Approved email |
| phone | VARCHAR(30) | No | Approved phone number |
| batch | VARCHAR(100) | Yes | Alumni batch |
| graduation_year | SMALLINT UNSIGNED | Yes | Graduation year |
| course | VARCHAR(150) | Yes | Course/program |
| status | ENUM | Yes | active/inactive |
| created_at | TIMESTAMP | Yes | Record creation time |
| updated_at | TIMESTAMP | Yes | Last update time |

---

## 4. API Mapping

Database naming follows snake_case.

API naming follows the Alumni API contract.

| Database | API |
|---|---|
| id | id |
| org_id | organizationId |
| first_name | firstName |
| last_name | lastName |
| email | email |
| phone | phone |
| batch | batch |
| graduation_year | graduationYear |
| course | course |
| status | status |
| created_at | createdAt |
| updated_at | updatedAt |

Database implementation details must not leak directly into frontend
components.

The backend mapper is responsible for this transformation.

---

## 5. Tenant Isolation

Every alumni record belongs to an organization through:

org_id

All Alumni repository queries must include organization scope.

Conceptual rule:

Authenticated Organization
        ↓
org_id
        ↓
Repository
        ↓
WHERE org_id = ?
        ↓
MariaDB

The frontend must never determine tenant security.

Organization IDs must not be hardcoded into production queries.

The development environment may provide temporary organization context
for standalone integration testing.

---

## 6. Indexes

The following access patterns are supported:

### Organization

idx_alumni_org_id

Supports organization-scoped directory retrieval.

### Graduation Year

idx_alumni_org_graduation_year

Supports:

Organization + Graduation Year

### Batch

idx_alumni_org_batch

Supports:

Organization + Batch

### Course

idx_alumni_org_course

Supports:

Organization + Course

### Status

idx_alumni_org_status

Supports organization-scoped status filtering.

### Name

idx_alumni_name

Supports organization-scoped alumni name retrieval/search patterns.

---

## 7. Search

The Alumni API may support search across approved fields such as:

- First name
- Last name
- Email

Search queries must:

- remain organization scoped;
- use parameterized SQL;
- validate incoming search values;
- avoid direct string concatenation of user input.

---

## 8. Pagination

Directory queries support:

page
limit

Conceptual SQL:

LIMIT ? OFFSET ?

Where:

offset = (page - 1) * limit

The backend is responsible for validating pagination values.

---

## 9. Filtering

Approved filters include:

- batch
- graduationYear
- course

Database equivalents:

batch
graduation_year
course

All filters must remain scoped by org_id.

---

## 10. Dashboard Statistics

Dashboard statistics must be calculated from real database records.

Supported statistics may include:

- Total alumni
- Active alumni
- Alumni grouped by batch
- Alumni grouped by graduation year
- Alumni grouped by course

Statistics must always be organization scoped.

---

## 11. Batch View

Batch information must be derived from Alumni records.

Example:

SELECT
    batch,
    COUNT(*) AS total
FROM client_alumni_profiles
WHERE org_id = ?
GROUP BY batch;

The batch endpoint must not expose another organization's records.

---

## 12. Parameterized SQL

All dynamic values must use mysql2/MariaDB parameter placeholders.

Correct:

WHERE org_id = ?

Incorrect:

WHERE org_id = ${orgId}

User-controlled values must never be concatenated directly into SQL.

---

## 13. Seed Data

Development seed data is located at:

database/seeds/alumni_directory_seed.sql

The seed contains synthetic records only.

Organization 1 and Organization 2 records are intentionally included
so tenant-isolation behavior can be tested.

The seed data must never be interpreted as production alumni data.

---

## 14. Migration

Migration:

database/migrations/001_create_alumni_directory_tables.sql

The migration:

- creates client_alumni_profiles;
- uses InnoDB;
- uses utf8mb4;
- defines tenant ownership;
- creates required indexes;
- does not select a database using USE;
- does not contain production credentials.

---

## 15. Integration Flow

MariaDB
    ↓
Alumni Repository
    ↓
Alumni Service
    ↓
Alumni Controller
    ↓
REST API
    ↓
Frontend Alumni API Service
    ↓
Alumni UI

Frontend code must never communicate directly with MariaDB.

---

## 16. Final Database Acceptance

Database integration is considered successful when:

- migration executes successfully;
- client_alumni_profiles exists;
- seed data inserts successfully;
- Organization 1 data can be retrieved;
- Organization 2 data can be retrieved separately;
- organization filtering prevents cross-tenant retrieval;
- search works;
- batch filtering works;
- graduation-year filtering works;
- course filtering works;
- pagination works;
- profile retrieval works;
- statistics queries work;
- backend/API field mapping works;
- all dynamic SQL values are parameterized.