# EduSuite Alumni Directory Engineering Contract

**Module Name:** Alumni Directory  
**Module Code:** STL-ALU  
**Functional Lane:** Lane D — Student Life  
**Module Key:** alumni  
**Version:** 1.0  
**Status:** Development / Internal Integration  
**Release Classification:** GATED  
**Implementation Approach:** Fresh / Scratch Implementation  
**Database:** MariaDB  
**Prepared By:** Khushboo — Team Lead  
**Development Model:** Contract-First Parallel Development  

---

# 1. Purpose of This Contract

This document is the implementation contract for the EduSuite Alumni Directory module.

The purpose of this contract is to ensure that frontend, backend, database and
integration work are developed as parts of one module rather than as independent
projects.

This contract defines:

- what Alumni Directory means;
- what functionality must be implemented;
- approved module boundaries;
- mandatory frontend structure;
- mandatory backend structure;
- database structure;
- API contracts;
- mock-data contracts;
- developer ownership;
- integration boundaries;
- security requirements;
- UI states;
- testing expectations;
- Git workflow;
- acceptance criteria.

Developers must implement their assigned work inside the structure defined by this
contract.

Developers may improve implementation details within their assigned scope, but must
not create an alternative module architecture or change approved contracts without
Team Lead approval.

---

# 2. What Is an Alumni Directory?

An alumnus/alumna is a former student of an educational institution.

After students graduate or complete their education, they are no longer part of the
institution's active student population.

However, institutions may still need an organized way to access approved information
about their former students.

The Alumni Directory provides this capability.

In simple terms:

Student
↓
Completes Education / Graduates
↓
Becomes Alumni
↓
Alumni Information Exists
↓
Alumni Directory
↓
Authorized User Can Search / Filter / Browse
↓
Alumni Profile Can Be Viewed

The Alumni Directory is therefore not another active-student management system.

It is a structured directory experience for approved former-student information.

---

# 3. Real-World Example

Suppose an institution wants to find students who graduated in 2024.

An authorized user opens:

Alumni Directory
↓
Selects Graduation Year = 2024
↓
System retrieves matching alumni
↓
Results appear in the directory
↓
User searches for a particular alumnus
↓
User opens the alumni profile
↓
Approved profile information is displayed

Another user may want to browse alumni by batch.

The system should allow:

Alumni Directory
↓
Batch Filter
↓
Select Batch
↓
Matching Alumni
↓
Open Profile

---

# 4. Business Purpose

The Alumni Directory shall provide an organized and scalable way for authorized
institution users to:

- browse alumni;
- search alumni;
- filter alumni;
- view alumni by batch;
- view an individual alumni profile;
- access approved alumni information through one consistent interface.

The module must remain part of the unified EduSuite platform.

It must not become an independent application.

---

# 5. Approved Functional Requirements

The Alumni Directory shall implement:

FR-ALU-001 — Directory

FR-ALU-002 — Search

FR-ALU-003 — Filters

FR-ALU-004 — Alumni Profile

FR-ALU-005 — Batch View

FR-ALU-006 — Consume approved alumni information where applicable

The scratch/demo implementation must provide the required functionality without
depending on unverified local legacy files.

---

# 6. Module Scope

## In Scope

- Alumni dashboard
- Alumni directory
- Alumni list/table/card representation
- Alumni search
- Alumni filters
- Batch filtering/view
- Alumni profile
- Pagination
- Dashboard statistics based on available data
- Responsive UI
- API integration
- Mock-data development
- MariaDB persistence
- Backend API
- Input/query validation
- Authorization
- Organization/tenant isolation
- Loading state
- Empty state
- Error state
- Retry behavior
- Offline state where applicable
- Success feedback

## Out of Scope

Unless separately approved:

- Alumni social network
- Alumni-to-alumni messaging
- Public social profiles
- Job marketplace
- Donation platform
- Payment functionality
- Social-media integration
- Public alumni registration
- Public-facing alumni portal
- Unapproved communication systems

Developers must not independently expand the module into unrelated functionality.

---

# 7. Module Release Rule

Alumni Directory is a GATED capability.

Development:
ALLOWED

Internal Integration:
ALLOWED

Testing:
ALLOWED

Customer Launch:
REQUIRES EXPLICIT AUTHORIZATION

Module registration shall use:

module_key = alumni

The module shall remain in the approved non-live/planned state until authorized.

Implementation completion does not automatically authorize customer release.

---

# 8. Users and Permissions

The module shall use approved role/permission-based access.

Required permissions:

alumni.view

alumni.manage

## alumni.view

Allows an authorized user to:

- open Alumni Directory;
- search alumni;
- filter alumni;
- use batch view;
- view approved alumni profiles.

## alumni.manage

Reserved for approved management capabilities where applicable.

Frontend visibility must never replace backend authorization.

The backend remains responsible for permission enforcement.

---

# 9. Core User Flow

Authorized User
↓
Opens Alumni Directory
↓
Permission Check
↓
Dashboard / Directory Loads
↓
API Request
↓
Backend Validates User + Organization
↓
MariaDB Query
↓
Alumni Data Returned
↓
Frontend Displays Results
↓
User Searches / Filters / Changes Batch
↓
Updated API Request
↓
Filtered Results Returned
↓
User Selects Alumni
↓
Profile API Request
↓
Alumni Profile Displayed

---

# 10. Page Contract

Every applicable Alumni page must follow the shared EduSuite page standard.

Where applicable, pages should contain:

- Page title
- Breadcrumb
- Primary action
- Secondary actions
- Search
- Filters
- Table / Card representation
- Pagination
- Help/context
- Clear feedback

Required API-driven states:

- Loading / Skeleton
- Empty
- Error
- Retry
- Offline
- Success

A rendered page without these required states is not considered complete.

---

# 11. Design Contract

Alumni Directory must follow the approved EduSuite/WisWits product language.

Approved design tokens include:

Navy:
#0F2147

Gold:
#C8A04E

Ivory:
#F7F4EC

Heading Typeface:
Playfair Display

Body / UI Typeface:
Source Sans 3

Base Radius:
8px

Developers should reuse approved shared components where they exist.

Do not independently create another global design system.

The module must be responsive across applicable:

- Desktop
- Tablet
- Mobile

---

# 12. MANDATORY FRONTEND MODULE STRUCTURE

The Alumni frontend must use the following module structure.

Do not create separate architectures for each frontend developer.

apps/web/src/modules/alumni/
│
├── pages/
│   ├── AlumniDashboard.jsx
│   ├── AlumniDirectory.jsx
│   └── AlumniProfile.jsx
│
├── components/
│   │
│   ├── directory/
│   │   ├── AlumniTable.jsx
│   │   ├── AlumniCard.jsx
│   │   ├── AlumniSearch.jsx
│   │   ├── AlumniFilters.jsx
│   │   ├── BatchFilter.jsx
│   │   ├── AlumniPagination.jsx
│   │   ├── AlumniEmptyState.jsx
│   │   └── AlumniLoadingState.jsx
│   │
│   ├── dashboard/
│   │   ├── AlumniStats.jsx
│   │   ├── AlumniOverview.jsx
│   │   ├── BatchOverview.jsx
│   │   └── RecentAlumni.jsx
│   │
│   └── profile/
│       ├── AlumniProfileCard.jsx
│       ├── AlumniBasicInfo.jsx
│       ├── AlumniAcademicInfo.jsx
│       └── AlumniContactInfo.jsx
│
├── services/
│   └── alumniApi.js
│
├── hooks/
│   ├── useAlumni.js
│   └── useAlumniProfile.js
│
├── mocks/
│   ├── alumniDirectory.mock.js
│   ├── alumniDashboard.mock.js
│   └── alumniProfile.mock.js
│
├── utils/
│   ├── alumniFilters.js
│   └── alumniFormatters.js
│
├── constants/
│   └── alumni.constants.js
│
└── index.js

This structure is mandatory for this module implementation.

Developers may add a file where genuinely required by their assigned feature, but
must not replace this architecture with a different one.

---

# 13. FRONTEND ASSIGNMENT — SUNIDHI

**Developer:** Sunidhi  
**Role:** Frontend Developer  
**Complexity:** Bounded / Foundation Scope

Sunidhi owns the Alumni Directory browsing experience.

## Mandatory Files Owned by Sunidhi

apps/web/src/modules/alumni/
│
├── pages/
│   └── AlumniDirectory.jsx
│
├── components/
│   └── directory/
│       ├── AlumniTable.jsx
│       ├── AlumniCard.jsx
│       ├── AlumniSearch.jsx
│       ├── AlumniFilters.jsx
│       ├── AlumniPagination.jsx
│       ├── AlumniEmptyState.jsx
│       └── AlumniLoadingState.jsx
│
└── mocks/
    └── alumniDirectory.mock.js

## Sunidhi Must Implement

### Alumni Directory

The page shall display alumni records in an organized directory.

The directory should support:

- List/table/card display
- Search
- Filters
- Pagination
- View Profile action
- Loading state
- Empty state
- Error state
- Retry behavior
- Responsive behavior

### Search

Search must use the approved Alumni data contract.

Search UI must not contain hardcoded business logic that prevents later API
integration.

### Filters

Applicable filters may include approved contract-supported fields such as:

- Graduation year
- Batch
- Course / program
- Status where applicable

### Important Rule

Sunidhi must use mock data matching the API contract.

She must not create a separate API response structure.

---

# 14. FRONTEND ASSIGNMENT — ANKIT

**Developer:** Ankit  
**Role:** Frontend Developer  
**Complexity:** Primary Frontend Scope

Ankit owns the Alumni Dashboard, Alumni Profile and Batch View experience.

## Mandatory Files Owned by Ankit

apps/web/src/modules/alumni/
│
├── pages/
│   ├── AlumniDashboard.jsx
│   └── AlumniProfile.jsx
│
├── components/
│   ├── dashboard/
│   │   ├── AlumniStats.jsx
│   │   ├── AlumniOverview.jsx
│   │   ├── BatchOverview.jsx
│   │   └── RecentAlumni.jsx
│   │
│   ├── profile/
│   │   ├── AlumniProfileCard.jsx
│   │   ├── AlumniBasicInfo.jsx
│   │   ├── AlumniAcademicInfo.jsx
│   │   └── AlumniContactInfo.jsx
│   │
│   └── directory/
│       └── BatchFilter.jsx
│
└── mocks/
    ├── alumniDashboard.mock.js
    └── alumniProfile.mock.js

## Ankit Must Implement

### Alumni Dashboard

Dashboard should provide an appropriate overview of Alumni Directory data.

Applicable statistics must be derived from the approved mock/API contract.

Do not invent statistics that cannot later be backed by real data.

### Batch View

Users must be able to access alumni according to an approved batch/year grouping.

### Alumni Profile

The profile page displays approved information for one alumni record.

Profile components should remain reusable and should not contain database logic.

---

# 15. SHARED FRONTEND INTEGRATION FILES

The following files form the frontend integration boundary:

apps/web/src/modules/alumni/
│
├── services/
│   └── alumniApi.js
│
├── hooks/
│   ├── useAlumni.js
│   └── useAlumniProfile.js
│
├── utils/
│   ├── alumniFilters.js
│   └── alumniFormatters.js
│
├── constants/
│   └── alumni.constants.js
│
└── index.js

These files must not be independently duplicated by each frontend developer.

The intended flow is:

Page
↓
Hook
↓
alumniApi.js
↓
Mock / Real Backend
↓
Response
↓
UI

Frontend components must not directly access MariaDB.

---

# 16. MOCK-FIRST FRONTEND CONTRACT

Frontend development must not wait for backend completion.

During parallel development:

Frontend
↓
alumniApi.js
↓
Approved Mock
↓
UI

During integration:

Frontend
↓
alumniApi.js
↓
Real Backend
↓
MariaDB

The goal is:

CHANGE DATA SOURCE

NOT

REBUILD FRONTEND

Mock data must therefore match the real API contract.

---

# 17. CANONICAL ALUMNI DATA MODEL

For the scratch/demo implementation, the frontend/backend/database layers shall align
on a common Alumni representation.

Core implementation fields:

id
organizationId
firstName
lastName
email
phone
batch
graduationYear
course
status
createdAt
updatedAt

Optional display fields may be added only when supported by the approved schema and
contract.

Database column naming may use the approved database naming convention, while the API
layer maps fields to the approved API representation.

Example:

graduation_year
↓
Backend Mapping
↓
graduationYear

Do not expose database implementation details directly to frontend components.

---

# 18. STANDARD LIST RESPONSE CONTRACT

GET /api/v1/alumni

Success response:

{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "firstName": "Aarav",
        "lastName": "Sharma",
        "email": "aarav@example.test",
        "phone": "0000000000",
        "batch": "2024",
        "graduationYear": 2024,
        "course": "Science",
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}

Frontend mocks must follow this structure.

---

# 19. STANDARD PROFILE RESPONSE

GET /api/v1/alumni/:id

Success:

{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Aarav",
    "lastName": "Sharma",
    "email": "aarav@example.test",
    "phone": "0000000000",
    "batch": "2024",
    "graduationYear": 2024,
    "course": "Science",
    "status": "active"
  }
}

---

# 20. STANDARD ERROR RESPONSE

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}

Frontend must handle controlled error responses.

---

# 21. API CONTRACT

Base path:

/api/v1/alumni

## Alumni Directory

GET /api/v1/alumni

Permission:

alumni.view

Purpose:

Return organization-scoped alumni records.

Supported query behavior may include:

search
batch
graduationYear
course
page
limit

---

## Alumni Profile

GET /api/v1/alumni/:id

Permission:

alumni.view

Purpose:

Return one authorized alumni profile.

---

## Alumni Dashboard Statistics

GET /api/v1/alumni/stats

Permission:

alumni.view

Purpose:

Return approved statistics used by the Alumni Dashboard.

---

## Alumni Batch View

GET /api/v1/alumni/batches

Permission:

alumni.view

Purpose:

Return approved batch/grouping information for the batch experience.

---

# 22. MANDATORY BACKEND STRUCTURE

All backend developers work inside one Alumni module.

apps/backend/src/modules/alumni/
│
├── alumni.routes.js
├── alumni.module.js
│
├── controllers/
│   ├── alumni.controller.js
│   └── alumni.search.controller.js
│
├── services/
│   ├── alumni.service.js
│   ├── alumni.search.service.js
│   └── alumni.stats.service.js
│
├── repositories/
│   ├── alumni.repository.js
│   └── alumni.search.repository.js
│
├── validators/
│   ├── alumni.validator.js
│   └── alumni.query.validator.js
│
└── utils/
    └── alumni.mapper.js

Developers must not create independent Alumni backend projects.

---

# 23. BACKEND ASSIGNMENT — NEHA

**Developer:** Neha  
**Role:** Backend Developer  
**Ownership:** Core Alumni API

## Mandatory Files Owned by Neha

apps/backend/src/modules/alumni/
│
├── alumni.routes.js
├── alumni.module.js
│
├── controllers/
│   └── alumni.controller.js
│
├── services/
│   └── alumni.service.js
│
├── repositories/
│   └── alumni.repository.js
│
├── validators/
│   └── alumni.validator.js
│
└── utils/
    └── alumni.mapper.js

## Responsibilities

Neha implements:

- Alumni list endpoint
- Alumni profile endpoint
- Organization-scoped retrieval
- Pagination
- Core service logic
- Repository access
- Standard responses
- Error handling
- Permission integration
- Mapping database records to API responses

Required APIs:

GET /api/v1/alumni

GET /api/v1/alumni/:id

---

# 24. BACKEND ASSIGNMENT — JATIN

**Developer:** Jatin  
**Role:** Backend Developer  
**Ownership:** Search, Filter, Batch & Dashboard Support

## Mandatory Files Owned by Jatin

apps/backend/src/modules/alumni/
│
├── controllers/
│   └── alumni.search.controller.js
│
├── services/
│   ├── alumni.search.service.js
│   └── alumni.stats.service.js
│
├── repositories/
│   └── alumni.search.repository.js
│
└── validators/
    └── alumni.query.validator.js

## Responsibilities

Jatin implements:

- Alumni search
- Graduation-year filtering
- Batch filtering
- Course filtering
- Query validation
- Dashboard statistics
- Batch-view support
- Pagination support for filtered queries
- Organization-scoped filtering

Supporting APIs:

GET /api/v1/alumni?search=...

GET /api/v1/alumni?batch=...

GET /api/v1/alumni?graduationYear=...

GET /api/v1/alumni?course=...

GET /api/v1/alumni/stats

GET /api/v1/alumni/batches

Jatin must work with Neha's core Alumni service contract and must not create a
second Alumni API architecture.

---

# 25. DATABASE ASSIGNMENT — KHUSHBOO

**Developer:** Khushboo  
**Role:** Team Lead + MariaDB + Integration

Khushboo owns:

- Scratch/demo Alumni schema
- MariaDB migration
- Seed/mock database records
- Relationships
- Indexes
- Tenant ownership
- API/database field alignment
- Integration
- Contract review
- Pull-request review
- End-to-end validation

Mandatory structure:

database/
│
├── migrations/
│   └── XXX_create_alumni_directory_tables.sql
│
├── seeds/
│   └── alumni_directory_seed.sql
│
└── docs/
    └── alumni_schema_reference.md

---

# 26. SCRATCH DATABASE CONTRACT

The CTO specification references existing alumni lifecycle information.

However, this scratch/demo implementation must be independently runnable and must
not depend on unverified local legacy files or tables.

The Team Lead shall therefore prepare the approved MariaDB schema required for the
demo implementation.

During final platform reconciliation, the demo schema/API mapping can be aligned with
the authoritative alumni lifecycle source.

Developers must not independently create conflicting database schemas.

---

# 27. ALUMNI PROFILE TABLE — DEMO REQUIREMENTS

The scratch MariaDB implementation shall provide an approved Alumni profile data
source capable of supporting:

- Primary identifier
- Organization identifier
- First name
- Last name
- Email
- Phone
- Batch
- Graduation year
- Course/program
- Status
- Created timestamp
- Updated timestamp

Exact SQL naming, types, constraints and indexes remain controlled by the Team Lead's
approved migration.

---

# 28. DATABASE INDEXING REQUIREMENTS

The database implementation should support efficient retrieval for:

- organization
- graduation year
- batch
- course
- commonly used search behavior where appropriate

Indexes must be selected according to the final query patterns.

Developers must not introduce duplicate or unnecessary indexes independently.

---

# 29. TENANT ISOLATION

Alumni data is organization scoped.

Every backend query must enforce the authenticated organization context.

Conceptual rule:

Authenticated User
↓
organizationId
↓
Backend
↓
Repository
↓
WHERE organization_id = authenticated organization
↓
MariaDB

Organization identity must never be hardcoded.

A user from Organization A must not retrieve Alumni records from Organization B.

Frontend filtering is not a security mechanism.

---

# 30. SECURITY REQUIREMENTS

The module must preserve:

- Authentication
- Authorization
- Tenant isolation
- Parameterized database access
- Input/query validation
- Secret protection
- Controlled error handling
- Approved data exposure

Never commit:

- passwords
- database credentials
- tokens
- production connection strings
- real sensitive user data

Frontend code must never directly access MariaDB.

---

# 31. TEAM OWNERSHIP MATRIX

| Developer | Area | Ownership |
|---|---|---|
| Sunidhi | Frontend | Directory, Table/Card, Search, Filters, Pagination, States |
| Ankit | Frontend | Dashboard, Profile, Stats, Batch View |
| Neha | Backend | Core Alumni API, Profile API, Repository, Mapping |
| Jatin | Backend | Search, Filters, Stats, Batch APIs |
| Khushboo | Lead / DB | MariaDB, Contract, API Alignment, Review, Integration |

---

# 32. FILE OWNERSHIP RULE

Developers should avoid modifying files owned by another developer.

If a shared file requires modification:

1. Discuss the change.
2. Confirm the contract impact.
3. Coordinate ownership.
4. Make the smallest required change.

Do not casually modify another developer's implementation.

This rule exists to reduce merge conflicts.

---

# 33. INTEGRATION BOUNDARY

All layers must align to this flow:

MariaDB
↓
Repository
↓
Service
↓
Controller
↓
API Contract
↓
alumniApi.js
↓
Hook
↓
Page / Component

Integration should not require restructuring the entire module.

The objective is to replace mock data with the real API while preserving frontend
components.

---

# 34. FRONTEND INTEGRATION REQUIREMENT

Frontend developers must not place mock arrays directly throughout components.

Mock data must flow through the module's approved service/data boundary.

Bad:

Component
→ Hardcoded array

Required:

Component
↓
Hook
↓
alumniApi
↓
Mock

Later:

Component
↓
Hook
↓
alumniApi
↓
Real API

---

# 35. BACKEND INTEGRATION REQUIREMENT

Backend developers must:

- use the approved API contract;
- use standard responses;
- validate query parameters;
- preserve organization scope;
- avoid returning raw database internals;
- use the approved repository/data-access pattern;
- provide controlled errors.

---

# 36. MODULE REGISTRATION

Where applicable verify:

- [ ] Alumni route registered
- [ ] Navigation registered
- [ ] Permissions registered
- [ ] RBAC integration completed
- [ ] Module registry updated
- [ ] module_key = alumni
- [ ] Release gate preserved

---

# 37. DEVELOPMENT BOUNDARIES

Developers must not independently:

- Change technology stack
- Change database technology
- Change Master Architecture
- Create another Alumni architecture
- Rename approved API contracts
- Create another API response format
- Bypass service boundaries
- Hardcode organization IDs
- Add unapproved dependencies
- Create direct frontend database access
- Commit secrets
- Modify unrelated modules
- Change module release classification
- Replace shared design standards

Useful implementation improvements within the assigned scope are welcome when they
remain compatible with this contract.

---

# 38. GIT BRANCH CONTRACT

Each developer works on a dedicated Alumni branch.

Branches will be created from the latest approved main branch.

Expected branches:

feature/alumni-frontend-sunidhi

feature/alumni-frontend-ankit

feature/alumni-backend-neha

feature/alumni-backend-jatin

feature/alumni-database-khushboo

Direct module development on main is prohibited.

---

# 39. DEVELOPMENT WORKFLOW

Latest Main
↓
Assigned Alumni Branch
↓
Read Contract
↓
Create / Use Assigned Structure
↓
Implement Assigned Scope
↓
Run Locally
↓
Test
↓
Fix Bugs
↓
Small Logical Commits
↓
Push Assigned Branch
↓
Pull Request
↓
Team Lead Review
↓
Integration
↓
Corrections
↓
Approval
↓
Merge

---

# 40. FRONTEND CHECKLIST

- [ ] Mandatory structure followed
- [ ] Directory works
- [ ] Search works
- [ ] Filters work
- [ ] Batch view works
- [ ] Profile works
- [ ] Dashboard works
- [ ] Pagination works
- [ ] Mock contract matches API contract
- [ ] Loading state works
- [ ] Empty state works
- [ ] Error state works
- [ ] Retry behavior works where applicable
- [ ] Responsive behavior checked
- [ ] No direct database access
- [ ] No hardcoded production data

---

# 41. BACKEND CHECKLIST

- [ ] Mandatory structure followed
- [ ] Routes registered
- [ ] List endpoint works
- [ ] Profile endpoint works
- [ ] Search works
- [ ] Filters work
- [ ] Batch support works
- [ ] Stats endpoint works
- [ ] Pagination works
- [ ] Validation works
- [ ] Standard responses used
- [ ] Authorization enforced
- [ ] Organization isolation enforced
- [ ] Parameterized database access used
- [ ] Controlled errors returned

---

# 42. DATABASE CHECKLIST

- [ ] Migration runs
- [ ] Schema supports API contract
- [ ] Organization ownership exists
- [ ] Required constraints exist
- [ ] Required indexes exist
- [ ] Seed data works
- [ ] No real personal data used
- [ ] Tenant isolation can be enforced
- [ ] API fields can be mapped cleanly
- [ ] Data integrity preserved

---

# 43. INTEGRATION CHECKLIST

- [ ] Frontend starts
- [ ] Backend starts
- [ ] MariaDB connects
- [ ] Migration works
- [ ] Seed works
- [ ] Frontend connects to API
- [ ] Mock can be replaced without UI rewrite
- [ ] Directory loads real records
- [ ] Search uses backend
- [ ] Filters use backend
- [ ] Pagination uses backend
- [ ] Profile loads from backend
- [ ] Dashboard stats use backend
- [ ] Batch view uses backend
- [ ] Authorization verified
- [ ] Tenant isolation verified
- [ ] Error behavior verified
- [ ] Responsive UI verified
- [ ] No unrelated architecture changes

---

# 44. ACCEPTANCE CRITERIA

The Alumni Directory implementation is complete only when:

1. Authorized users can access the Alumni Directory.
2. Alumni records can be displayed through a scalable directory.
3. Search works against the approved data source.
4. Filters work.
5. Batch view works.
6. An individual alumni profile can be opened.
7. Dashboard data comes from the approved contract/API.
8. Pagination works for scalable result sets.
9. Frontend and backend follow the same contract.
10. MariaDB persistence/retrieval works.
11. Organization isolation is enforced.
12. Permissions are enforced.
13. Required UI states work.
14. Responsive behavior is verified.
15. Validation works.
16. Controlled errors work.
17. Module registration is complete where applicable.
18. Integration testing passes.
19. Contract compliance is reviewed.
20. Required corrections are completed.

A rendered dashboard alone does not constitute module completion.

---

# 45. DEFINITION OF DONE

Requirements
✓

Approved Contract
✓

Mandatory Structure
✓

Frontend
✓

Backend
✓

MariaDB
✓

Mock Contract
✓

Real API Integration
✓

Search / Filters
✓

Batch View
✓

Profile
✓

Pagination
✓

Permissions
✓

Tenant Isolation
✓

Required UI States
✓

Responsive Behavior
✓

Testing
✓

Review
✓

Corrections
✓

Integration
✓

Only then is the implementation considered complete.

---

# 46. INTEGRATION OBJECTIVE

The module is intentionally structured so that final integration should require
connection and validation rather than reconstruction.

Expected integration:

Sunidhi Frontend
        +
Ankit Frontend
        +
Neha Backend
        +
Jatin Backend
        +
Khushboo MariaDB
        ↓
Approved Alumni Module Structure
        ↓
Mock → Real API
        ↓
End-to-End Testing
        ↓
Corrections
        ↓
Final Integration

The Team Lead should not need to redesign each developer's work during integration.

---

# 47. DEVELOPER STARTING INSTRUCTION

Before writing code:

1. Pull/fetch the latest approved main branch.
2. Switch to the assigned Alumni branch.
3. Read this entire contract.
4. Read the Engineering Standards.
5. Locate your name in this contract.
6. Create/use only your assigned structure.
7. Confirm the API/mock contract.
8. Implement your assigned scope.
9. Run the code locally.
10. Test your implementation.
11. Fix implementation bugs.
12. Commit logical changes.
13. Push only to your assigned branch.

Do not push Alumni development directly to main.

---

# 48. CORE RULE

BUILD TO THE CONTRACT.

The Alumni Directory must be implemented as one module by multiple developers,
not as multiple independent projects.

Developers own implementation inside the approved structure.

The Team Lead owns architecture, contract alignment, database alignment, review and
integration.

Do not redesign the module while implementing it.

When an unresolved architecture or contract question appears, raise it before
inventing a conflicting solution.