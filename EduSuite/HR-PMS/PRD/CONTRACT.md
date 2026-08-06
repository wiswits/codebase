# EduSuite HR-PMS
# PMS & Appraisal Module Engineering Contract

**Module ID:** HR-PMS  
**Module Key:** `hr_pms`  
**Lane:** People & HR  
**Priority:** P4  
**Development Mode:** BUILD FROM ZERO  
**Implementation Type:** Fresh Module  
**Target Product:** EduSuite SaaS  

---

# 1. CONTRACT PURPOSE

This document defines the engineering contract for building the
EduSuite PMS & Appraisal module.

The module must be developed FROM ZERO.

Existing or previously created PMS/Appraisal implementations must not
be treated as the implementation base for this assignment.

The approved EduSuite Platform PRD and CTO/Engineering specifications
are the authoritative sources for the module requirements.

The implementation must satisfy the contracts defined in this document
while remaining compatible with later integration into the main
EduSuite SaaS product.

---

# 2. TEAM OWNERSHIP

The module is assigned to three contributors.

## Jatin — Complete Frontend

Jatin owns the complete frontend implementation.

Responsibilities:

- PMS dashboard
- Review-cycle interfaces
- Goal-management interfaces
- Self-review interface
- Reviewer interface
- Rating-summary interface
- Forms
- Validation states
- Loading states
- Empty states
- Error states
- Responsive behavior
- Frontend service layer
- TypeScript domain types
- Mock development data where required
- API-ready frontend architecture

---

## Neha — Complete Backend

Neha owns the complete backend implementation.

Responsibilities:

- PMS routes
- Controllers
- Services
- Repositories/data-access layer
- Request validation
- Response formatting
- Goal-management APIs
- Review-cycle APIs
- Self-review APIs
- Reviewer APIs
- Rating-summary API/data composition
- Permission enforcement
- Tenant isolation
- Error handling
- Database integration boundary

---

## Khushboo — Database + Integration Lead

Khushboo owns:

- Database design implementation
- SQL migrations/schema
- Relationships
- Constraints
- Indexes
- Demo/test data where required
- Database verification
- API/database contract verification
- Frontend/backend contract alignment
- Integration
- Integration testing
- Module review
- Git assembly
- Final validation

---

# 3. AUTHORITATIVE FUNCTIONAL SCOPE

HR-PMS contains five required capabilities.

## FR-PMS-001 — Goal Setting

The module must support appraisal goals.

Users with appropriate authorization must be able to work with goals
associated with the appraisal lifecycle.

---

## FR-PMS-002 — Review-Cycle Management

The module must support appraisal/review cycles.

The review cycle represents the organizational appraisal period within
which applicable goals and reviews operate.

---

## FR-PMS-003 — Self Review

An applicable employee/user must have a self-review experience.

Self-review must remain distinguishable from reviewer assessment.

---

## FR-PMS-004 — Reviewer Form

An appropriately authorized reviewer/manager must have a reviewer
assessment experience.

Reviewer actions must not be exposed as employee self-review actions.

---

## FR-PMS-005 — Rating Summary

The module must provide a rating/review summary representing the
available appraisal outcome information.

---

# 4. CORE BUSINESS RULE

Self-review and reviewer actions are different operations.

They MUST remain distinguishable.

They MUST be accessible only to the appropriate roles.

This separation must not rely solely on hiding frontend buttons.

The backend is responsible for enforcing access.

---

# 5. MODULE REGISTRATION

The canonical module key is:

```text
hr_pms
```

Do not invent alternate keys such as:

```text
pms
appraisal
hr_appraisal
performance_management
```

unless the platform integration layer explicitly requires an alias.

---

# 6. PERMISSION CONTRACT

The CTO specification defines the following permissions.

## Employee / Own Appraisal

```text
hr.pms.view
```

Scope:

Own PMS/appraisal information.

---

## Manager / Reviewer

```text
hr.pms.review
```

Scope:

Reviewer/manager appraisal actions permitted by the platform.

---

## HR Administrator

```text
hr.pms.manage
```

Scope:

PMS administration and management operations.

---

# 7. PERMISSION PRINCIPLE

Frontend permission behavior improves UX.

Backend permission enforcement provides security.

Therefore:

```text
Frontend hides/disables unauthorized actions
                    +
Backend independently verifies authorization
```

The backend must never assume that a request is authorized merely
because the frontend allowed the user to initiate it.

---

# 8. DATABASE CONTRACT

The CTO specification defines exactly three primary PMS tables:

```text
client_appraisal_cycles
client_appraisal_goals
client_appraisal_reviews
```

These names must remain canonical unless the final host database
migration strategy requires an approved adaptation.

---

# 9. CRITICAL REVIEW TABLE RULE

DO NOT create separate tables such as:

```text
client_self_reviews
client_reviewer_reviews
```

The CTO specification explicitly defines:

```text
client_appraisal_reviews
```

as the shared review table.

The distinction is represented using:

```text
review_type
```

with the canonical values:

```text
self
reviewer
```

Conceptually:

```text
client_appraisal_reviews
        │
        ├── review_type = self
        │
        └── review_type = reviewer
```

Visibility and access must be enforced server-side.

---

# 10. DATABASE RELATIONSHIP MODEL

The intended domain relationship is:

```text
APPRAISAL CYCLE
      │
      ├─────────────┐
      │             │
      ▼             ▼
    GOALS         REVIEWS
                    │
              ┌─────┴─────┐
              ▼           ▼
             SELF      REVIEWER
```

The physical schema must preserve the three-table CTO boundary.

---

# 11. DATABASE DESIGN REQUIREMENTS

Khushboo must prepare the database implementation around:

```text
client_appraisal_cycles
client_appraisal_goals
client_appraisal_reviews
```

The schema must account for:

- primary keys;
- organization/tenant ownership;
- appropriate employee/user references;
- cycle relationships;
- review relationships;
- `review_type`;
- timestamps;
- appropriate constraints;
- useful indexes;
- referential integrity where compatible with the host schema.

Exact foreign-key targets must be aligned with the existing EduSuite
HR/user schema during integration.

Do not invent duplicate employee/user master tables.

---

# 12. TENANT ISOLATION

HR-PMS belongs to a multi-tenant SaaS platform.

PMS records must remain organization scoped.

Conceptually:

```text
Authenticated User
       ↓
Trusted Organization Context
       ↓
Backend Authorization
       ↓
Tenant-Scoped Repository Query
       ↓
PMS Records
```

The client must not be considered the authority for organization
ownership.

A request must never gain cross-tenant access by changing an
organization identifier in browser data or an HTTP request.

---

# 13. FRONTEND TECHNOLOGY CONTRACT

Jatin must use the current approved frontend stack:

```text
Next.js 16
React 19
TypeScript
Tailwind CSS 4
Next.js App Router
```

Do NOT rebuild this module using:

```text
Vite
React Router
plain JavaScript
Tailwind CSS 3
```

The module must remain compatible with the EduSuite frontend
architecture.

---

# 14. FRONTEND MODULE BOUNDARY

Recommended module location:

```text
apps/web/src/modules/pms/
```

or the host-approved HR appraisal module location during final
integration.

The module should remain internally organized instead of placing all
logic inside route files.

---

# 15. JATIN — FRONTEND DELIVERY

Jatin owns the entire PMS frontend.

The implementation must provide interfaces for the five authoritative
requirements.

Recommended experience structure:

```text
PMS
│
├── Overview / Dashboard
│
├── Appraisal Cycles
│
├── Goals
│
├── Self Review
│
├── Reviewer Form
│
└── Rating Summary
```

These are implementation views around the PRD requirements, not new
product requirements.

---

# 16. FRONTEND — PMS OVERVIEW

The PMS landing experience should provide a clear entry point into the
appraisal lifecycle.

It may present information derived from:

- appraisal cycles;
- goals;
- available self-review activity;
- available reviewer activity;
- appraisal/rating summary.

The dashboard must not fabricate analytics that are not supported by
the backend contract.

---

# 17. FRONTEND — REVIEW CYCLES

The review-cycle UI must support FR-PMS-002.

At minimum, the frontend architecture must support:

```text
Cycle List
Cycle Details
Management Form/Actions for authorized users
Relevant cycle state
```

Exact lifecycle statuses beyond those defined in the eventual API
contract must not be invented independently by frontend code.

---

# 18. FRONTEND — GOALS

The goal interface must support FR-PMS-001.

Recommended reusable components:

```text
GoalList
GoalCard
GoalForm
GoalDetails
GoalEmptyState
```

Goal fields must ultimately match the approved API/database contract.

Frontend-only fields must not silently become domain requirements.

---

# 19. FRONTEND — SELF REVIEW

A dedicated self-review experience must exist.

The interface must clearly communicate that the user is completing
their own review.

Recommended component boundary:

```text
SelfReviewForm
```

The self-review must produce:

```text
review_type = self
```

through the API contract.

The frontend must not allow a normal self-review action to masquerade
as a reviewer submission.

---

# 20. FRONTEND — REVIEWER FORM

A dedicated reviewer experience must exist for users authorized with
the reviewer capability.

Recommended component boundary:

```text
ReviewerForm
```

Reviewer submissions must correspond to:

```text
review_type = reviewer
```

The frontend should clearly distinguish this workflow from self-review.

---

# 21. FRONTEND — RATING SUMMARY

The module must support FR-PMS-005.

The summary interface should display the appraisal information supplied
by the backend contract.

It must not independently calculate an undocumented appraisal formula.

If the PRD/CTO contract does not define a rating calculation formula,
the frontend must not invent one.

---

# 22. FRONTEND USER STATES

Every important data-driven screen must account for applicable states:

```text
Loading
Success
Empty
Validation Error
Request Error
Unauthorized / Forbidden
Not Found
Submitting
Submission Success
```

No screen should fail silently.

---

# 23. FRONTEND RESPONSIVE REQUIREMENT

The module must remain usable across supported desktop and responsive
layouts.

Forms, tables/cards, actions and review content must remain readable
without requiring an unnecessarily large viewport.

---

# 24. SUGGESTED FRONTEND STRUCTURE

Jatin may use a structure similar to:

```text
jatin-frontend/
│
└── apps/
    └── web/
        │
        ├── app/
        │   └── hr/
        │       └── pms/
        │           ├── page.tsx
        │           │
        │           ├── cycles/
        │           │
        │           ├── goals/
        │           │
        │           ├── self-review/
        │           │
        │           ├── reviews/
        │           │
        │           └── summary/
        │
        └── src/
            └── modules/
                └── pms/
                    │
                    ├── components/
                    │   ├── dashboard/
                    │   ├── cycles/
                    │   ├── goals/
                    │   ├── reviews/
                    │   └── summary/
                    │
                    ├── hooks/
                    ├── services/
                    ├── types/
                    ├── constants/
                    ├── utils/
                    └── mocks/
```

This is an engineering scaffold.

The exact host route location may be adjusted during EduSuite
integration.

---

# 25. FRONTEND SERVICE BOUNDARY

Components must not be tightly coupled to mock arrays.

Use:

```text
Page
 ↓
Component
 ↓
Hook / State Layer
 ↓
PMS Service
 ↓
Mock API during independent development
```

Later:

```text
Page
 ↓
Component
 ↓
Hook / State Layer
 ↓
PMS Service
 ↓
Real EduSuite API
```

This allows integration without rewriting the complete frontend.

---

# 26. BACKEND TECHNOLOGY PRINCIPLE

Neha must use the current EduSuite backend conventions and existing
backend runtime rather than creating an unrelated server architecture.

The backend contribution must be modular and integration-ready.

Do not create an unnecessary second SaaS backend.

---

# 27. NEHA — BACKEND DELIVERY

Neha owns:

```text
PMS Backend
│
├── Routes
├── Controllers
├── Services
├── Repositories
├── Validation
├── Permission Enforcement
├── Tenant Isolation
├── Error Handling
└── API Responses
```

---

# 28. BACKEND DOMAIN AREAS

The backend should expose functionality around:

```text
Appraisal Cycles
Goals
Reviews
Rating Summary
```

Self and reviewer reviews remain part of the same review domain.

---

# 29. API NAMESPACE

The current source material confirms the module registration and
database/permission contracts but does not explicitly lock a final
HR-PMS API prefix.

Therefore the team must NOT claim an invented API namespace as a
CTO-approved fact.

For independent development, a proposed namespace may be documented,
for example:

```text
/api/v1/hr/pms/...
```

but it must be marked as an implementation contract pending host
alignment.

---

# 30. PROPOSED API CONTRACT

For independent parallel development, use a consistent working
contract such as:

```text
GET    /api/v1/hr/pms/cycles
POST   /api/v1/hr/pms/cycles
GET    /api/v1/hr/pms/cycles/:id
PATCH  /api/v1/hr/pms/cycles/:id

GET    /api/v1/hr/pms/goals
POST   /api/v1/hr/pms/goals
GET    /api/v1/hr/pms/goals/:id
PATCH  /api/v1/hr/pms/goals/:id

GET    /api/v1/hr/pms/reviews
POST   /api/v1/hr/pms/reviews
GET    /api/v1/hr/pms/reviews/:id
PATCH  /api/v1/hr/pms/reviews/:id

GET    /api/v1/hr/pms/summary
```

These endpoints are the TEAM IMPLEMENTATION CONTRACT, not quoted PRD
requirements.

Any destructive operation must be added only if the agreed lifecycle
requires it.

---

# 31. API RESPONSE PRINCIPLE

Use one predictable response convention across the module.

Example:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Errors should also remain predictable.

Example:

```json
{
  "success": false,
  "message": "You are not authorized to perform this action"
}
```

The exact host-wide response wrapper should replace this proposal if
EduSuite already has a canonical response format.

---

# 32. BACKEND VALIDATION

Backend validation must exist independently from frontend validation.

Examples include:

- required identifiers;
- valid review type;
- valid referenced cycle;
- valid referenced employee/user;
- authorized operation;
- tenant ownership;
- expected field types.

The backend must reject invalid values even when the frontend normally
prevents them.

---

# 33. REVIEW TYPE VALIDATION

Only the CTO-defined values are valid:

```text
self
reviewer
```

The backend must reject unsupported review types.

Do not introduce:

```text
peer
360
principal
hr
external
```

as review types unless a future approved specification introduces
them.

---

# 34. SERVER-SIDE VISIBILITY

The CTO specification explicitly requires self/reviewer visibility to
be enforced server-side.

Therefore repository/service queries must account for the authenticated
user's permitted scope.

Do not fetch every review and rely on React to hide unauthorized
records.

---

# 35. BACKEND ERROR HANDLING

The module must distinguish applicable failures such as:

```text
400 — invalid request
401 — unauthenticated
403 — unauthorized
404 — resource not found
409 — conflicting state where applicable
500 — unexpected server error
```

Exact HTTP behavior should remain aligned with host API conventions.

---

# 36. SUGGESTED BACKEND STRUCTURE

Neha may use a structure similar to:

```text
neha-backend/
│
└── src/
    └── modules/
        └── pms/
            │
            ├── routes/
            │   └── pms.routes.js
            │
            ├── controllers/
            │   ├── cycle.controller.js
            │   ├── goal.controller.js
            │   └── review.controller.js
            │
            ├── services/
            │   ├── cycle.service.js
            │   ├── goal.service.js
            │   ├── review.service.js
            │   └── summary.service.js
            │
            ├── repositories/
            │   ├── cycle.repository.js
            │   ├── goal.repository.js
            │   └── review.repository.js
            │
            └── validators/
                └── pms.validator.js
```

Adapt file extensions/naming to the actual EduSuite backend conventions.

---

# 37. KHUSHBOO — DATABASE DELIVERY

Database work must begin from the CTO-defined tables:

```text
client_appraisal_cycles
client_appraisal_goals
client_appraisal_reviews
```

Recommended contribution package:

```text
khushboo-database/
│
├── migrations/
│   └── 001_create_hr_pms.sql
│
├── seeds/
│   └── 001_hr_pms_demo.sql
│
├── verification/
│   └── verify_hr_pms.sql
│
├── .env.example
└── README.md
```

Exact migration placement may later be changed to the host repository
convention.

---

# 38. DATABASE RULES

The database implementation must:

- preserve tenant ownership;
- preserve cycle relationships;
- preserve goal relationships;
- use one review table;
- constrain review type appropriately;
- avoid duplicate parallel employee tables;
- avoid storing frontend presentation-only state;
- use indexes appropriate to expected tenant/cycle/user queries.

---

# 39. DATABASE FIELD CONTRACT

The source documents lock the table names and `review_type` values but
do NOT provide a complete physical column-by-column HR-PMS schema.

Therefore Khushboo must not claim an invented field list as
CTO-defined.

A physical schema may be designed for implementation, but it must be
documented as the MODULE CONTRACT and checked against existing EduSuite
user/HR identifiers before final migration.

This is especially important for:

```text
organization reference
employee/user reference
reviewer reference
cycle reference
rating representation
goal fields
cycle status
review status
```

---

# 40. RATING RULE

The PRD requires:

```text
Rating Summary
```

but the retrieved authoritative HR-PMS specification does not define a
rating formula or rating scale.

Therefore:

DO NOT invent a weighted appraisal algorithm and describe it as an
approved business rule.

The implementation may store/display an agreed development rating
representation if needed for the contract, but any final calculation
rule requires approved specification.

---

# 41. WHAT IS OUTSIDE THE CURRENT CONTRACT

Unless separately approved, this contract does NOT automatically add:

```text
360-degree feedback
peer reviews
AI performance scoring
salary increment calculation
payroll linkage
promotion automation
employee termination
attendance scoring
biometric scoring
PDF appraisal generation
email/SMS notification workflows
advanced analytics
```

These are not part of FR-PMS-001 through FR-PMS-005 in the current
Platform PRD.

---

# 42. DEVELOPMENT ORDER

## Phase A — Contract

Before implementation:

```text
1. Freeze frontend/backend data shapes.
2. Freeze development API paths.
3. Freeze DB physical schema.
4. Confirm user/employee identifiers.
5. Confirm tenant identifier.
6. Confirm review_type behavior.
7. Confirm permission behavior.
```

---

## Phase B — Parallel Development

```text
Jatin
  → frontend with mock service

Neha
  → backend against agreed contract

Khushboo
  → database against agreed contract
```

All three must follow the same contract.

---

## Phase C — Integration

```text
Database
   ↓
Backend
   ↓
API Verification
   ↓
Frontend service replaces mocks
   ↓
Frontend ↔ Backend testing
```

---

# 43. INTEGRATION RESPONSIBILITY

Khushboo coordinates integration.

Integration includes:

```text
Database ↔ Backend
Backend ↔ API Contract
API Contract ↔ Frontend
Permissions ↔ UI behavior
Tenant isolation ↔ Repository behavior
```

Integration is not simply copying all folders together.

---

# 44. FRONTEND ACCEPTANCE CHECKS

Jatin's contribution is acceptable for integration when:

- all five required PMS experiences are represented;
- TypeScript validation succeeds;
- production build succeeds in its test host;
- routes/screens render;
- forms validate input;
- loading states exist;
- error states exist;
- empty states exist where applicable;
- self-review and reviewer UI are visibly distinct;
- responsive behavior is usable;
- data access goes through the service boundary;
- no database credentials exist in frontend code.

---

# 45. BACKEND ACCEPTANCE CHECKS

Neha's contribution is acceptable for integration when:

- server starts successfully;
- cycle operations work according to contract;
- goal operations work according to contract;
- self-review operations work;
- reviewer operations work;
- review types are validated;
- unauthorized access is rejected;
- tenant isolation is applied;
- invalid identifiers are handled;
- not-found resources are handled;
- repository queries are organization scoped;
- database errors are handled safely;
- API responses follow the agreed contract.

---

# 46. DATABASE ACCEPTANCE CHECKS

Khushboo's database contribution is acceptable when:

- migration executes successfully;
- all three canonical tables exist;
- review_type accepts the agreed values;
- required relationships are valid;
- tenant ownership is represented;
- indexes exist where required;
- demo data executes where provided;
- verification SQL succeeds;
- no production credentials are committed.

---

# 47. INTEGRATED ACCEPTANCE CHECKS

The module is not considered complete merely because all three people
have written code.

Integrated validation must verify:

```text
Create/manage review cycle
        ↓
Create/manage goal
        ↓
Employee self-review
        ↓
Manager reviewer action
        ↓
Rating summary
```

with applicable permission and tenant checks.

---

# 48. DEFINITION OF DONE

HR-PMS is Done only when:

- required functionality exists;
- the approved contract is satisfied;
- frontend/backend integration succeeds;
- required user states exist;
- tenant isolation is verified;
- permissions are verified;
- applicable audit requirements are satisfied;
- validation exists;
- error handling exists;
- responsive behavior is confirmed;
- applicable tests pass;
- staging flow succeeds;
- technical review is complete;
- no critical defect remains;
- required approval is obtained.

Frontend completion alone is NOT module completion.

Backend completion alone is NOT module completion.

Database creation alone is NOT module completion.

---

# 49. GIT SUBMISSION RULE

Each contributor should initially keep their responsibility isolated.

Example:

```text
HR-PMS-Assembly/
│
├── incoming/
│   ├── jatin-frontend/
│   ├── neha-backend/
│   └── khushboo-database/
│
├── contracts/
│   └── HR-PMS-MODULE-CONTRACT.md
│
└── README.md
```

This makes individual contributions inspectable before integration.

---

# 50. FILES THAT MUST NOT BE COMMITTED

Do not commit:

```text
node_modules/
.next/
.env
.env.local
*.tsbuildinfo
logs/
```

Never commit real:

```text
DB passwords
JWT secrets
API secrets
production credentials
```

Safe `.env.example` files may be committed using placeholder values.

---

# 51. TEAM COMMUNICATION RULE

If any contributor discovers that the contract is insufficient:

DO NOT silently invent a conflicting architecture.

Raise the missing contract item before implementing it.

Examples:

```text
Unknown employee table name
Unknown host authentication shape
Unknown rating scale
Unknown cycle lifecycle
Unknown audit requirement
Unknown API response wrapper
```

These should be resolved centrally so frontend, backend and database do
not develop incompatible assumptions.

---

# 52. TRACEABILITY

Implementation must remain traceable to:

```text
FR-PMS-001 → Goal Setting
FR-PMS-002 → Review-Cycle Management
FR-PMS-003 → Self Review
FR-PMS-004 → Reviewer Form
FR-PMS-005 → Rating Summary
```

The acceptance basis for HR-PMS is the:

```text
Appraisal Lifecycle
```

---

# 53. FINAL OWNERSHIP MATRIX

| Area | Owner |
|---|---|
| Complete Frontend | Jatin |
| Frontend Components | Jatin |
| Frontend Routes | Jatin |
| Frontend Services/Mocks | Jatin |
| Complete Backend | Neha |
| API Implementation | Neha |
| Backend Permissions | Neha |
| Backend Tenant Enforcement | Neha |
| Database | Khushboo |
| SQL Migration | Khushboo |
| DB Verification | Khushboo |
| Contract Coordination | Khushboo |
| Integration | Khushboo |
| Integration Testing | Khushboo |
| Git Assembly | Khushboo |
| Final Technical Verification | Khushboo |

---

# 54. NON-NEGOTIABLE RULES

1. Build HR-PMS from zero.
2. Follow FR-PMS-001 through FR-PMS-005.
3. Use `module_key = hr_pms`.
4. Use the three canonical PMS tables.
5. Use one review table.
6. `review_type` is `self` or `reviewer`.
7. Enforce self/reviewer visibility server-side.
8. Respect `hr.pms.view`.
9. Respect `hr.pms.review`.
10. Respect `hr.pms.manage`.
11. Maintain tenant isolation.
12. Frontend never accesses MariaDB directly.
13. Do not invent an undocumented rating algorithm.
14. Do not introduce unrelated HR functionality.
15. Keep contributions modular and integration-ready.

---

# 55. FINAL MODULE TARGET

The completed flow should ultimately behave as:

```text
HR / Authorized Administrator
          ↓
Create / Manage Review Cycle
          ↓
      Goal Setting
          ↓
Employee Self Review
          ↓
Manager Reviewer Form
          ↓
     Rating Summary
          ↓
Completed Appraisal Lifecycle
```

subject to the final approved lifecycle/state details.

---

# 56. MODULE STATUS AT ASSIGNMENT

```text
Module:          PMS & Appraisal
Module ID:       HR-PMS
Module Key:      hr_pms
Lane:            People & HR
Priority:        P4
Implementation:  FROM ZERO

Frontend:        Assigned — Jatin
Backend:         Assigned — Neha
Database:        Assigned — Khushboo
Integration:     Assigned — Khushboo

Current State:   CONTRACT / DEVELOPMENT START
```

---

# END OF CONTRACT

This contract is the shared engineering boundary for the HR-PMS
implementation.

All three contributors must develop against the same domain and
integration expectations.

Where the approved PRD/CTO specification does not define a business
rule, the team must not present an invented rule as an authoritative
EduSuite requirement.