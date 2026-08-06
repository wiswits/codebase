# EduSuite Visitor Management Engineering Contract

**Module Name:** Visitor Management  
**Module Code:** OPS-VIS  
**Functional Lane:** Lane A — Operations  
**Module Key:** visitor  
**Version:** 1.0  
**Release Status:** GATED / planned  
**Prepared By:** Khushboo — Team Lead  
**Implementation Approach:** Build from Scratch  
**Database:** MariaDB  

---

# 1. What is Visitor Management?

Visitor Management is a system used by an educational institution to manage people
who temporarily visit the campus but are not regular students or employees.

Typical visitors may include:

- Parents / Guardians
- Guests
- Vendors
- Service personnel
- Interview candidates
- External officials
- Other authorized visitors

The system records when a visitor enters the institution, whom they are visiting,
the purpose of the visit, their visitor pass, and when they leave.

The purpose is to provide a controlled and traceable visitor-entry process instead
of depending on manual registers.

---

# 2. Simple Example

Example:

A parent arrives at the school to meet a teacher.

The authorized staff member:

1. Opens Visitor Management.
2. Registers the visitor.
3. Records the purpose of the visit.
4. Selects/identifies the host.
5. Records check-in.
6. Generates a visitor pass.
7. Performs the host-notification action where applicable.
8. Visitor completes the visit.
9. Staff records checkout.
10. The visit remains available in Visitor History.

---

# 3. Module Purpose

Visitor Management shall provide authorized users with a structured way to:

- Register visitor entry
- Record visitor checkout
- Maintain visitor history
- Generate/print visitor passes
- Associate visitors with hosts
- Trigger the approved host-notification action
- Search and filter visitor records

The module must follow the EduSuite Master Architecture and Engineering Standards.

---

# 4. Source Requirements

The module is based on:

- WisWits SaaS Platform PRD
- CTO Technical Specification
- EduSuite Master Engineering Architecture
- Engineering Standards
- Engineering Execution & Module Integration Plan
- Module Contract Template

Approved PRD requirements:

- FR-VIS-001 — Visitor check-in
- FR-VIS-002 — Visitor checkout
- FR-VIS-003 — Visitor log
- FR-VIS-004 — Pass generation/printing
- FR-VIS-005 — Host identification
- FR-VIS-006 — Host-notification action
- FR-VIS-007 — Search/filter where applicable

---

# 5. Release Restriction

Visitor Management is a GATED capability.

Development and internal testing may proceed.

The module must remain:

module_key = visitor

platform_modules.status = planned

Customer launch must not occur without explicit Founder/CTO authorization.

Developers must not independently change the module to a customer-live state.

---

# 6. Users and Permissions

Primary users may include authorized:

- Reception staff
- Administrative staff
- Security / gate staff
- Institution administrators

Actual access remains permission controlled.

Required permissions:

visitor.view
visitor.manage

### visitor.view

Allows authorized users to:

- View visitor records
- View visitor history
- Search/filter visitor records
- View visitor details

### visitor.manage

Allows authorized users to perform applicable management actions including:

- Visitor check-in
- Visitor checkout
- Pass operations
- Host-related visitor actions

---

# 7. Visitor Lifecycle

Visitor Arrives
↓
Authorized User Opens Visitor Management
↓
Visitor Details Entered
↓
Host Identified
↓
Purpose Recorded
↓
Validation
↓
Visitor Check-In
↓
Visitor Record Created
↓
Visitor Pass Generated
↓
Host Notification Action
↓
Visit In Progress
↓
Visitor Leaves
↓
Checkout Recorded
↓
Visit Stored in Visitor History

---

# 8. Module Scope

## In Scope

- Visitor check-in
- Visitor checkout
- Visitor log
- Visitor history
- Visitor details
- Visitor pass generation
- Visitor pass printing
- Host identification
- Host association
- Host-notification action
- Visitor search
- Visitor filtering
- Required UI states
- Authorization
- Tenant isolation
- API integration
- MariaDB persistence

## Out of Scope

Unless separately approved:

- Biometric visitor recognition
- Facial recognition
- Government identity verification integrations
- Hardware gate-control integration
- Visitor surveillance
- Customer production activation

Developers must not independently expand the approved product scope.

---

# 9. Frontend Blueprint

Visitor Management frontend should provide:

## Main Pages

- Visitor Dashboard
- Visitor Check-In
- Visitor Log
- Visitor Details
- Visitor Pass View / Print

## Required UI Features

- Search
- Filters
- Visitor table/list
- Visitor detail display
- Check-in form
- Checkout action
- Host selection
- Purpose input
- Pass preview
- Print action
- Host-notification action
- Status indicators

## Required UI States

Every applicable page/component must consider:

- Loading
- Empty
- Error
- Retry
- Offline
- Success
- Disabled / unauthorized where applicable

The UI must remain responsive across applicable phone, tablet and desktop layouts.

---

# 10. Frontend Assignment

## Sunidhi — Frontend Intern

### Assigned Scope

Sunidhi owns the simpler visitor browsing experience.

She will implement:

- Visitor Log page
- Visitor Details page
- Visitor Search UI
- Visitor Filters UI
- Visitor Status Badge
- Empty state
- Loading state
- Error state

Suggested structure:

apps/web/src/modules/visitor/
├── pages/
│   ├── VisitorLog.jsx
│   └── VisitorDetails.jsx
│
├── components/
│   ├── VisitorTable.jsx
│   ├── VisitorSearch.jsx
│   ├── VisitorFilters.jsx
│   ├── VisitorStatusBadge.jsx
│   └── VisitorEmptyState.jsx
│
└── mocks/
    └── visitor.mock.js

Sunidhi may use approved mock data while backend development is in progress.

Mock structures must match the API contract.

---

## Ankit — Frontend Intern

Ankit owns the primary operational Visitor workflow.

### Assigned Scope

- Visitor Dashboard
- Visitor Check-In page
- Check-In form
- Host-selection UI
- Purpose-of-visit UI
- Checkout UI/action
- Visitor Pass UI
- Pass preview
- Print action
- Host-notification action UI

Suggested structure:

apps/web/src/modules/visitor/
├── pages/
│   ├── VisitorDashboard.jsx
│   ├── VisitorCheckIn.jsx
│   └── VisitorPass.jsx
│
└── components/
    ├── VisitorStats.jsx
    ├── VisitorCheckInForm.jsx
    ├── HostSelector.jsx
    ├── CheckoutAction.jsx
    ├── VisitorPassCard.jsx
    └── HostNotificationAction.jsx

Sunidhi and Ankit must avoid editing the same files wherever possible.

---

# 11. Backend Blueprint

Backend implementation should follow:

Route
↓
Authentication
↓
Permission
↓
Validation
↓
Controller
↓
Service
↓
Repository / Data Layer
↓
MariaDB
↓
Standard Response

Backend base API:

/api/v1/visitors

---

# 12. Backend Assignment — Neha

Neha owns the core Visitor lifecycle backend.

### Responsibilities

- Visitor check-in API
- Visitor checkout API
- Visitor list/log API
- Visitor detail API
- Input validation
- Core visitor business logic
- Tenant-scoped operations
- Standard API responses
- Error handling

Suggested files:

visitor.routes.js
visitor.controller.js
visitor.service.js
visitor.validator.js
visitor.repository.js

---

# 13. Backend Assignment — Jatin

Jatin owns supporting Visitor capabilities.

### Responsibilities

- Visitor pass backend
- Pass retrieval
- Host association support
- Search/filter backend
- Host-notification action backend
- Supporting validation
- Supporting service logic
- Tenant-scoped operations

Suggested supporting files:

visitor-pass.controller.js
visitor-pass.service.js
visitor-pass.repository.js
visitor-search.service.js
visitor-notification.service.js

Where the existing architecture prefers fewer files, these responsibilities may be
implemented inside the approved Visitor module structure rather than creating
unnecessary duplicate layers.

---

# 14. Database Assignment — Khushboo

Khushboo owns the MariaDB implementation and database contract.

Approved Visitor tables:

client_visitor_logs
client_visitor_passes

Responsibilities include:

- Physical schema
- Fields
- Primary keys
- Foreign keys
- Organization/tenant ownership
- Relationships
- Required indexes
- Migration
- Data integrity
- Integration support

Backend developers must not independently invent conflicting database schemas.

---

# 15. Database Reference

## client_visitor_logs

Purpose:

Store the Visitor visit lifecycle.

The final physical schema shall support the approved requirements including:

- Organization ownership
- Visitor identity/details required by approved workflow
- Host association
- Purpose of visit
- Check-in information
- Checkout information
- Visit status
- Acting-user/reference fields where required
- Timestamps

Exact physical fields, types and constraints shall follow the approved MariaDB
schema prepared for implementation.

---

## client_visitor_passes

Purpose:

Store visitor-pass information associated with visitor visits.

The final schema shall support:

- Organization ownership
- Visitor/visit association
- Pass identifier
- Pass lifecycle information
- Required timestamps

Exact fields and constraints shall follow the approved database implementation.

---

# 16. Tenant Isolation

Visitor Management is organization scoped.

Every tenant-owned operation must preserve organizational isolation.

Conceptually:

Authenticated User
↓
Organization Context
↓
Visitor Service
↓
Repository
↓
Organization-Scoped Query
↓
MariaDB

A user from Organization A must never be able to access Visitor records belonging
to Organization B.

Tenant isolation must be enforced server-side.

Frontend filtering alone is not security.

---

# 17. API Contract

Base:

/api/v1/visitors

The following endpoint breakdown is the module implementation contract and must
remain consistent across frontend and backend.

## Create Visitor Check-In

POST /api/v1/visitors/check-in

Purpose:

Register a visitor and begin the visit.

Required permission:

visitor.manage

---

## Visitor List

GET /api/v1/visitors

Purpose:

Return authorized organization-scoped visitor records.

Required permission:

visitor.view

Supports approved search/filter behavior.

---

## Visitor Details

GET /api/v1/visitors/:visitorLogId

Purpose:

Retrieve an authorized visitor visit record.

Required permission:

visitor.view

---

## Visitor Checkout

PATCH /api/v1/visitors/:visitorLogId/check-out

Purpose:

Record visitor departure.

Required permission:

visitor.manage

---

## Generate Visitor Pass

POST /api/v1/visitors/:visitorLogId/pass

Purpose:

Generate/create the visitor pass associated with the visit.

Required permission:

visitor.manage

---

## Get Visitor Pass

GET /api/v1/visitors/:visitorLogId/pass

Purpose:

Retrieve pass information for display/printing.

Required permission:

visitor.view

---

## Host Notification Action

POST /api/v1/visitors/:visitorLogId/notify-host

Purpose:

Trigger the approved host-notification action.

Required permission:

visitor.manage

Actual communication-provider behavior must follow the approved platform
communication architecture.

Developers must not independently introduce communication providers.

---

# 18. Standard API Response

Success:

{
  "success": true,
  "data": {}
}

Error:

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}

Frontend and backend must use the approved platform response conventions.

---

# 19. Search and Filtering

Visitor records should support applicable search/filter behavior.

Potential contract-supported criteria include:

- Visitor
- Host
- Visit status
- Date / date range

Implementation must not bypass tenant or permission restrictions.

---

# 20. Visitor Pass Flow

Successful Check-In
↓
Visitor Log Exists
↓
Generate Pass
↓
Associate Pass With Visit
↓
Return Pass Data
↓
Frontend Displays Pass
↓
Authorized Print Action

Pass generation must not create an unrelated visitor record.

---

# 21. Checkout Rules

Checkout must:

- Target an existing authorized visitor visit
- Respect organization boundaries
- Record checkout information
- Update the applicable visit state
- Return an accurate success/failure response

Invalid operations must return controlled errors.

---

# 22. Host Association

A visitor must be associated with the applicable host according to the approved
workflow.

Backend validation must prevent invalid references where applicable.

Host data must be resolved using approved platform data sources.

Developers must not create a parallel user/employee identity system for Visitor
Management.

---

# 23. Host Notification

The module shall expose the approved host-notification action.

The Visitor module is responsible for initiating the action.

Actual message delivery must use the platform-approved communication architecture.

No developer may independently add:

- SMS provider credentials
- WhatsApp provider credentials
- Email credentials
- Hard-coded secrets

---

# 24. Mock Data Contract

Frontend development may proceed using mock Visitor data while backend APIs are
being implemented.

Mock data must:

- Follow the API response structure
- Use no real personal data
- Contain no real credentials
- Be easily replaceable by real API responses

The frontend must not be architected around mock-only behavior.

---

# 25. Module Registration

Required module registration:

module_key = visitor

platform_modules.status = planned

Where applicable verify:

- [ ] Backend route registered
- [ ] Navigation registered
- [ ] Permissions registered
- [ ] RBAC / Role Builder registration
- [ ] Module registry updated
- [ ] Feature/plan registration completed
- [ ] Status remains planned

---

# 26. Security Requirements

The implementation must preserve:

- Authentication
- Authorization
- Tenant isolation
- Input validation
- Controlled error handling
- Secret protection
- Data integrity
- Applicable traceability/audit behavior

Real visitor/student/employee information must not be placed into AI prompts or
committed as mock data.

---

# 27. Team Assignment

| Area | Developer | Responsibility |
|---|---|---|
| Frontend | Sunidhi | Visitor Log, Details, Search, Filters, UI states |
| Frontend | Ankit | Dashboard, Check-In, Checkout, Pass, Host UI |
| Backend | Neha | Core Visitor lifecycle APIs |
| Backend | Jatin | Pass, Host, Search/Filter, Notification backend |
| Database | Khushboo | MariaDB schema, migration, relationships, indexes |
| Integration | Khushboo | End-to-end integration and validation |
| Review | Khushboo | Contract, PR and architecture review |

---

# 28. Git Branches

Sunidhi:

feature/visitor-frontend-sunidhi

Ankit:

feature/visitor-frontend-ankit

Neha:

feature/visitor-backend-neha

Jatin:

feature/visitor-backend-jatin

Khushboo:

feature/visitor-database-khushboo

No developer should implement Visitor Management directly on main.

---

# 29. Git Workflow

main
↓
Assigned Visitor Branch
↓
Development
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
Corrections If Required
↓
Final Review
↓
Merge

A branch is not merged simply because development time has ended.

---

# 30. Integration Contract

Frontend
↓
Visitor API Contract
↓
Backend
↓
MariaDB
↓
Backend Response
↓
Frontend Update

Integration must verify:

- Endpoint compatibility
- Request compatibility
- Response compatibility
- Validation
- Authorization
- Tenant isolation
- Database persistence
- Error behavior
- UI updates
- Visitor lifecycle correctness

---

# 31. Integration Checklist

## Frontend

- [ ] Visitor Dashboard works
- [ ] Check-In UI works
- [ ] Visitor Log works
- [ ] Visitor Details works
- [ ] Search works
- [ ] Filters work
- [ ] Checkout UI works
- [ ] Pass view works
- [ ] Print action works
- [ ] Host UI works
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Retry behavior where applicable
- [ ] Responsive behavior

## Backend

- [ ] Check-in endpoint works
- [ ] Checkout endpoint works
- [ ] Visitor list works
- [ ] Visitor details works
- [ ] Pass operations work
- [ ] Search/filter works
- [ ] Host association works
- [ ] Host-notification action works
- [ ] Validation works
- [ ] Permissions work
- [ ] Error handling works

## Database

- [ ] Migration works
- [ ] Visitor logs persist
- [ ] Visitor passes persist
- [ ] Relationships work
- [ ] Organization isolation works
- [ ] Required indexes exist
- [ ] Data integrity is preserved

---

# 32. Acceptance Criteria

Visitor Management is implementation-complete only when:

1. Authorized users can register visitor check-in.
2. Authorized users can record visitor checkout.
3. Authorized users can review visitor history.
4. Visitor passes can be generated and displayed/printed.
5. Visitors can be associated with the appropriate host.
6. The approved host-notification action is available.
7. Applicable search/filter behavior works.
8. Frontend and backend follow the same API contract.
9. MariaDB persistence works.
10. Tenant isolation is verified.
11. Permissions are verified.
12. Required UI states exist.
13. Responsive behavior is verified.
14. Validation and error handling work.
15. Integration testing passes.
16. Required module registration is complete.
17. Technical review is complete.

Implementation completion does not automatically authorize customer release.

---

# 33. Development Boundaries

Developers must not independently:

- Change the technology stack
- Change the Master Architecture
- Change approved API contracts
- Introduce another database
- Create duplicate Visitor tables
- Create a parallel authentication system
- Create a parallel host/user system
- Add communication providers
- Commit secrets
- Remove tenant isolation
- Change module release status
- Modify unrelated modules
- Introduce unapproved dependencies

Any material contract change must be discussed before implementation.

---

# 34. Definition of Done

Code written alone is not Done.

UI completed alone is not Done.

A task/module is Done only when applicable:

Requirements
✓

Contract
✓

Frontend
✓

Backend
✓

Database
✓

Integration
✓

Validation
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

Required Corrections
✓

---

# 35. Release Gate

Visitor Management remains a GATED module.

Development:
ALLOWED

Internal Integration:
ALLOWED

Testing:
ALLOWED

Customer Launch:
NOT AUTHORIZED UNTIL FOUNDER/CTO APPROVAL

The platform registration must remain:

module_key = visitor
status = planned

until explicit authorization is received.

---

# 36. Core Engineering Rule

Build Visitor Management from scratch according to this module contract while
remaining inside the shared EduSuite Master Architecture.

Do not redesign the platform while implementing the module.

Do not guess unresolved architecture decisions.

When uncertain, raise the issue to the Team Lead before implementation.