# EduSuite Student Observations Engineering Contract

**Module Name:** Student Observations\
**Module Code:** STL-OBS\
**Functional Lane:** Lane D --- Student Life\
**Module Key:** `student_observations`\
**Priority:** P3\
**Version:** 1.0\
**Status:** Development / Internal Integration\
**Implementation Approach:** Fresh / Scratch Module Implementation\
**Database:** MariaDB\
**Prepared By:** Khushboo --- Team Lead\
**Development Model:** Contract-First Parallel Development\
**Integration Goal:** Verify-and-Merge / Minimum Reconstruction

------------------------------------------------------------------------

# 1. Purpose of This Contract

This document is the implementation contract for the EduSuite Student
Observations module.

It exists so that every team member understands both:

1.  **what Student Observations is and why a school needs it; and**
2.  **exactly how their assigned frontend/backend/database work must be
    implemented so that it integrates into the WisWits/EduSuite SaaS
    platform with minimum rework.**

This contract defines:

-   module meaning and business purpose;
-   approved record types and functional requirements;
-   scope and development boundaries;
-   frontend architecture and developer ownership;
-   backend architecture and developer ownership;
-   API and mock-data contracts;
-   MariaDB database requirements;
-   authentication, permissions, tenancy and audit rules;
-   platform design requirements;
-   Git workflow;
-   integration expectations;
-   testing and acceptance criteria.

The module is a **fresh/scratch business implementation**, but it is
**not a new platform architecture**.

Developers build Student Observations from scratch **inside the existing
platform standards**. They must not recreate authentication, database
infrastructure, permissions, routing infrastructure, audit
infrastructure, or the global design system.

------------------------------------------------------------------------

# 2. Read This Before Coding --- Integration Lessons Now Locked

The previous Event Management integration showed that the backend
business implementation can be strong while still causing integration
friction when the source module does not match the host platform.

For Student Observations, the following rules are locked from the
beginning:

## Frontend

-   Use **Next.js 16 App Router**.
-   Use **React 19**.
-   Use **TypeScript**.
-   Use **Tailwind CSS 4**.
-   Do **not** create a Vite application.
-   Do **not** use React Router as the module routing system.
-   Do **not** create a separate module entry/build architecture.
-   Use platform/shared API access patterns.
-   Do not use native `alert()`, `confirm()` or `prompt()`.
-   Use platform toast/feedback components and `ConfirmDialog` where
    confirmation is genuinely required.
-   Use the approved WisWits design tokens and typography.
-   Do not create a separate dark/light theme for this module.

## Backend

-   Do **not** implement module-local JWT parsing or verification.
-   Do **not** parse `Authorization: Bearer` tokens inside the module.
-   Use the platform's shared `authenticate` middleware.
-   Authentication is platform-managed; the module consumes
    authenticated context.
-   Organization context must come from the authenticated request,
    including `req.user.org_id` according to the current integration
    standard.
-   Do **not** create a module-local database pool.
-   Do **not** call `mysql.createPool()` inside Student Observations.
-   Use the platform shared database helpers, including the approved
    `query` / `withTransaction` pattern.
-   Do **not** create local hardcoded permission constants.
-   Gate routes using the platform permission middleware such as
    `requirePermission(...)`.
-   Every applicable create/edit/delete/state-changing operation must
    call the existing audit helper.
-   Continue using layered backend structure, parameterized SQL,
    organization scoping, transactions where required, and tests.

## Database / Migration

-   Main database technology is **MariaDB**.
-   `mysql2` is the Node.js driver used to communicate with MariaDB; it
    is not a second database.
-   Use parameterized SQL.
-   No ORM.
-   Tenant tables use the approved `client_*` naming convention.
-   Migration filenames follow `NNN_description.sql`.
-   Never include `USE <database>;` inside a migration.
-   Migration changes must follow the platform migration runner
    requirements.

These rules exist so that integration becomes **connection +
verification**, not architecture rewriting.

------------------------------------------------------------------------

# 3. What Is Student Observations?

Student Observations is a school-management capability for recording
structured observations about students.

Teachers and other appropriately authorized academic users regularly
notice information that may be useful for understanding a student's
participation, learning behavior, classroom conduct, development, or
other school-related context.

Without a structured system, such observations can become scattered
across notebooks, informal messages, spreadsheets, or memory.

The Student Observations module provides a controlled place to record
approved observations while preserving:

-   the student the observation belongs to;
-   the person who wrote it;
-   the observation type;
-   the observation content;
-   organization ownership;
-   controlled visibility;
-   controlled editing;
-   traceability of applicable changes.

This is **not** a public notes system and not a general social feed.

Student observations are sensitive student information and must be
visible only according to approved permissions, roles and organization
boundaries.

------------------------------------------------------------------------

# 4. Simple Real-World Examples

## Example A --- Anecdotal Observation

A teacher notices a meaningful classroom incident or student behavior
that should be recorded.

Teacher\
→ Opens Student Observations\
→ Selects the student\
→ Selects **Anecdotal Observation**\
→ Enters the approved observation details\
→ Submits\
→ Backend authenticates and authorizes the request\
→ Organization/student relationship is validated\
→ Observation is stored with identifiable authorship\
→ Audit record is created where required\
→ Authorized users can later retrieve the observation

## Example B --- Class / School Observation

An authorized staff member records an observation related to a student
in a broader class or school context.

Authorized User\
→ Opens Student Observations\
→ Selects student\
→ Selects **Class / School Observation**\
→ Records the observation\
→ Submits\
→ Backend validates access and tenant scope\
→ Observation is persisted\
→ Authorized users see it according to server-side visibility rules

The two record types belong to **one Student Observations module**.

They must not be implemented as two separate applications or two
unrelated module architectures.

------------------------------------------------------------------------

# 5. Business Purpose

The Student Observations module shall provide an organized and
controlled way to:

-   create approved student observations;
-   distinguish Anecdotal and Class/School observations;
-   retain identifiable authorship;
-   browse and view permitted observations;
-   search/filter observations where applicable;
-   edit observations only when authorized;
-   preserve applicable audit history;
-   protect sensitive student information;
-   enforce organization isolation;
-   provide consistent platform feedback and UI states.

The module must remain part of the unified EduSuite/WisWits SaaS
platform.

------------------------------------------------------------------------

# 6. Approved Functional Requirements

The source PRD defines the following requirements:

-   **FR-OBS-001 --- Anecdotal observation**
-   **FR-OBS-002 --- Class/school observation**
-   **FR-OBS-003 --- Author attribution**
-   **FR-OBS-004 --- Controlled editing**
-   **FR-OBS-005 --- Applicable audit trail**
-   **FR-OBS-006 --- Role-scoped visibility**

Mandatory business rules:

1.  Both observation types remain inside one module.
2.  Every observation retains identifiable authorship.
3.  Visibility is role scoped.
4.  Observation data is organization isolated.
5.  Sensitive visibility rules must be enforced on the server, not only
    hidden in the UI.

------------------------------------------------------------------------

# 7. Implementation Classification

**Implementation:** Fresh / Scratch

The team shall create the Student Observations business module
implementation from scratch.

However, "scratch" does **not** mean recreating platform infrastructure.

## Build From Scratch

-   Student Observations frontend pages/components
-   Student Observations frontend feature logic
-   Student Observations mock data
-   Student Observations service/API boundary
-   Student Observations backend routes
-   Controllers/services/repository logic
-   Validation specific to Student Observations
-   Student Observations MariaDB migration/schema
-   Module-specific tests

## Reuse Platform Infrastructure

-   Next.js application shell and App Router
-   shared authentication middleware
-   authenticated user/organization context
-   shared database connection/helpers
-   shared permission middleware/catalog
-   shared audit helper
-   standard response/error conventions
-   shared UI/design system
-   platform toasts and confirmation components
-   module registry/navigation mechanisms
-   platform logging/observability

Developers must not rebuild shared infrastructure inside the module.

------------------------------------------------------------------------

# 8. Module Scope

## In Scope

-   Student Observations dashboard/overview where useful
-   Observation list
-   Observation details
-   Create observation
-   Edit observation where authorized
-   Anecdotal Observation type
-   Class / School Observation type
-   Author attribution
-   Student association
-   Search where applicable
-   Filters
-   Observation-type filtering
-   Student/class-context filtering where supported by approved data
-   Pagination for scalable lists
-   Role-scoped visibility
-   Organization isolation
-   Required audit behavior
-   Responsive UI
-   Loading state
-   Empty state
-   Error state
-   Retry behavior
-   Offline state where platform pattern supports it
-   Success feedback
-   MariaDB persistence
-   Platform module/route/permission registration where applicable

## Out of Scope Unless Separately Approved

-   AI-generated behavioral conclusions
-   automated student scoring from observations
-   psychological/medical diagnosis
-   public sharing of student observations
-   parent-facing observation access unless explicitly approved
-   cross-organization observation access
-   independent notification systems
-   independent authentication/RBAC systems
-   independent audit systems
-   a second observations module for the second record type
-   unrelated student-management functionality

Do not expand the module beyond the approved requirements without Team
Lead/technical approval.

------------------------------------------------------------------------

# 9. Proposed Users and Visibility Model

The exact production role-to-permission grants remain
platform-controlled.

The technical specification establishes the following important
behavior:

  -----------------------------------------------------------------------
  User Type                           Intended Visibility / Action
  ----------------------------------- -----------------------------------
  Teacher                             View permitted observations
                                      including own-authored and
                                      applicable class-scoped records;
                                      create where permitted

  Observation Author                  May edit own observation when
                                      allowed by policy

  Coordinator / Authorized Academic   Broader approved view/edit
  Role                                capability

  Principal / Authorized Leadership   Broad authorized visibility within
                                      the organization

  Unauthorized User                   No access
  -----------------------------------------------------------------------

**Important:** The frontend hiding an Edit button is not authorization.

Every read and mutation must be checked server-side.

------------------------------------------------------------------------

# 10. Supported Observation Types

The canonical values are:

``` text
anecdotal
class_school
```

Human-facing labels:

``` text
Anecdotal Observation
Class / School Observation
```

Use one module and one common observation contract.

Do not create:

``` text
/anecdotal-observations
```

as an independent architecture and another unrelated architecture for
class/school observations.

Both types use the common Student Observations module.

------------------------------------------------------------------------

# 11. Core User Flow

Authorized User\
→ Opens Student Observations\
→ Shared authentication verifies session\
→ Permission/visibility check\
→ Observation list/dashboard loads\
→ User searches/filters or selects Create Observation\
→ User selects student\
→ User selects observation type\
→ User enters approved observation information\
→ Frontend validates user input\
→ API request is sent\
→ Backend validates authentication, permission and organization context\
→ Backend validates student/author access\
→ Business validation runs\
→ Parameterized MariaDB operation executes\
→ Applicable audit event is written\
→ Standard API response returns\
→ Frontend shows success/error feedback\
→ UI refreshes using returned/real API data

------------------------------------------------------------------------

# 12. Edit Flow

Authorized User\
→ Opens an observation\
→ Selects Edit\
→ Backend verifies edit permission and record visibility\
→ Backend verifies organization scope\
→ Backend verifies author/coordinator/principal rule as applicable\
→ Valid update is persisted\
→ Edit is audit logged\
→ Updated observation is returned\
→ UI shows success state

An unauthorized user must not be able to edit a record by manually
calling the endpoint.

------------------------------------------------------------------------

# 13. Page Contract

Applicable pages should follow the WisWits page contract:

-   Page title
-   Breadcrumb
-   Primary action
-   Secondary actions where applicable
-   Search
-   Filters
-   Table/card/list
-   Pagination where required
-   Context/help where appropriate
-   Clear operation feedback

Required API-driven states:

-   Loading / Skeleton
-   Empty
-   Error
-   Retry
-   Offline where applicable
-   Success

A visually complete page without these behaviors is not considered
complete.

------------------------------------------------------------------------

# 14. Design Contract

Student Observations must follow the approved WisWits product design
language.

## Design Tokens

**Navy:** `#0F2147`\
**Gold:** `#C8A04E`\
**Ivory:** `#F7F4EC`\
**Heading Typeface:** Playfair Display\
**Body / UI Typeface:** Source Sans 3\
**Base Radius:** `8px`

Use approved shared components where available.

Do not create an independent global design system or module-specific
theme.

## Feedback Rules

Do not use:

``` text
alert()
confirm()
prompt()
```

Use:

-   platform toast/non-blocking feedback for normal success/failure;
-   platform `ConfirmDialog` or approved equivalent for actions that
    genuinely require blocking confirmation.

## Responsive Requirement

Applicable experiences must work across:

-   Desktop
-   Tablet
-   Mobile

------------------------------------------------------------------------

# 15. Locked Frontend Architecture

Frontend stack:

``` text
Next.js 16
React 19
TypeScript
Tailwind CSS 4
Next.js App Router
```

The module belongs inside the existing `apps/web` application.

Do not create:

-   a Vite project;
-   a second `package.json` for a standalone observations app;
-   React Router routing;
-   a second application entry point;
-   a separate build system.

Conceptual frontend boundary:

``` text
Next.js App Router Page
        ↓
Module Component
        ↓
Hook / Feature Logic
        ↓
observations API Service
        ↓
Mock Adapter (development)
        OR
Real REST API (integration)
```

The exact route wrapper should follow the existing WisWits App Router
template supplied/approved for the repository.

------------------------------------------------------------------------

# 16. Proposed Frontend Module Structure

Business components should remain grouped under the Student Observations
module while route entry files remain compatible with the existing
Next.js App Router.

``` text
apps/web/
├── app/
│   └── [approved existing route tree]/
│       └── observations/
│           ├── page.tsx
│           ├── new/
│           │   └── page.tsx
│           └── [id]/
│               └── page.tsx
│
└── src/
    └── modules/
        └── observations/
            ├── components/
            │   ├── list/
            │   │   ├── ObservationList.tsx
            │   │   ├── ObservationCard.tsx
            │   │   ├── ObservationSearch.tsx
            │   │   ├── ObservationFilters.tsx
            │   │   ├── ObservationPagination.tsx
            │   │   ├── ObservationLoadingState.tsx
            │   │   └── ObservationEmptyState.tsx
            │   ├── form/
            │   │   ├── ObservationForm.tsx
            │   │   ├── StudentSelector.tsx
            │   │   └── ObservationTypeSelector.tsx
            │   ├── detail/
            │   │   ├── ObservationDetail.tsx
            │   │   ├── ObservationMeta.tsx
            │   │   └── ObservationAuthor.tsx
            │   └── dashboard/
            │       └── ObservationOverview.tsx
            ├── services/
            │   └── observationsApi.ts
            ├── hooks/
            │   ├── useObservations.ts
            │   └── useObservation.ts
            ├── mocks/
            │   └── observations.mock.ts
            ├── types/
            │   └── observation.types.ts
            ├── utils/
            │   └── observationFormatters.ts
            └── constants/
                └── observation.constants.ts
```

**Important:** the exact `apps/web/app/...` route parent must match the
real repository's approved App Router layout. Developers must not invent
a parallel route root if the repository already provides one.

------------------------------------------------------------------------

# 17. Frontend Assignment --- Sunidhi

**Developer:** Sunidhi\
**Role:** Frontend Developer\
**Primary Ownership:** Observation browsing/list experience

Sunidhi owns:

-   Observation list
-   Observation card/table/list representation
-   Search UI
-   Filters
-   Observation-type filter
-   Pagination
-   Loading state
-   Empty state
-   Error/retry state
-   Responsive list experience

Primary files:

``` text
src/modules/observations/components/list/
src/modules/observations/hooks/useObservations.ts
src/modules/observations/mocks/observations.mock.ts
```

Sunidhi must:

-   work against the approved mock/API contract;
-   use TypeScript;
-   use shared platform UI patterns;
-   avoid hardcoded business data inside components;
-   avoid direct fetch URLs scattered through components;
-   not create a Vite application;
-   not create React Router routes;
-   not implement authentication or permissions in the frontend as a
    security substitute.

------------------------------------------------------------------------

# 18. Frontend Assignment --- Ankit

**Developer:** Ankit\
**Role:** Frontend Developer\
**Primary Ownership:** Create/Edit/Detail experience

Ankit owns:

-   Create Observation page/form
-   Observation Detail
-   Edit Observation experience
-   Student selector UI
-   Observation type selector
-   Author/meta display
-   Dashboard/overview component where applicable
-   Success feedback
-   ConfirmDialog usage where a destructive/important confirmation is
    approved
-   Responsive form/detail behavior

Primary files:

``` text
src/modules/observations/components/form/
src/modules/observations/components/detail/
src/modules/observations/components/dashboard/
src/modules/observations/hooks/useObservation.ts
```

Ankit must use the same canonical observation type and API contracts as
Sunidhi.

He must not create a second observations service or a separate mock
response format.

------------------------------------------------------------------------

# 19. Shared Frontend Ownership

Shared frontend files include:

``` text
src/modules/observations/services/observationsApi.ts
src/modules/observations/types/observation.types.ts
src/modules/observations/constants/observation.constants.ts
```

Changes to shared files must be coordinated.

Both frontend developers must consume one common contract.

The intended flow is:

``` text
Component
   ↓
Hook
   ↓
observationsApi
   ↓
Mock Adapter
```

During integration:

``` text
Component
   ↓
Hook
   ↓
observationsApi
   ↓
Real Backend API
```

The objective is to **change the data source, not rebuild the
frontend**.

------------------------------------------------------------------------

# 20. Canonical Observation API Model

The scratch implementation shall align frontend, backend and database
around one API representation.

Required core fields:

``` text
id
organizationId
studentId
authorId
observationType
content
createdAt
updatedAt
```

Display-enrichment fields may be returned where supported by approved
service/API relationships, for example approved student/author display
information.

The database may use snake_case while the API maps to camelCase.

Example:

``` text
organization_id → organizationId
student_id      → studentId
author_id       → authorId
observation_type → observationType
created_at      → createdAt
```

Do not expose raw database rows directly to frontend components.

**Note:** The source documents do not define additional mandatory domain
fields beyond the approved observation requirements. Developers must not
independently invent sensitive scoring, diagnosis, severity or
behavioral classification fields.

------------------------------------------------------------------------

# 21. Mock-First Contract

Frontend development may proceed before the real backend is integrated.

Mock records must:

-   use the canonical API model;
-   contain only fictional/demo information;
-   never contain real student data;
-   include both observation types;
-   include enough records to demonstrate loading/list/filter/pagination
    behavior;
-   match the real API response envelope.

Bad:

``` text
Component → hardcoded array
```

Required:

``` text
Component
→ Hook
→ observationsApi
→ Mock
```

Integration:

``` text
Component
→ Hook
→ observationsApi
→ Real API
→ Express
→ MariaDB
```

------------------------------------------------------------------------

# 22. Standard API Response Contract

Success:

``` json
{
  "success": true,
  "data": {}
}
```

Error:

``` json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Controlled error message"
  }
}
```

List responses may include approved pagination metadata, for example:

``` json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

Frontend mocks must match the chosen real response contract.

------------------------------------------------------------------------

# 23. Proposed REST API Contract

The following contract is defined for this scratch module so frontend
and backend can work in parallel.

## List Observations

**GET**

``` text
/api/v1/student-observations
```

Permission:

``` text
students.observations.view
```

Supported query parameters where applicable:

``` text
page
limit
search
studentId
observationType
```

The backend must apply server-side role visibility and `org_id` scoping
regardless of query parameters.

## Get Observation

**GET**

``` text
/api/v1/student-observations/:id
```

Permission:

``` text
students.observations.view
```

## Create Observation

**POST**

``` text
/api/v1/student-observations
```

Permission:

``` text
students.observations.create
```

Example request:

``` json
{
  "studentId": 101,
  "observationType": "anecdotal",
  "content": "Demo observation content."
}
```

`authorId` and `organizationId` must not be trusted from arbitrary
frontend input when they can be derived from authenticated context.

## Update Observation

**PATCH**

``` text
/api/v1/student-observations/:id
```

Permission:

``` text
students.observations.edit
```

Example request:

``` json
{
  "observationType": "class_school",
  "content": "Updated demo observation content."
}
```

The backend must enforce controlled editing rules in addition to
permission middleware.

## Delete / Deactivate

The source PRD does **not** define deletion as a required Student
Observations feature.

Therefore a delete endpoint must **not** be introduced by interns unless
separately approved.

------------------------------------------------------------------------

# 24. Backend Architecture

Mandatory conceptual flow:

``` text
Route
  ↓
Shared authenticate
  ↓
requirePermission(...)
  ↓
Controller
  ↓
Service / Business Rules
  ↓
Repository / Data Access
  ↓
Shared query / withTransaction
  ↓
MariaDB
```

Suggested module location:

``` text
apps/backend/src/modules/student-observations/
├── studentObservations.routes.js
├── studentObservations.controller.js
├── studentObservations.service.js
├── studentObservations.repository.js
├── studentObservations.validator.js
└── studentObservations.mapper.js
```

Exact naming may be adapted to the repository's current module naming
convention, but developers must preserve the approved layered
architecture.

------------------------------------------------------------------------

# 25. Backend Assignment --- Neha

**Developer:** Neha\
**Role:** Backend Developer\
**Primary Ownership:** Core observation CRUD/read architecture

Neha owns:

-   module route/controller/service foundation;
-   create observation;
-   get observation by ID;
-   core repository operations;
-   canonical API mapping;
-   author attribution from authenticated context;
-   organization-scoped core queries;
-   controlled error responses;
-   create audit call;
-   applicable update coordination with Jatin.

Neha must not:

-   implement custom JWT verification;
-   create a database pool;
-   hardcode organization IDs;
-   create a local permission system;
-   return raw MariaDB rows directly;
-   bypass audit requirements.

------------------------------------------------------------------------

# 26. Backend Assignment --- Jatin

**Developer:** Jatin\
**Role:** Backend Developer\
**Primary Ownership:** List/filter/visibility/edit support

Jatin owns:

-   observation list query;
-   pagination;
-   search where contract-supported;
-   student filter;
-   observation-type filter;
-   role-scoped visibility query behavior;
-   controlled edit validation;
-   update operation support;
-   update audit call;
-   query validation;
-   tests for filters/visibility/edit rules.

Jatin must work with Neha's common service/repository contract.

He must not create a second Student Observations API architecture.

------------------------------------------------------------------------

# 27. Authentication Standard --- Non-Negotiable

Student Observations must use the platform's shared authentication.

Do not write:

``` text
jwt.verify(...)
jsonwebtoken module-local verification
Bearer token parser
custom authenticate middleware
```

The current platform integration standard uses shared authentication and
a cookie-based access token (`access_token`).

The module consumes authenticated request context.

Organization scope is derived from authenticated context, including:

``` text
req.user.org_id
```

according to the host platform standard.

The module must never accept an arbitrary `organizationId` from the
frontend as authority for tenant access.

------------------------------------------------------------------------

# 28. Permission Standard --- Non-Negotiable

Approved permission keys from the technical specification:

``` text
students.observations.view
students.observations.create
students.observations.edit
```

Routes must use the platform permission middleware/catalog.

Conceptually:

``` text
authenticate
→ requirePermission('students.observations.view')
→ controller
```

Do not create a local `permissions.js` that acts as an independent
authorization system.

New permission strings must be registered/seeded through the approved
platform mechanism.

Role-to-permission grants remain platform controlled.

------------------------------------------------------------------------

# 29. Role-Scoped Visibility

Visibility is a backend business/security rule.

The technical specification establishes:

-   teacher: own-authored + applicable class-scoped visibility;
-   principal: broader/all authorized organization visibility;
-   edits: author + coordinator/principal as applicable.

Every list/detail query must apply the authenticated user's permitted
visibility.

Bad:

``` text
GET all organization observations
→ frontend hides rows
```

Required:

``` text
Authenticated User
→ Role/Permission Context
→ Organization Context
→ Server-side visibility rule
→ Parameterized query
→ Only permitted records returned
```

Frontend filtering is not a security control.

------------------------------------------------------------------------

# 30. Audit Requirements

Student Observations contains sensitive student information.

Every applicable mutation must use the existing platform audit helper.

At minimum:

``` text
Create Observation → audit
Edit Observation   → audit
```

Conceptual event pattern:

``` text
audit(req, 'student_observation.created', 'student_observation', id)
audit(req, 'student_observation.updated', 'student_observation', id)
```

The exact helper signature/event naming must follow the real shared
audit utility used by the repository.

Do not build a second audit system.

Audit traceability should preserve enough information to identify:

-   organization;
-   acting user;
-   affected record;
-   operation;
-   timestamp;
-   relevant state change where supported.

------------------------------------------------------------------------

# 31. MariaDB Database Contract

Database technology:

``` text
MariaDB
```

Backend driver:

``` text
mysql2
```

Access:

``` text
shared query / withTransaction helpers
```

No ORM.

No module-local pool.

The CTO technical specification identifies one Student Observations
table:

``` text
client_student_observations
```

with one record model and an observation-type distinction.

Minimum required conceptual columns:

``` text
id
org_id
student_id
author_id
observation_type
content
created_at
updated_at
```

Observation type:

``` text
anecdotal
class_school
```

Exact SQL types, foreign-key targets and final migration number must be
confirmed against the current repository schema/migration state before
the migration is committed.

------------------------------------------------------------------------

# 32. Database Assignment --- Khushboo

**Developer:** Khushboo\
**Role:** Team Lead + MariaDB + Integration

Khushboo owns:

-   final scratch MariaDB schema approval;
-   migration file;
-   constraints;
-   relationships;
-   indexes;
-   seed/demo data where required;
-   API/database field alignment;
-   organization ownership;
-   integration validation;
-   contract review;
-   PR review;
-   final mock → real API integration validation.

Database work must support the API contract rather than being designed
independently.

------------------------------------------------------------------------

# 33. Migration Standard

Migration location must follow the repository's approved migration
location.

Filename:

``` text
NNN_create_student_observations.sql
```

Rules:

-   use the next valid migration sequence from the real repository;
-   do not guess a production migration number in advance;
-   never write `USE <database>;`;
-   use approved `client_*` naming;
-   changes should be additive/idempotent where the platform standard
    requires;
-   do not destructively modify unrelated tables;
-   do not insert real student information;
-   permission seed/registration changes must follow the approved
    platform migration/seed mechanism.

------------------------------------------------------------------------

# 34. Indexing Requirements

Indexes must support the actual query patterns.

At minimum, review indexing for:

-   `org_id`;
-   `student_id`;
-   `author_id`;
-   `observation_type`;
-   common organization + filter combinations where justified.

Do not add duplicate/unnecessary indexes.

Tenant-filtered query performance should be considered first.

------------------------------------------------------------------------

# 35. Tenant Isolation

Student Observations is tenant scoped.

Every applicable database query must enforce organization ownership.

Conceptual rule:

``` text
Authenticated User
↓
req.user.org_id
↓
Backend
↓
Visibility Rules
↓
Repository
↓
WHERE org_id = authenticated organization
↓
MariaDB
```

A user from Organization A must never retrieve or mutate Organization
B's observations.

Organization identity must not be hardcoded.

The client must not decide tenant scope.

------------------------------------------------------------------------

# 36. Student and Author Relationships

Every observation must retain:

-   the associated student;
-   identifiable author;
-   owning organization.

The backend must validate relationships according to the platform's
approved student/user access mechanisms.

Do not trust arbitrary frontend names as authoritative student/author
identity.

Cross-module data access must follow the platform's approved service/API
boundaries rather than introducing uncontrolled direct coupling.

------------------------------------------------------------------------

# 37. Validation Requirements

Backend validation is authoritative.

Validate at minimum:

-   required `studentId`;
-   supported `observationType`;
-   required observation content;
-   acceptable identifier formats;
-   pagination/query values;
-   organization scope;
-   record existence;
-   permission/visibility for read/edit;
-   edit eligibility.

Frontend validation improves UX but does not replace backend validation.

The source documents do not define a specific content-length limit; do
not invent a permanent product rule without approval. A safe technical
limit may be proposed to the Team Lead before implementation if required
by schema design.

------------------------------------------------------------------------

# 38. Shared Database Access --- Non-Negotiable

Do not create:

``` text
mysql.createPool(...)
```

inside Student Observations.

Use the platform's shared database helpers.

Conceptual:

``` text
const { query, withTransaction } = sharedDatabaseModule;
```

Actual import path must be taken from the current repository.

All dynamic SQL values must use parameterized queries.

Never concatenate untrusted user input into SQL.

------------------------------------------------------------------------

# 39. Transactions

Use `withTransaction` where a business operation requires multiple
database changes to succeed/fail atomically.

Do not add transactions mechanically to read-only operations.

Where create/update requires both the primary mutation and other
transactional data changes, follow the shared transaction pattern.

Audit behavior must follow the platform audit helper's expected
transaction semantics.

------------------------------------------------------------------------

# 40. Error Handling

Errors must be controlled and must not leak:

-   SQL internals;
-   stack traces to normal clients;
-   secrets;
-   cross-tenant existence information;
-   sensitive student information.

Examples of API error categories:

``` text
VALIDATION_ERROR
FORBIDDEN
NOT_FOUND
OBSERVATION_NOT_EDITABLE
INTERNAL_ERROR
```

Exact platform error utilities/codes should be reused where already
standardized.

A failed backend operation must never be shown as successful by the
frontend.

------------------------------------------------------------------------

# 41. Platform Registration

Where applicable, integration must verify:

-   [ ] backend route registered;
-   [ ] navigation/route entry registered;
-   [ ] permissions registered in the platform catalog;
-   [ ] RBAC/Role Builder compatibility verified;
-   [ ] module registry updated;
-   [ ] `module_key = student_observations`;
-   [ ] registry coverage/platform tests pass.

A module is not integration-complete merely because its files exist.

------------------------------------------------------------------------

# 42. Team Ownership Matrix

  --------------------------------------------------------------------------------
  Developer               Area                    Ownership
  ----------------------- ----------------------- --------------------------------
  Sunidhi                 Frontend                List, search, filters,
                                                  pagination, states, responsive
                                                  browsing

  Ankit                   Frontend                Create/Edit form, detail,
                                                  student/type selection, overview

  Neha                    Backend                 Core routes/API, create/detail,
                                                  repository foundation, mapping

  Jatin                   Backend                 List/search/filter/pagination,
                                                  visibility, controlled editing

  Khushboo                Lead / DB               MariaDB, schema/migration,
                                                  contract, review, integration
  --------------------------------------------------------------------------------

------------------------------------------------------------------------

# 43. File Ownership Rule

Developers should avoid casually modifying another developer's owned
files.

If a shared file must change:

1.  discuss the change;
2.  confirm contract impact;
3.  identify one owner;
4.  make the smallest compatible change;
5.  review before merge.

Shared platform files such as navigation, registry, auth, permissions
and global configuration require additional coordination.

------------------------------------------------------------------------

# 44. Git Branch Contract

Branches should be created from the latest approved baseline.

Expected branches:

``` text
feature/observations-frontend-sunidhi
feature/observations-frontend-ankit
feature/observations-backend-neha
feature/observations-backend-jatin
feature/observations-database-khushboo
```

Direct feature development on `main` is prohibited unless explicitly
authorized.

Workflow:

``` text
Latest Approved Main
↓
Assigned Feature Branch
↓
Read Contract
↓
Implement Assigned Scope
↓
Run Locally
↓
Test
↓
Fix
↓
Small Logical Commits
↓
Push
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
```

------------------------------------------------------------------------

# 45. Frontend Checklist

-   [ ] Next.js App Router used
-   [ ] React 19 used
-   [ ] TypeScript used
-   [ ] Tailwind CSS 4 used
-   [ ] No Vite module app
-   [ ] No React Router module architecture
-   [ ] Approved platform route template followed
-   [ ] WisWits design tokens followed
-   [ ] Playfair Display / Source Sans 3 followed through platform
    styling
-   [ ] No independent theme
-   [ ] No native alert/confirm/prompt
-   [ ] Platform toast/ConfirmDialog patterns used
-   [ ] Both observation types supported
-   [ ] List works
-   [ ] Search/filter behavior works where applicable
-   [ ] Create form works
-   [ ] Detail works
-   [ ] Controlled Edit UI works
-   [ ] Pagination works
-   [ ] Mock matches API contract
-   [ ] No mock arrays scattered through components
-   [ ] Loading state
-   [ ] Empty state
-   [ ] Error state
-   [ ] Retry state
-   [ ] Success feedback
-   [ ] Responsive behavior
-   [ ] No real student data
-   [ ] No direct MariaDB access

------------------------------------------------------------------------

# 46. Backend Checklist

-   [ ] Approved layered structure followed
-   [ ] Shared `authenticate` used
-   [ ] No module-local JWT verification
-   [ ] No Bearer parsing inside module
-   [ ] Shared permission middleware used
-   [ ] No local hardcoded permission system
-   [ ] Shared DB helpers used
-   [ ] No module-local `mysql.createPool`
-   [ ] Parameterized SQL used
-   [ ] `org_id` enforced on every tenant-scoped query
-   [ ] Role-scoped visibility enforced server-side
-   [ ] Author attribution preserved
-   [ ] Create endpoint works
-   [ ] List endpoint works
-   [ ] Detail endpoint works
-   [ ] Controlled edit works
-   [ ] Search/filters/pagination work
-   [ ] Validation works
-   [ ] Controlled errors returned
-   [ ] Create audit call exists
-   [ ] Edit audit call exists
-   [ ] Tests cover core behavior
-   [ ] Cross-tenant access is tested
-   [ ] Unauthorized edit is tested

------------------------------------------------------------------------

# 47. Database Checklist

-   [ ] MariaDB used
-   [ ] `mysql2` only through approved shared DB infrastructure
-   [ ] `client_student_observations` schema supports contract
-   [ ] `org_id` is mandatory
-   [ ] Student relationship exists
-   [ ] Author relationship exists
-   [ ] Observation type supports only approved values
-   [ ] Required timestamps exist
-   [ ] Migration uses `NNN_description.sql`
-   [ ] No `USE <db>;`
-   [ ] Required constraints exist
-   [ ] Required indexes reviewed
-   [ ] Parameterized access supported
-   [ ] Seed/mock DB data contains no real student information
-   [ ] Migration does not destructively modify unrelated data

------------------------------------------------------------------------

# 48. Security Checklist

-   [ ] Shared authentication used
-   [ ] Permission checks enforced server-side
-   [ ] Tenant isolation verified
-   [ ] Role-scoped visibility verified
-   [ ] Author/edit rules verified
-   [ ] Parameterized SQL verified
-   [ ] Secrets not committed
-   [ ] Real student information not used in mock/test prompts/data
-   [ ] Audit calls verified
-   [ ] Sensitive errors not exposed
-   [ ] Frontend cannot bypass authorization by manually calling API
-   [ ] Cross-organization read blocked
-   [ ] Cross-organization edit blocked

------------------------------------------------------------------------

# 49. Integration Checklist

Before integration:

-   [ ] all developers pushed latest approved work;
-   [ ] PRs available;
-   [ ] migration available;
-   [ ] mock/API contract still matches;
-   [ ] no critical unresolved developer blocker.

Integration:

-   [ ] Next.js frontend starts inside platform
-   [ ] No Vite build is required
-   [ ] Backend starts inside platform
-   [ ] MariaDB connection works through shared pool/helpers
-   [ ] Migration runs through platform runner
-   [ ] No `USE <db>;` migration failure
-   [ ] Module route is registered
-   [ ] Permissions are registered
-   [ ] Shared authentication works with real platform session
-   [ ] `req.user.org_id` tenant context works
-   [ ] Mock source can be replaced without UI rewrite
-   [ ] Real observation list loads
-   [ ] Create persists real MariaDB data
-   [ ] Detail loads real record
-   [ ] Filters/pagination use real backend
-   [ ] Controlled edit persists
-   [ ] Create/edit audit events are written
-   [ ] Role-scoped visibility works
-   [ ] Cross-tenant access fails safely
-   [ ] Platform toast/ConfirmDialog behavior works
-   [ ] Responsive UI verified
-   [ ] Tests pass
-   [ ] No unrelated architecture rewrite required

------------------------------------------------------------------------

# 50. Acceptance Criteria

Student Observations is implementation-complete only when:

1.  Authorized users can access the module.
2.  Anecdotal observations can be created and viewed.
3.  Class/School observations can be created and viewed.
4.  Both record types operate inside one common module.
5.  Every observation retains identifiable authorship.
6.  Observations are associated with the correct student.
7.  Organization isolation is enforced.
8.  Role-scoped visibility is enforced server-side.
9.  Controlled editing is enforced.
10. Applicable edits are audit logged.
11. Applicable creates are audit logged according to the current intake
    standard.
12. Frontend and backend follow the same API contract.
13. Mock data can be replaced with the real API without rebuilding the
    frontend.
14. MariaDB persistence works.
15. Shared authentication is used.
16. Shared permission middleware/catalog is used.
17. Shared DB helpers are used.
18. Parameterized SQL is used.
19. Next.js App Router integration works.
20. Required loading/empty/error/retry/success states work.
21. Responsive behavior is verified.
22. Validation and controlled error handling work.
23. Module/route/permission registration is complete where applicable.
24. Relevant tests pass.
25. Integration testing passes.
26. Required corrections are completed.
27. Technical review is complete.

A rendered UI or isolated backend alone does not constitute module
completion.

------------------------------------------------------------------------

# 51. Definition of Done

``` text
Requirements
✓

Approved Contract
✓

Team Understanding
✓

Next.js Frontend
✓

Backend
✓

MariaDB
✓

Mock Contract
✓

Real API Integration
✓

Shared Authentication
✓

Shared Permissions
✓

Shared DB Infrastructure
✓

Tenant Isolation
✓

Role-Scoped Visibility
✓

Author Attribution
✓

Controlled Editing
✓

Audit
✓

Validation
✓

Required UI States
✓

Responsive Behavior
✓

Tests
✓

Platform Registration
✓

PR Review
✓

Corrections
✓

Integration
✓
```

Only then is Student Observations considered implementation-complete.

------------------------------------------------------------------------

# 52. Developer Boundaries

Developers must not independently:

-   change the technology stack;
-   use Vite instead of Next.js;
-   introduce React Router;
-   create another frontend application;
-   change the Master Architecture;
-   introduce another database technology;
-   introduce an ORM;
-   create a module-local database pool;
-   implement custom JWT verification;
-   parse Bearer tokens inside the module;
-   create a parallel authentication system;
-   create a parallel permission system;
-   hardcode organization IDs;
-   bypass role-scoped visibility;
-   bypass audit logging;
-   expose real student data in mocks;
-   create a second observations module for the second record type;
-   change approved API contracts without review;
-   add unapproved dependencies;
-   create a new global theme/design system;
-   use native alert/confirm/prompt instead of platform feedback;
-   modify unrelated modules;
-   commit secrets;
-   write `USE <database>;` in migrations.

If an unresolved architecture question appears, raise it to the Team
Lead before implementing a conflicting solution.

------------------------------------------------------------------------

# 53. AI-Assisted Development Rule

AI tools may assist implementation only inside the approved boundaries.

Before using AI for code generation, developers should provide the
relevant controlled context:

1.  authoritative platform/engineering rules made available by the team;
2.  this Student Observations contract;
3.  an approved existing platform page/module template where supplied.

AI must not independently choose:

-   technology stack;
-   database technology;
-   database schema changes;
-   security architecture;
-   authentication model;
-   permission model;
-   unapproved dependencies.

Never place real credentials, tokens, production connection strings or
real student information into AI prompts.

Developers remain responsible for understanding the code they submit.

------------------------------------------------------------------------

# 54. Integration Objective

The module is intentionally designed so that the Team Lead should not
have to reconstruct developer work during integration.

Expected flow:

``` text
Sunidhi Next.js Frontend
          +
Ankit Next.js Frontend
          +
Neha Backend
          +
Jatin Backend
          +
Khushboo MariaDB
          ↓
One Approved Student Observations Module
          ↓
Mock → Real API
          ↓
Shared Auth + Permission + DB + Audit
          ↓
End-to-End Validation
          ↓
Corrections
          ↓
Verify-and-Merge
```

The goal is to improve the previous integration outcome by moving
platform compatibility requirements **upstream into source
development**.

------------------------------------------------------------------------

# 55. Developer Starting Instruction

Before writing code:

1.  Pull/fetch the latest approved branch/baseline.
2.  Switch to your assigned Student Observations feature branch.
3.  Read this entire contract.
4.  Read the current Engineering Standards / platform intake rules
    supplied by the Team Lead.
5.  Understand what Student Observations is.
6.  Locate your name and ownership section in this contract.
7.  Confirm the Next.js App Router template before creating frontend
    route files.
8.  Confirm shared backend import patterns before writing
    auth/DB/permission code.
9.  Confirm the API/mock contract.
10. Implement only your assigned scope.
11. Run locally.
12. Test your work.
13. Fix implementation bugs.
14. Commit logical changes.
15. Push only to your assigned branch.
16. Create/submit the required PR.
17. Respond to Team Lead integration corrections.

Do not develop this module directly on `main`.

------------------------------------------------------------------------

# 56. Core Engineering Rule

## BUILD THE BUSINESS MODULE FROM SCRATCH --- NOT THE PLATFORM INFRASTRUCTURE.

Student Observations must be implemented as **one module by multiple
developers**.

The two observation types are:

``` text
Anecdotal
Class / School
```

They belong to the same module.

Developers own implementation inside the approved structure.

The Team Lead owns contract alignment, architecture control, MariaDB
alignment, review and integration.

The source implementation should already match the host platform closely
enough that final integration becomes:

``` text
VERIFY
+
CONNECT
+
TEST
+
CORRECT
+
MERGE
```

not:

``` text
REWRITE
+
RE-ARCHITECT
+
REBUILD
```

When uncertain, ask before inventing a new platform pattern.

------------------------------------------------------------------------

**END OF CONTRACT**
