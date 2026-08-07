# Intake — Registration Management

## 1. Document Purpose

This document defines the complete engineering execution plan for
building the WisWits Registration Management module from scratch.

At the beginning of this implementation, we assume that the working
module contains:

- No Registration frontend
- No Registration backend
- No Registration APIs
- No Registration database tables
- No Registration test data
- No Registration integration

Everything required for Registration Management will therefore be
implemented as a new module.

This is an ENGINEERING BUILD PLAN.

It converts approved requirements into:

Requirement
    ↓
Architecture
    ↓
Frontend
    ↓
Backend
    ↓
Database
    ↓
API Contract
    ↓
Team Assignment
    ↓
Parallel Development
    ↓
Integration
    ↓
Testing
    ↓
Final Delivery

---

# 2. Module Identity

Module Name:
Registration Management

Module ID:
STL-REG

Module Key:
admissions_registration

Functional Area:
Student Life / Admissions Registration

Priority:
P4

Development Type:
From-Scratch Module Development

Target Platform:
WisWits Unified SaaS

---

# 3. Team

## Team Lead

Khushboo

Responsibilities:

- Requirement interpretation
- Module planning
- Architecture coordination
- API contract approval
- MariaDB design/integration
- Work allocation
- Git/PR review
- Integration
- Testing coordination
- Final module assembly
- Final acceptance

---

## Frontend Developer 1

Sunidhi

Primary Responsibility:

Registration Dashboard
+
Admission Register

---

## Frontend Developer 2

Ankit

Primary Responsibility:

Registration Details
+
Registration Workflow
+
Document Checklist

---

## Backend Developer 1

Neha

Primary Responsibility:

Core Registration APIs
+
Registration Number Series
+
Admission Register backend

---

## Backend Developer 2

Jatin

Primary Responsibility:

Registration Details APIs
+
Document Checklist APIs
+
Supporting validation/business logic

---

# 4. Source of Requirements

The module must not be designed from personal assumptions.

FR-REG-001 — Registration Number Series

FR-REG-002 — Admission Register

FR-REG-003 — Document Checklist


- module registration
- registration number strategy
- database integrity
- permission model
- tenant awareness
- integration conventions

---

## Engineering Execution Plan

Defines HOW development happens:

- shared contract first
- frontend/backend/database parallel development
- feature branches
- Pull Requests
- Team Lead review
- integration
- correction cycle
- testing
- final merge

---

# 5. What Are We Building?

Registration Management provides the administrative workflow required
to formally register a student inside WisWits.

The module revolves around three capabilities:

1. Registration Number Management
2. Admission Register
3. Document Checklist

Conceptually:

New Student Registration
        ↓
Student / Admission Information
        ↓
Registration Number
        ↓
Admission Register
        ↓
Document Checklist
        ↓
Registration Record
        ↓
Registration Completed

---

# 6. Important From-Scratch Assumption

For DEVELOPMENT we are starting with no Registration data.

Therefore we must create:

Frontend UI
+
Backend API
+
MariaDB schema
+
Development/seed data
+
Integration contracts

Development data may be created for testing.

Example test records may include:

- Students
- Academic sessions
- Registration records
- Registration number series
- Document checklist records

Test data must NOT be treated as production data.

---

# 7. Functional Requirement — FR-REG-001

## Registration Number Series

The system must support registration-number generation.

Approved technical direction:

ORG{id}-{session}-{seq}

Conceptual example:

ORG12-2026-0001

Next student:

ORG12-2026-0002

Next:

ORG12-2026-0003

---

# 8. Registration Number Rules

Registration number generation MUST occur on the backend.

Frontend must never permanently generate registration numbers.

The database must protect uniqueness.

Conceptual generation:

Organization
      +
Academic Session
      +
Sequence
      ↓
Registration Number

Example:

Organization ID = 12

Session = 2026

Sequence = 1

Result:

ORG12-2026-0001

---

# 9. Registration Series

The CTO technical direction identifies:

client_registration_number_series

as the registration-series data structure.

The implementation should support organization/session-scoped
sequence management according to the approved technical design.

Conceptually:

Organization 12
Session 2026
Current Sequence 24

Next registration:

ORG12-2026-0025

---

# 10. Functional Requirement — FR-REG-002

## Admission Register

The system must provide an administrative Admission Register.

For our from-scratch development environment, development records
will be created so this workflow can be built and tested.

The Admission Register should provide appropriate information such as:

- Registration Number
- Student
- Academic Session
- Class / applicable academic information
- Registration Status
- Document Status
- Registration Date
- Actions

Exact fields must follow the frozen database/API contract.

---

# 11. Admission Register Features

The frontend should support:

- List records
- Search
- Filters
- Pagination
- View registration
- Registration status
- Document status

Potential search fields:

- Student name
- Registration number

Potential filters:

- Academic session
- Registration status
- Document status

Only fields supported by the final API/database contract should be
implemented.

---

# 12. Functional Requirement — FR-REG-003

## Document Checklist

Each applicable registration should provide a document checklist.

Conceptually:

Student Registration

    ├── Birth Certificate
    ├── Previous Academic Record
    ├── Identity Document
    └── Other Required Document

The exact production document types and document-state model must
follow the approved contract.

The team must NOT independently invent production document
requirements.

For development/testing, configurable sample checklist records may be
used.

---

# 13. Registration Workflow

The expected user flow is:

Open Registration Management
        ↓
Open Admission Register
        ↓
Create / Select Registration
        ↓
Enter Required Student Information
        ↓
Select Academic Session
        ↓
Generate Registration Number
        ↓
Complete Document Checklist
        ↓
Validate Registration
        ↓
Save
        ↓
Registration Appears in Register

---

# 14. Proposed Main Screens

Registration Management
│
├── Registration Dashboard
│
├── Admission Register
│
├── New Registration
│
├── Registration Details
│
└── Document Checklist

The final routing structure must follow the existing WisWits
frontend conventions.

---

# 15. Registration Dashboard

Purpose:

Provide an operational overview of Registration Management.

Potential cards:

- Total Registrations
- Completed Registrations
- Pending Registrations
- Pending Documents

Potential actions:

- New Registration
- Open Admission Register
- View Pending Documents

Statistics must eventually come from backend data.

---

# 16. Admission Register Page

Primary administrative table.

Conceptual columns:

| Registration No. |
| Student |
| Academic Session |
| Class |
| Registration Date |
| Documents |
| Status |
| Actions |

Required functionality:

- Search
- Filters
- Pagination
- View Details
- Responsive layout
- Loading state
- Empty state
- Error state

---

# 17. New Registration Page

Purpose:

Create a new registration record.

Conceptual sections:

## Student Information

- Student Name
- Date of Birth
- Gender where required
- Contact information where required

## Academic Information

- Academic Session
- Class / academic placement where applicable

## Registration

- Registration Number
- Registration Date
- Registration Status

## Documents

- Required checklist

Final fields must be frozen before implementation.

---

# 18. Registration Details Page

Displays complete registration information.

Suggested sections:

Student Information

Academic Information

Registration Information

Document Checklist

Status

Administrative metadata where required

---

# 19. Frontend Architecture

Suggested module structure:

frontend/
└── modules/
    └── registration/
        ├── components/
        ├── pages/
        ├── hooks/
        ├── services/
        ├── types/
        └── utils/

The actual path must follow the current intern team's upstream workspacesitory.

Do not create a separate standalone frontend architecture.

---

# 20. Backend Architecture

Approved stack/conventions must be followed.

Conceptually:

backend/
└── modules/
    └── registration/
        ├── routes/
        ├── controllers/
        ├── services/
        ├── repositories/
        ├── validators/
        └── types/

Responsibilities must remain separated.

Route
  ↓
Controller
  ↓
Service
  ↓
Repository / Database
  ↓
MariaDB

Business logic should not be placed directly inside routes.

---

# 21. Database Architecture

Khushboo coordinates the MariaDB layer.

Registration-specific data may conceptually require:

registration number series

registration records

document checklist records

The exact table set must be frozen against the CTO specification
before migrations are finalized.

---

# 22. Registration Number Series Table

CTO-directed entity:

client_registration_number_series

Conceptual responsibilities:

- Organization
- Academic Session
- Prefix / formatting configuration where approved
- Current Sequence
- Created At
- Updated At

Critical constraints:

- Tenant aware
- Session aware
- Sequence safe
- Indexed appropriately
- Database integrity enforced

---

# 23. Registration Record

Because this implementation starts without Registration data, the
team needs a persistent registration record for development.

Its exact production mapping must be aligned with the approved
WisWits admissions architecture before final SaaS integration.

Conceptually the module needs to represent:

- Registration ID
- Organization
- Student
- Academic Session
- Registration Number
- Registration Date
- Registration Status
- Created By
- Created At
- Updated At

Do NOT finalize production table names independently from the approved
CTO/database contract.

---

# 24. Document Checklist Data

Conceptually the module must represent:

Registration
     ↓
Required Document
     ↓
Document State

Possible engineering fields:

- Registration reference
- Document type/reference
- State
- Verification metadata where approved
- Created At
- Updated At



# 25. API Contract

The Team Lead freezes API contracts BEFORE parallel implementation.

Conceptual capabilities required:

GET registration dashboard

GET registration records

GET registration record by ID

CREATE registration

GET registration number series

CREATE / UPDATE registration number series

GENERATE registration number

GET registration document checklist

UPDATE approved document state

Exact endpoint names must follow existing WisWits API conventions.

---

# 26. API Response Standard

Frontend developers and backend developers must use the SAME contract.

Conceptual successful response:

{
  "success": true,
  "message": "...",
  "data": {}
}

Conceptual list response:

{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}

Exact common response conventions should follow the WisWits
platform standard.

---

# 27. Permission Model

Approved Registration permissions:

admissions.registration.view

admissions.registration.manage

View permission:

- View dashboard
- View register
- View registration details

Manage permission:

- Create/manage registration
- Generate registration number
- Perform approved document operations
- Manage registration series where authorized

Backend enforcement is mandatory.

---

# 28. Tenant Isolation

WisWits is multi-tenant.

Every database/API operation must respect organization boundaries.

Organization A must not access Organization B's:

- registrations
- number series
- documents
- sequences

The authenticated tenant context must determine organization scope.

Never trust an arbitrary organization ID from the browser as proof of
tenant access.

---

# 29. TEAM WORK DIVISION

==================================================
SUNIDHI
==================================================

Primary ownership:

Registration Dashboard
+
Admission Register

Sunidhi builds:

- Registration dashboard
- Dashboard statistics UI
- Quick actions
- Admission Register
- Registration table
- Search
- Filters
- Pagination
- Status badges
- View action
- Loading states
- Empty states
- Error states
- Responsive UI

Suggested components:

RegistrationDashboard

RegistrationStats

RegistrationQuickActions

AdmissionRegister

RegistrationTable

RegistrationSearch

RegistrationFilters

RegistrationPagination

RegistrationStatusBadge

---

# 30. SUNIDHI — FOLDER OWNERSHIP

Conceptually:

registration/
├── pages/
│   ├── RegistrationDashboard
│   └── AdmissionRegister
│
└── components/
    ├── RegistrationStats
    ├── RegistrationQuickActions
    ├── RegistrationTable
    ├── RegistrationSearch
    ├── RegistrationFilters
    ├── RegistrationPagination
    └── RegistrationStatusBadge

Sunidhi must reuse the common WisWits design system.

Do not create a separate visual system for Registration.

---

# 31. ANKIT 

Primary ownership:

New Registration
+
Registration Details
+
Document Checklist

Ankit builds:

- New Registration form
- Student information UI
- Academic information UI
- Registration information UI
- Registration Details page
- Registration Number display
- Document Checklist
- Document status UI
- Form validation feedback
- Success state
- Error state
- Responsive behavior

Suggested components:

RegistrationForm

StudentInformationSection

AcademicInformationSection

RegistrationInformationSection

RegistrationDetails

RegistrationNumberCard

DocumentChecklist

DocumentChecklistItem

DocumentStatusBadge

---

# 32. ANKIT — FOLDER OWNERSHIP

Conceptually:

registration/
├── pages/
│   ├── NewRegistration
│   └── RegistrationDetails
│
└── components/
    ├── RegistrationForm
    ├── StudentInformationSection
    ├── AcademicInformationSection
    ├── RegistrationInformationSection
    ├── RegistrationNumberCard
    ├── DocumentChecklist
    ├── DocumentChecklistItem
    └── DocumentStatusBadge

Ankit does NOT implement permanent registration-number generation in
frontend code.

---

# 33. NEHA 

Primary ownership:

Core Registration Backend
+
Registration Number Series
+
Admission Register APIs

Neha builds:

- Registration module routes
- Registration controllers
- Registration services
- Registration listing
- Search
- Filters
- Pagination
- Registration Number Series
- Registration-number generation
- Dashboard aggregation where required
- Tenant validation
- Permission validation
- Input validation
- Standard responses

---

# 34. NEHA — BACKEND OWNERSHIP

Conceptually:

registration/
├── routes/
│
├── controllers/
│   ├── registration.controller
│   └── registrationSeries.controller
│
├── services/
│   ├── registration.service
│   └── registrationSeries.service
│
├── repositories/
│   ├── registration.repository
│   └── registrationSeries.repository
│
└── validators/

Exact filenames must follow project conventions.

---

# 35. JATIN

Primary ownership:

Registration Details
+
Document Checklist
+
Supporting Registration Operations

Jatin builds:

- Registration detail retrieval
- Registration creation support
- Document checklist retrieval
- Document-state operations
- Validation
- Error handling
- Registration/document relationship
- Permission checks
- Tenant checks
- Backend tests for assigned APIs

---

# 36. JATIN — BACKEND OWNERSHIP

Conceptually:

registration/
├── controllers/
│   └── registrationDocuments.controller
│
├── services/
│   └── registrationDocuments.service
│
├── repositories/
│   └── registrationDocuments.repository
│
└── validators/
    └── registrationDocuments.validator

Do not create two Registration backends.

---

# 37. KHUSHBOO 

Khushboo owns:

- Build plan
- Requirement freeze
- API contract
- Database contract
- MariaDB
- Team assignments
- Branch strategy
- Integration architecture
- Code review
- PR review
- API integration verification
- Database integration
- Testing
- Corrections
- Final acceptance
- SaaS assembly

Khushboo acts as the integration owner.

---

# 38. KHUSHBOO — DATABASE RESPONSIBILITY

Before backend persistence is finalized:

Khushboo prepares/reviews:

- Registration schema
- Registration Number Series schema
- Document checklist persistence
- Relationships
- Foreign keys
- Unique constraints
- Indexes
- Seed/test data
- Migrations

Backend developers consume this database contract.

They must not independently create conflicting schemas.

---

# 39. TEAM DEPENDENCY MAP

                     KHUSHBOO
               Contract + Database
                       |
          +------------+------------+
          |                         |
      FRONTEND                    BACKEND
          |                         |
    +-----+-----+             +-----+-----+
    |           |             |           |
 SUNIDHI      ANKIT         NEHA        JATIN
    |           |             |           |
Dashboard     Forms        Core APIs    Details
Register      Details      Series       Documents
Search        Documents    Listing      Validation
    |           |             |           |
    +-----------+-------------+-----------+
                       |
                       v
                   INTEGRATION
                       |
                       v
                     TESTING
                       |
                       v
                  FINAL REVIEW

---

# 40. PARALLEL DEVELOPMENT STRATEGY

After contracts are frozen:

Sunidhi
   ↓
Dashboard/Register using approved mock data

Ankit
   ↓
Registration/Details/Documents using approved mock data

Neha
   ↓
Core APIs + Number Series

Jatin
   ↓
Details + Documents APIs

Khushboo
   ↓
MariaDB + Coordination

All five work in parallel.

Frontend does NOT need to wait until backend is finished.

Mock data must match the frozen API contract.

---

# 41. GIT BRANCHES

Recommended branches:

feature/registration-frontend-sunidhi

feature/registration-frontend-ankit

feature/registration-backend-neha

feature/registration-backend-jatin

No developer should directly develop on stable main.

---

# 42. INDIVIDUAL WORKFLOW

Each developer follows:

Pull latest integration/develop state
        ↓
Open own feature branch
        ↓
Implement assigned scope
        ↓
Test locally
        ↓
Commit
        ↓
Push
        ↓
Create Pull Request
        ↓
Khushboo Review
        ↓
Corrections if required
        ↓
Integration

---

# 43. INTEGRATION ORDER

Recommended integration sequence:

1. Database foundation
2. Registration Number Series backend
3. Core Registration backend
4. Document backend
5. API testing
6. Admission Register frontend
7. New Registration frontend
8. Registration Details frontend
9. Document Checklist frontend
10. Dashboard integration
11. Search/filter/pagination
12. Permission testing
13. Tenant testing
14. Full workflow testing
15. UI refinement
16. Final review
17. Merge

---

# 44. END-TO-END TEST FLOW

Test Scenario:

Authorized user opens Registration Management.

        ↓

Dashboard loads.

        ↓

User opens Admission Register.

        ↓

Development registration records appear.

        ↓

User creates/selects a registration.

        ↓

Backend validates request.

        ↓

Registration number is generated.

        ↓

MariaDB stores valid unique data.

        ↓

Document checklist is displayed.

        ↓

Approved document operations work.

        ↓

Registration Details reflect current state.

        ↓

Admission Register reflects the registration.

PASS.

---

# 45. FAILURE TESTS

The module must also test:

- Duplicate registration number
- Invalid registration
- Missing required fields
- Unauthorized user
- Wrong organization
- Invalid academic session
- Invalid document operation
- API failure
- Database failure
- Empty register
- Search with no results

The frontend must display controlled states instead of crashing.

---

# 46. FRONTEND QUALITY REQUIREMENTS

Both frontend developers must provide:

- Professional WisWits design
- Consistent typography
- Consistent spacing
- Responsive layout
- Accessible forms
- Clear validation
- Loading states
- Empty states
- Error states
- Success feedback
- Search UX
- Filter UX
- Smooth interaction
- Classy/subtle animations only

Do not introduce unnecessary flashy animation.

---

# 47. BACKEND QUALITY REQUIREMENTS

Backend must provide:

- Clear routes
- Controllers
- Services
- Parameterized database queries
- Validation
- Permission enforcement
- Tenant isolation
- Predictable response structures
- Correct HTTP status handling
- Safe error responses
- Pagination
- Search/filter support
- Database transaction handling where required

---

# 48. SECURITY RULES

Never:

- Trust frontend validation alone
- Trust arbitrary organization IDs
- Expose database credentials
- Commit `.env`
- Build SQL through unsafe string concatenation
- Allow unauthorized management operations
- Generate critical identifiers only in browser code

All SQL must follow the approved safe database-access conventions.

---

# 49. DAILY TEAM REVIEW

At the daily review:

Sunidhi reports:

Dashboard/Register progress.

Ankit reports:

Registration/Details/Documents progress.

Neha reports:

Core APIs/Series progress.

Jatin reports:

Details/Documents backend progress.

Khushboo reports:

Database/integration status.

For each member record:

DONE

IN PROGRESS

BLOCKED

CORRECTION REQUIRED

READY FOR INTEGRATION

---

# 50. DEFINITION OF DONE — SUNIDHI

- [ ] Dashboard
- [ ] Admission Register
- [ ] Search
- [ ] Filters
- [ ] Pagination
- [ ] Status UI
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Responsive design
- [ ] API integration
- [ ] PR reviewed

---

# 51. DEFINITION OF DONE — ANKIT

- [ ] New Registration
- [ ] Registration Details
- [ ] Student information
- [ ] Academic information
- [ ] Registration information
- [ ] Document Checklist
- [ ] Validation UI
- [ ] Loading/error/success states
- [ ] Responsive design
- [ ] API integration
- [ ] PR reviewed

---

# 52. DEFINITION OF DONE — NEHA

- [ ] Core Registration APIs
- [ ] Registration Number Series
- [ ] Number generation
- [ ] Registration listing
- [ ] Search
- [ ] Filters
- [ ] Pagination
- [ ] Dashboard data where required
- [ ] Validation
- [ ] Permissions
- [ ] Tenant checks
- [ ] Database integration
- [ ] API tests
- [ ] PR reviewed

---

# 53. DEFINITION OF DONE — JATIN

- [ ] Registration Details API
- [ ] Registration creation support
- [ ] Document Checklist API
- [ ] Document operations
- [ ] Validation
- [ ] Permission checks
- [ ] Tenant checks
- [ ] Database integration
- [ ] API tests
- [ ] PR reviewed

---

# 54. DEFINITION OF DONE — KHUSHBOO

- [ ] Requirements frozen
- [ ] API contract frozen
- [ ] Database contract frozen
- [ ] MariaDB schema ready
- [ ] Team assignments completed
- [ ] PRs reviewed
- [ ] Frontend integrated
- [ ] Backend integrated
- [ ] Database integrated
- [ ] Permissions tested
- [ ] Tenant isolation tested
- [ ] End-to-end workflow passed
- [ ] Build passed
- [ ] Critical bugs resolved
- [ ] Final review completed
- [ ] Ready for WisWits integration

---
# Technology Stack & Engineering Standards

All team members MUST use the following approved technology stack.

The Registration Management module is part of the WisWits SaaS
platform and must not introduce a separate or incompatible stack.

---

## Frontend Stack

Frontend Developers:
- Sunidhi — Frontend Developer 1
- Ankit — Frontend Developer 2

Technology:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React

Frontend responsibilities include:

- Pages
- Reusable components
- Forms
- Tables
- Search
- Filters
- Pagination
- Loading states
- Empty states
- Error states
- Success feedback
- Responsive design
- API integration

### Frontend Rules

- Use TypeScript.
- Use reusable components.
- Do not duplicate components unnecessarily.
- Keep API calls inside the service/API layer.
- Do not hardcode production data.
- Mock data may be used during parallel development.
- Mock data MUST follow the approved API contract.
- Use the common WisWits design system.
- Maintain responsive behavior.
- Use subtle and professional animations only.
- Do not introduce another UI framework without approval.

---

## Backend Stack

Backend Developers:
- Neha — Backend Developer 1
- Jatin — Backend Developer 2

Technology:

- Node.js
- Express.js
- TypeScript
- REST APIs
- JWT-based authentication integration
- MariaDB integration

Backend architecture:

Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories / Data Access
   ↓
MariaDB

### Backend Rules

- Use TypeScript.
- Follow REST API conventions.
- Keep business logic inside services.
- Keep database operations out of route files.
- Validate all incoming data.
- Use parameterized database queries.
- Follow standard API response structures.
- Enforce authorization server-side.
- Enforce organization/tenant isolation server-side.
- Never trust frontend validation alone.
- Never expose database credentials.
- Do not introduce a second backend framework without approval.

---

## Database Stack

Database:
MariaDB

Database responsibilities:

- Registration schema
- Registration Number Series
- Registration records
- Document checklist persistence
- Relationships
- Foreign keys
- Unique constraints
- Indexes
- Migrations
- Seed/test data
- Data integrity

### Database Rules

- Use MariaDB.
- Use proper primary keys.
- Define foreign-key relationships.
- Add indexes where required.
- Enforce critical uniqueness at database level.
- Keep organization/tenant ownership in the schema.
- Use migrations for schema changes.
- Do not manually create conflicting schemas.
- Do not commit database credentials.
- Do not commit `.env`.

---

Frontend developers must NOT directly access MariaDB.


# Authentication & Authorization

The module must integrate with the WisWits authentication and
authorization architecture.

Approved Registration permissions:

admissions.registration.view

admissions.registration.manage

JWT/authentication context must be handled according to the common
WisWits platform architecture.

Do NOT build a separate Registration login system.

---

# Development Tools

Recommended development environment:

- Visual Studio Code
- Node.js
- npm
- Git
- GitHub
- MariaDB
- Postman or equivalent API testing tool
- Browser Developer Tools

---

# Git & Version Control

Repository:
WisWits

Development model:

main
  |
  +-- feature/registration-frontend-sunidhi
  |
  +-- feature/registration-frontend-ankit
  |
  +-- feature/registration-backend-neha
  |
  +-- feature/registration-backend-jatin

Each developer works only on their assigned feature branch.



# Environment Configuration

Environment-specific configuration must use environment variables.

Example categories:

DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD

API configuration and authentication secrets must also use
environment variables where applicable.

Actual credentials MUST NOT be committed.

Required structure:

.env.example    → committed
.env            → NOT committed

---

# Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| HTTP Client | Axios |
| Icons | Lucide React |
| Backend | Node.js + Express.js + TypeScript |
| API Architecture | REST |
| Database | MariaDB |
| Authentication | WisWits JWT/Auth Integration |
| Authorization | RBAC / Permission-Based |
| Version Control | Git + GitHub |
| API Testing | Postman / Equivalent |
| Package Manager | npm |

---

# Stack Enforcement Rule

All Registration Management development must remain compatible with
the approved WisWits technology stack.

Team members must NOT independently introduce:

- Next.js
- Angular
- Vue
- MongoDB
- PostgreSQL
- Firebase
- Another backend framework
- Another authentication system
- Another CSS/UI framework
- Another database ORM or major dependency

unless explicitly approved by the Team Lead / technical leadership.

The purpose of this restriction is to ensure that all individual work
can be integrated into one WisWits SaaS product without unnecessary
technology conflicts.
