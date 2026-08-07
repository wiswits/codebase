# Intake — HR Recruitment Module Engineering Contract

## Module Information

**Module Number:** Module 8  
**Module Name:** HR Recruitment Management  
**Module ID:** HR-REC  
**Lane:** People & HR  
**Priority:** P4  
**Development Type:** Fresh Development From Zero  
**Module Key:** `hr_recruitment`

---

# 1. Purpose

The HR Recruitment Management module provides a complete digital workflow for managing recruitment activities inside WisWits.

The module will allow authorized HR users to:

- Create and manage job vacancies
- Maintain applicant records
- Track applicants through recruitment stages
- View applicants through a Kanban-style recruitment pipeline
- Schedule and manage interviews
- Manage the offer-letter workflow
- Search and filter vacancies and applicants

The complete module will be developed from zero.

No previous Recruitment, Employee Management, HR Recruitment, or similar implementation will be used as the development base.

Existing documents are used only as requirement and engineering guidance.

---

# 2. Development Rule — Build From Zero

This module MUST be implemented as a fresh module.

Developers must NOT:

- Copy an old Employee Management project
- Continue an old Recruitment implementation
- Reuse an old Recruitment database
- Depend on old applicant data
- Modify an unrelated previous intern project
- Copy old frontend/backend implementations
- Assume old APIs are available
- Build against undocumented previous behavior

The team will create:

- Fresh frontend
- Fresh backend
- Fresh database schema
- Fresh API implementation
- Fresh validation
- Fresh integration
- Fresh test data

The PRD and technical documents define WHAT the module must support.

Our engineering contract defines HOW our team will build it.

---

# 3. Team Assignment

## Frontend Team

### Ankit
Frontend Developer

Primary responsibility:

- Recruitment Overview/Dashboard
- Vacancy Management UI
- Vacancy List
- Vacancy Details
- Create Vacancy
- Edit Vacancy
- Vacancy search/filter
- Shared frontend components required by his screens

### Sunidhi
Frontend Developer

Primary responsibility:

- Applicant Management UI
- Applicant List
- Applicant Details
- Applicant Pipeline
- Kanban Board
- Interview Scheduling UI
- Offer Workflow UI
- Applicant search/filter
- Required UI states for her screens

Ankit and Sunidhi are building ONE frontend.

They are NOT building two independent Recruitment applications.

---

## Backend Team

### Jatin
Backend Developer

Primary responsibility:

- Vacancy APIs
- Applicant APIs
- Vacancy business logic
- Applicant record business logic
- Search/filter APIs
- Request validation
- Controllers
- Services
- Repository/data-access integration for assigned features

### Neha
Backend Developer

Primary responsibility:

- Applicant pipeline APIs
- Recruitment-stage APIs
- Interview APIs
- Offer workflow APIs
- Business validation
- Authorization checks
- Controllers
- Services
- Repository/data-access integration for assigned features

Jatin and Neha are building ONE backend.


---

## Khushboo

### Database + Integration + Implementation Coordination

Responsibilities:

- Database architecture
- MariaDB schema
- Table relationships
- Foreign keys
- Indexes
- Tenant isolation
- Database migrations/scripts
- Database seed/test data
- Frontend/backend contract verification
- Backend/database integration
- Frontend/backend integration
- Final module assembly
- Integration testing
- Bug fixing during integration
- Final verification
- Documentation
- Git preparation

---
# 3.0 Team Assignment & Tech Stack

All developers are working on the same HR Recruitment Management module.


| Team Member | Development Area | Primary Responsibility | Tech Stack |
|---|---|---|---|
| **Ankit** | Frontend | Recruitment Dashboard + Vacancy Management | Next.js + React + TypeScript + Tailwind CSS |
| **Sunidhi** | Frontend | Applicants + Pipeline + Interviews + Offers | Next.js + React + TypeScript + Tailwind CSS |
| **Jatin** | Backend | Vacancy APIs + Applicant APIs + Search/Filter | Node.js + Express.js + TypeScript + REST APIs |
| **Neha** | Backend | Pipeline + Interview APIs + Offer Workflow APIs | Node.js + Express.js + TypeScript + REST APIs |
| **Khushboo** | Database + Integration | Database Architecture + Integration + Final Assembly + Testing | MariaDB + SQL + Node.js/Express Integration + Git/GitHub |

---

## 3.1 Common Module Tech Stack

The complete Recruitment Management module will use the following standardized stack:

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- Fetch/Axios for API communication
- Responsive component-based architecture

### Backend

- Node.js
- Express.js
- TypeScript
- REST API architecture
- Layered architecture:
  - Routes
  - Controllers
  - Services
  - Repositories
  - Validators
- Environment-based configuration

### Database

- MariaDB
- SQL
- Foreign-key relationships
- Indexed queries where applicable
- Organization-scoped records
- Migration/schema scripts
- Seed/test data

### Integration

Frontend
    ↓
REST API
    ↓
Node.js + Express.js + TypeScript
    ↓
Service Layer
    ↓
Repository Layer
    ↓
MariaDB

### Development & Version Control

- VS Code
- Git
- GitHub
- npm
- PowerShell / Terminal
- Feature branches
- Integration testing before final merge

---

## 3.2 Tech Stack Rule

The assigned technology stack is mandatory for this module.

Developers must NOT independently switch to another framework, backend technology, or database.

For example:

- Do not replace Next.js with another frontend framework.
- Do not replace Express.js with another backend framework.
- Do not replace MariaDB with MongoDB, PostgreSQL, Firebase, or another database.
- Do not create a separate standalone application using a different stack.
- Do not introduce unnecessary dependencies without coordination.
- Do not change the agreed API structure independently.

The objective is to ensure that all five developers' work can be integrated into ONE final Recruitment Management module without technology conflicts.

# 4. Mandatory Functional Requirements

The module must implement:

## FR-REC-001 — Vacancy List

Authorized HR users must be able to view job vacancies.

---

## FR-REC-002 — Applicant Records

The system must maintain structured applicant records.

---

## FR-REC-003 — Applicant Pipeline

Applicants must be trackable through the recruitment lifecycle.

---

## FR-REC-004 — Kanban-Style Stage View

Recruitment stages must be visually manageable through a Kanban-style interface.

---

## FR-REC-005 — Interview Scheduling

Authorized HR users must be able to schedule and manage interviews.

---

## FR-REC-006 — Offer-Letter Workflow

The system must support the recruitment offer workflow.

---

## FR-REC-007 — Search and Filter

Vacancies and applicant records must provide appropriate search/filter functionality.

---

# 5. Core Recruitment Workflow

The module should support the following overall workflow:

HR User
    ↓
Recruitment Dashboard
    ↓
Create Vacancy
    ↓
Vacancy Published / Open
    ↓
Applicant Added
    ↓
Applicant Linked to Vacancy
    ↓
Applicant Pipeline
    ↓
Recruitment Stage
    ↓
Interview Scheduled
    ↓
Interview Completed
    ↓
Candidate Decision
    ↓
Offer Workflow
    ↓
Recruitment Outcome

---

# 6. Proposed Recruitment Stages

For our fresh implementation, the initial recruitment pipeline will use:

1. Applied
2. Screening
3. Shortlisted
4. Interview Scheduled
5. Interviewed
6. Selected
7. Offered
8. Hired
9. Rejected

These stages belong to our implementation contract.

They may be refined during integration if required, but frontend, backend, and database must use the SAME values.

---

# 7. Frontend Scope

The frontend must provide a professional HR Recruitment workspace.

Required areas:

## Recruitment Overview

The dashboard should provide useful recruitment information such as:

- Total vacancies
- Open vacancies
- Total applicants
- Shortlisted candidates
- Interviews scheduled
- Offers pending
- Recently added applicants
- Upcoming interviews

Dashboard values must eventually come from real API/database data.

---

# 8. Vacancy Management UI

Required pages/components:

- Vacancy List
- Vacancy Details
- Create Vacancy
- Edit Vacancy
- Vacancy Status
- Vacancy Search
- Vacancy Filters

Suggested vacancy information:

- Job title
- Department
- Employment type
- Location
- Number of openings
- Description
- Requirements
- Opening date
- Closing date
- Status

Suggested statuses:

- Draft
- Open
- Closed
- On Hold

Frontend and backend must use identical status values.

---

# 9. Applicant Management UI

Required:

- Applicant List
- Applicant Details
- Add Applicant
- Edit Applicant
- Applicant status/stage
- Applicant search
- Applicant filtering

Applicant information may include:

- First name
- Last name
- Email
- Phone
- Vacancy
- Experience
- Qualification
- Current stage
- Application date
- Resume/file reference
- Notes

---

# 10. Applicant Pipeline

The Recruitment Pipeline is a core feature.

The frontend must provide a Kanban-style board.

Example:

Applied
   |
   ├── Candidate A
   └── Candidate B

Screening
   |
   └── Candidate C

Shortlisted
   |
   └── Candidate D

Interview
   |
   └── Candidate E

Selected
   |
   └── Candidate F

Rejected
   |
   └── Candidate G

Applicant stage changes must eventually persist through the backend.

The UI must NOT show a successful stage change if the backend operation fails.

---

# 11. Interview Management

Required interview functionality:

- Schedule interview
- View scheduled interviews
- View interview details
- Update interview
- Record interview status
- Record interview notes/feedback where applicable

Suggested information:

- Applicant
- Vacancy
- Interview date
- Start time
- Interview mode
- Location / meeting reference
- Interviewer
- Status
- Notes

Suggested interview modes:

- In Person
- Online
- Phone

Suggested statuses:

- Scheduled
- Completed
- Cancelled
- Rescheduled

---

# 12. Offer Workflow

Required:

- Initiate offer
- View offer details
- Update offer status
- Track offer outcome

Suggested statuses:

- Draft
- Pending
- Sent
- Accepted
- Declined
- Withdrawn

The offer workflow does NOT require the frontend/backend interns to build a completely separate document-generation platform.

---

# 13. Frontend Architecture

The frontend should be modular.

Suggested structure:

src/
└── modules/
    └── recruitment/
        │
        ├── components/
        │   ├── dashboard/
        │   ├── vacancies/
        │   ├── applicants/
        │   ├── pipeline/
        │   ├── interviews/
        │   └── offers/
        │
        ├── hooks/
        │
        ├── services/
        │
        ├── types/
        │
        ├── utils/
        │
        └── constants/

Pages/routes should remain separate from reusable module components.

---

# 14. Frontend Responsibilities — Ankit

Ankit owns:

## Recruitment Overview

- Dashboard header
- Recruitment statistics
- Quick actions
- Recent vacancy information
- Responsive layout

## Vacancy Management

- Vacancy list
- Vacancy cards/table
- Vacancy details
- Create vacancy form
- Edit vacancy form
- Vacancy status badge
- Search
- Filters
- Empty state
- Loading state
- Error state

Ankit must keep his code modular and reusable.

---

# 15. Frontend Responsibilities — Sunidhi

Sunidhi owns:

## Applicant Management

- Applicant list
- Applicant detail
- Add applicant
- Edit applicant
- Applicant status display

## Pipeline

- Kanban board
- Stage columns
- Applicant cards
- Stage-change interaction

## Interviews

- Interview list
- Schedule interview form
- Interview details
- Interview status

## Offers

- Offer information
- Offer status
- Offer workflow screens

Sunidhi must also implement:

- Loading states
- Empty states
- Error states
- Success feedback
- Responsive behavior

for her assigned areas.

---

# 16. Frontend Shared Rules

Ankit and Sunidhi must coordinate shared:

- Buttons
- Cards
- Form fields
- Modals
- Status badges
- Search bars
- Filter controls
- Loading states
- Error states
- Empty states
- Confirmation dialogs

They must NOT independently create conflicting versions of the same component.

---

# 17. UI/UX Requirements

The module must follow the shared WisWits visual language.

Use:

- Professional administrative dashboard
- Clear hierarchy
- Consistent spacing
- Readable typography
- Professional cards
- Consistent buttons
- Clear tables
- Proper hover states
- Visible focus states
- Smooth interactions
- Professional modals
- Consistent status badges
- Responsive layouts
- Clear error messages
- Clear success feedback

Avoid:

- Excessive gradients
- Random colors
- Oversized animations
- Decorative effects that reduce usability
- Inconsistent page styles

---

# 18. Responsive Requirements

The module must support:

- Desktop
- Tablet
- Mobile

Special attention must be given to the Kanban board.

On smaller screens, the board may use horizontal scrolling or another responsive representation without losing recruitment-stage information.

---

# 19. Backend Architecture

The backend should follow a layered modular structure.

Suggested structure:

src/
└── modules/
    └── recruitment/
        │
        ├── controllers/
        ├── services/
        ├── repositories/
        ├── routes/
        ├── validators/
        ├── types/
        └── utils/

Recommended flow:

Route
  ↓
Controller
  ↓
Validation
  ↓
Service
  ↓
Repository
  ↓
MariaDB

Business logic should NOT be placed directly inside route definitions.

---

# 20. API Namespace

Recruitment APIs must use:

/api/v1/hr/recruitment

All Recruitment APIs must remain under this namespace.

---

# 21. Proposed API Contract

The following contract will be used by our fresh implementation.

## Dashboard

GET
/api/v1/hr/recruitment/dashboard

---

## Vacancies

GET
/api/v1/hr/recruitment/vacancies

POST
/api/v1/hr/recruitment/vacancies

GET
/api/v1/hr/recruitment/vacancies/:vacancyId

PATCH
/api/v1/hr/recruitment/vacancies/:vacancyId

---

## Applicants

GET
/api/v1/hr/recruitment/applicants

POST
/api/v1/hr/recruitment/applicants

GET
/api/v1/hr/recruitment/applicants/:applicantId

PATCH
/api/v1/hr/recruitment/applicants/:applicantId

---

## Applicant Pipeline

GET
/api/v1/hr/recruitment/pipeline

PATCH
/api/v1/hr/recruitment/applicants/:applicantId/stage

---

## Interviews

GET
/api/v1/hr/recruitment/interviews

POST
/api/v1/hr/recruitment/interviews

GET
/api/v1/hr/recruitment/interviews/:interviewId

PATCH
/api/v1/hr/recruitment/interviews/:interviewId

---

## Offers

GET
/api/v1/hr/recruitment/offers

POST
/api/v1/hr/recruitment/offers

GET
/api/v1/hr/recruitment/offers/:offerId

PATCH
/api/v1/hr/recruitment/offers/:offerId

---

# 22. Standard API Response

Successful API operations should use a predictable response structure.

Example:

{
  "success": true,
  "message": "Applicants retrieved successfully.",
  "data": []
}

Failure:

{
  "success": false,
  "message": "Unable to retrieve applicants."
}

Frontend developers must not invent a different response structure.

---

# 23. Search and Filtering

The API should support appropriate query parameters.

Example:

GET /api/v1/hr/recruitment/applicants?search=riya

GET /api/v1/hr/recruitment/applicants?stage=shortlisted

GET /api/v1/hr/recruitment/vacancies?status=open

Possible filters:

- Search text
- Vacancy
- Department
- Status
- Recruitment stage
- Interview status
- Date range

Only applicable filters need to be implemented on each screen.

---

# 24. Backend Responsibilities — Jatin

Jatin owns:

## Vacancy Backend

- Create vacancy
- List vacancies
- Get vacancy
- Update vacancy
- Search vacancies
- Filter vacancies
- Vacancy validation

## Applicant Backend

- Create applicant
- List applicants
- Get applicant
- Update applicant
- Search applicants
- Filter applicants
- Applicant validation

He is responsible for:

- Routes
- Controllers
- Services
- Repositories
- Validators
- Error handling

for these assigned areas.

---

# 25. Backend Responsibilities — Neha

Neha owns:

## Pipeline

- Pipeline retrieval
- Applicant stage updates
- Stage validation

## Interviews

- Schedule interview
- List interviews
- Get interview
- Update interview
- Interview validation

## Offers

- Create/initiate offer
- List offers
- Get offer
- Update offer
- Offer status handling

Neha is responsible for:

- Routes
- Controllers
- Services
- Repositories
- Validators
- Error handling

for these assigned areas.

---

# 26. Backend Shared Rules

Jatin and Neha must:

- Use one backend project
- Use one API namespace
- Use the same response format
- Use the same error structure
- Use the same database contract
- Use parameterized SQL
- Avoid duplicated utilities
- Coordinate shared types
- Coordinate shared middleware
- Avoid route collisions

---

# 27. Database

Database engine:

MariaDB

Database development is owned by Khushboo.

The Recruitment database will be created fresh.

---

# 28. Recruitment Tables

The module will use the following primary tables:

client_job_vacancies

client_applicants

client_applicant_stages

client_interviews

client_offer_letters

These table names align with the technical requirements.

Their actual schema will be created fresh for our implementation.

---

# 29. client_job_vacancies

Purpose:

Stores Recruitment vacancies.

Suggested fields:

- id
- organization_id
- job_title
- department
- employment_type
- location
- openings
- description
- requirements
- opening_date
- closing_date
- status
- created_by
- created_at
- updated_at

---

# 30. client_applicants

Purpose:

Stores applicant records.

Suggested fields:

- id
- organization_id
- vacancy_id
- first_name
- last_name
- email
- phone
- qualification
- experience_years
- resume_reference
- current_stage
- application_date
- notes
- created_at
- updated_at

---

# 31. client_applicant_stages

Purpose:

Maintains applicant recruitment-stage history.

Suggested fields:

- id
- organization_id
- applicant_id
- from_stage
- to_stage
- changed_by
- remarks
- changed_at

Stage history must not be replaced by frontend-only state.

---

# 32. client_interviews

Purpose:

Stores interview scheduling and interview status.

Suggested fields:

- id
- organization_id
- applicant_id
- vacancy_id
- interview_date
- start_time
- interview_mode
- location_reference
- interviewer_name
- status
- notes
- created_by
- created_at
- updated_at

---

# 33. client_offer_letters

Purpose:

Stores offer-workflow records.

Suggested fields:

- id
- organization_id
- applicant_id
- vacancy_id
- offer_reference
- offer_date
- joining_date
- status
- remarks
- created_by
- created_at
- updated_at

---

# 34. Database Relationships

Conceptual relationships:

client_job_vacancies
        |
        | 1
        |
        | N
client_applicants
        |
        ├──────── client_applicant_stages
        |
        ├──────── client_interviews
        |
        └──────── client_offer_letters

Every applicable record must remain organization-scoped.

---

# 35. Tenant Isolation

Recruitment data belongs to an organization.

Every applicable table must include:

organization_id

Backend queries must enforce organization isolation.

Example:

Organization 12 requests applicants.

The backend must retrieve only applicants belonging to Organization 12.

The frontend must never be responsible for tenant security.

---

# 36. Permission Contract

The Recruitment module uses:

hr.recruitment.view

hr.recruitment.manage

### hr.recruitment.view

Allows access to permitted Recruitment information.

### hr.recruitment.manage

Allows authorized Recruitment-management operations.

Authorization must be enforced by the backend.

Hiding a button in the frontend is NOT authorization.

---

# 37. Validation Rules

Backend validation is authoritative.

Validation must cover applicable cases such as:

- Required vacancy fields
- Valid vacancy ID
- Valid applicant ID
- Valid organization
- Valid recruitment stage
- Valid dates
- Valid interview information
- Valid offer status
- Unauthorized operations
- Invalid request payloads

Frontend validation exists primarily for user experience.

---

# 38. Error Handling

Errors must be clear and consistent.

Examples:

- Vacancy not found
- Applicant not found
- Interview not found
- Invalid recruitment stage
- Unauthorized operation
- Invalid request
- Database operation failed

Never return a fake successful response after a failed database operation.

---

# 39. Loading / Empty / Error States

Applicable frontend screens must support:

## Loading

Example:

Loading applicants...

## Empty

Example:

No applicants found.

## Error

Example:

Unable to load applicants.

## Retry

Users should be able to retry recoverable requests where appropriate.

---

# 40. Frontend Mock Development

Frontend developers may initially use mock data while the backend is being developed.

However:

Mock data MUST follow the agreed API/type contract.

Example:

Frontend mock applicant:

{
  "id": 1,
  "vacancyId": 3,
  "firstName": "Riya",
  "lastName": "Kapoor",
  "email": "riya@example.com",
  "currentStage": "shortlisted"
}

The real backend response must follow the same agreed shape.

Mock-only fields must not silently become frontend dependencies.

---

# 41. Parallel Development

Development will happen simultaneously.

Contract
    |
    +-------------------+
    |                   |
Frontend             Backend
Ankit/Sunidhi        Jatin/Neha
    |                   |
Mocks               APIs
    |                   |
    +---------+---------+
              |
           Database
           Khushboo
              |
         Integration
              |
          Testing
              |
         Final Module

Nobody should wait unnecessarily for another layer when the contract is already available.

---

# 42. Git Working Rules

Each developer works only on their assigned branch.

Before starting:

git switch <your-branch>

Never work directly on main.

Do not push:

- node_modules
- .next
- dist
- .env
- build caches
- IDE temporary files
- logs
- local database files

Keep:

- Source code
- package.json
- lockfile
- .env.example
- migrations/schema
- documentation

---

# 43. Recommended Working Branches

Frontend:

ankit-recruitment-frontend

sunidhi-recruitment-frontend

Backend:

jatin-recruitment-backend

neha-recruitment-backend

Khushboo will handle database and final integration separately.

---

# 44. Integration Assembly

After individual work is complete, the final assembly should follow:

Recruitment-Management-Assembly/
│
├── incoming/
│   ├── ankit-frontend/
│   ├── sunidhi-frontend/
│   ├── jatin-backend/
│   └── neha-backend/
│
├── final/
│   ├── frontend/
│   ├── backend/
│   └── database/
│
├── contracts/
│   └── HR_RECRUITMENT_MODULE_CONTRACT.md
│
└── README.md

Incoming work must remain preserved.

The `final/` directory contains the integrated implementation.

---

# 45. Integration Flow

Final integration must prove:

Frontend
   ↓
Recruitment API
   ↓
Express Backend
   ↓
Validation
   ↓
Business Logic
   ↓
Repository
   ↓
MariaDB
   ↓
API Response
   ↓
Frontend Update

A frontend that works only with mocks is not considered integrated.

A backend that works only through isolated API testing is not considered fully integrated.

---

# 46. Minimum Integration Tests

The final team must test at least:

## Vacancy

- Create vacancy
- List vacancies
- Open vacancy details
- Edit vacancy
- Search vacancy
- Filter vacancy

## Applicant

- Create applicant
- List applicants
- Open applicant
- Edit applicant
- Search applicant
- Filter applicant

## Pipeline

- Display applicants by stage
- Change applicant stage
- Confirm stage persists in database
- Confirm stage history is created

## Interview

- Schedule interview
- View interview
- Update interview status
- Confirm persistence

## Offer

- Initiate offer
- View offer
- Update offer status
- Confirm persistence

---

# 47. Security Tests

Verify:

- Organization isolation
- Invalid IDs
- Invalid payloads
- Unauthorized access
- Unauthorized management operation
- SQL input safety
- Backend validation

---

# 48. Technical Verification

Frontend must pass:

npm install

npx tsc --noEmit

npm run build

Backend must pass:

npm install

npm run typecheck

npm run build

Database scripts must execute successfully against the agreed MariaDB development database.

---

# 49. Definition of Done

Module 8 is DONE only when:

- Vacancy management works
- Applicant records work
- Applicant pipeline works
- Kanban stage view works
- Interview scheduling works
- Offer workflow works
- Search/filter works
- Frontend is functional
- Backend is functional
- Database is functional
- Frontend/backend integration works
- Backend/database integration works
- Data persists correctly
- Tenant isolation works
- Permissions are enforced
- Validation exists
- Error handling exists
- Loading states exist
- Empty states exist
- Responsive behavior is verified
- TypeScript checks pass
- Production builds pass
- Integration tests pass
- README is complete
- Final assembly is prepared
- No critical errors remain

UI completion alone does NOT mean the module is complete.

---

# 50. Final Team Rule

All five team members are working on ONE module.

Ankit + Sunidhi
        ↓
One Frontend

Jatin + Neha
        ↓
One Backend

Khushboo
        ↓
Database + Integration + Implementation Coordination

        ↓

HR Recruitment Management

There must be no independent competing versions of the module.

---

# 51. Final Objective

The final Module 8 implementation must provide a clean Recruitment workflow:

Vacancy
   ↓
Applicant
   ↓
Pipeline
   ↓
Interview
   ↓
Selection
   ↓
Offer
   ↓
Recruitment Outcome

while remaining:

- Secure
- Organization-scoped
- API-driven
- Responsive
- Maintainable
- Testable
- Integration-ready
- Consistent with WisWits engineering standards

---

END OF MODULE CONTRACT