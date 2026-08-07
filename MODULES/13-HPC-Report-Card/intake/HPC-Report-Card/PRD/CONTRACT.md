# WISWITS EDUSUITE
# HPC REPORT CARD — MODULE ENGINEERING CONTRACT

**Module Name:** HPC Report Card — NEP 2020  
**Module ID:** ACA-HPC  
**Module Key:** academics_hpc  
**Functional Lane:** Lane C — Academics  
**Priority:** P4  
**Document Type:** Module Engineering Contract  
**Implementation Model:** Fresh Implementation From Scratch  
**Product:** WisWits EduSuite SaaS Platform  
**Prepared For:** EduSuite Module Engineering Team  
**Team Lead:** Khushboo  
**Status:** Development Contract  

---

# 1. PURPOSE OF THIS DOCUMENT

This document is the implementation contract for the EduSuite HPC Report Card module.

It defines the common engineering agreement that must be followed by:

- Frontend Developer 1 — Sunidhi
- Frontend Developer 2 — Ankit
- Backend Developer 1 — Neha
- Backend Developer 2 — Jatin
- Team Lead / Database / Architecture — Khushboo

The purpose of this contract is to ensure that frontend, backend and database development can proceed in parallel without each developer inventing a different interpretation of the module.

The module shall be developed as a fresh implementation from scratch.

Existing HPC implementation, if any, is NOT the implementation baseline.

Existing platform documents such as:

- Platform PRD
- CTO Technical Specification
- Engineering Execution Plan
- Master Engineering Blueprint
- approved platform standards

may be used to understand:

- product requirements;
- architecture;
- technology standards;
- security expectations;
- API conventions;
- database conventions;
- integration boundaries;
- UI standards.

The actual HPC business implementation produced by this team shall be new.

---

# 2. SOURCE REQUIREMENTS

The approved Product Requirements Document defines the following requirements for ACA-HPC:

- FR-HPC-001 — Competency / descriptor entry grid
- FR-HPC-002 — Domain summary
- FR-HPC-003 — Holistic card preview
- FR-HPC-004 — PDF generation

The approved acceptance direction is:

ENTRY
   ↓
SUMMARY
   ↓
HOLISTIC CARD
   ↓
PDF

The CTO specification additionally defines:

- client_hpc_competencies
- client_hpc_entries
- client_hpc_cards

A finalized HPC card represents an immutable snapshot for a student for a particular academic cycle.

Approved permission concepts:

- academics.hpc.view
- academics.hpc.edit
- academics.hpc.publish

Approved module registration key:

academics_hpc

Publishing/finalization is an auditable operation.

The parent EduSuite platform provides the architectural boundary for final PDF generation.

---

# 3. WHAT IS AN HPC REPORT CARD?

HPC in this module refers to the Holistic Progress Card / HPC Report Card concept identified by the product requirements as:

"HPC Report Card — NEP 2020."

Within EduSuite, the HPC module is not intended to behave as only a conventional marks table.

Its product purpose is to allow approved academic users to record competency/descriptor information for a student, organize that information into domain-level summaries, review the resulting holistic card and ultimately produce the approved report-card output.

For this implementation, the module therefore revolves around four core product capabilities:

1. Competency / Descriptor Entry
2. Domain Summary
3. Holistic Card Preview
4. Final Report / PDF Flow

IMPORTANT:

The source documents do not define a complete national NEP competency taxonomy, rating scale, subject taxonomy or scoring formula.

Developers must therefore NOT invent a hardcoded "official NEP 2020 scoring system."

Competencies, descriptors, domains and applicable rating/entry options must be treated as configurable module data according to the approved contract/database design.

---

# 4. BUSINESS OBJECTIVE

The module shall provide a structured academic workflow in which an authorized academic user can:

1. identify/select the applicable student;
2. identify the academic cycle/context;
3. view applicable competencies and descriptors;
4. record/update HPC entries;
5. review completion;
6. view domain-level summaries;
7. preview the holistic card;
8. publish/finalize the card when authorized;
9. access the resulting report/PDF flow.

The experience must remain understandable and usable for academic staff rather than exposing raw database structures.

---

# 5. MODULE BOUNDARY

The HPC module owns:

- HPC competency configuration representation;
- HPC student entries;
- HPC domain grouping;
- HPC completion state;
- domain summary representation;
- holistic card representation;
- draft/finalized card lifecycle;
- HPC card snapshot data;
- HPC-specific API contracts;
- HPC-specific validation;
- HPC report preview data.

The standalone implementation does NOT own the final parent-platform:

- authentication architecture;
- authorization engine;
- tenant-resolution middleware;
- global navigation;
- shared notification system;
- global audit engine;
- parent report-card PDF infrastructure;
- global student information system.

Those integration concerns remain platform responsibilities.

---

# 6. FRESH IMPLEMENTATION RULE

All business implementation shall be created from scratch.

This means:

DO:

- create new frontend components;
- create new HPC business logic;
- create new backend controllers/services/repositories;
- create new database migrations;
- create new mock data;
- create new API implementation;
- create new validation logic.

DO NOT:

- copy an old HPC module;
- copy an old HPC database;
- depend on undocumented HPC implementation;
- create a separate incompatible architecture;
- create a separate authentication system;
- invent another platform technology stack.

"From scratch" means fresh business implementation.

It does NOT mean ignoring the approved EduSuite engineering architecture.

---

# 7. CURRENT APPROVED TECHNOLOGY STACK

All developers must use the current team-approved stack.

## 7.1 Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Next.js App Router
- Lucide React
- native Fetch API / approved API service layer

DO NOT USE:

- Vite
- React Router
- react-router-dom
- Tailwind CSS 3.x
- independent SPA entry architecture
- native alert()
- native confirm()
- native prompt()

Frontend must remain compatible with the current EduSuite Next.js architecture.

---

## 7.2 Backend

- Node.js
- Express.js
- JavaScript ES Modules
- REST APIs
- Controller → Service → Repository layering
- environment-based configuration
- parameterized SQL

Backend modules must use:

import / export

rather than introducing a conflicting module system.

---

## 7.3 Database

- MariaDB
- relational schema
- SQL migrations
- foreign keys where appropriate
- indexes
- tenant-aware org_id structure
- parameterized backend queries

Migration files must use:

NNN_description.sql

Example:

001_create_hpc_competencies.sql
002_create_hpc_entries.sql
003_create_hpc_cards.sql
004_hpc_indexes.sql

Migration files MUST NOT contain:

USE database_name;

---

# 8. HIGH-LEVEL SYSTEM FLOW

Student
   ↓
Academic Context / Cycle
   ↓
HPC Competency Structure
   ↓
Competency / Descriptor Entry
   ↓
Draft Saved
   ↓
Completion / Validation
   ↓
Domain Summary
   ↓
Holistic Card Preview
   ↓
Publish / Finalize
   ↓
Immutable Card Snapshot
   ↓
PDF / Report Integration

---

# 9. HPC LIFECYCLE

The module shall use a controlled lifecycle.

Recommended application states:

DRAFT
   ↓
IN_PROGRESS
   ↓
READY_FOR_REVIEW
   ↓
FINALIZED

DRAFT / IN_PROGRESS data may be edited by authorized users.

FINALIZED data must not be silently changed.

Finalization creates the card snapshot represented by client_hpc_cards.

If correction/reopening behavior is later required, it must be defined through an approved CTO/product decision rather than allowing developers to mutate finalized cards arbitrarily.

---

# 10. CORE DOMAIN MODEL

The module contains three CTO-defined primary concepts.

## 10.1 HPC Competency

Represents the structure against which students are evaluated.

Conceptually contains:

- competency identifier;
- organization;
- academic applicability;
- domain;
- competency title;
- descriptor;
- display order;
- active state;
- timestamps.

---

## 10.2 HPC Entry

Represents an assessment/observation entered for a student against a competency or descriptor for an academic cycle.

Conceptually contains:

- student;
- academic cycle;
- competency;
- descriptor;
- selected rating/value where applicable;
- qualitative remark where applicable;
- author/evaluator reference;
- timestamps.

---

## 10.3 HPC Card

Represents the finalized holistic progress card snapshot.

Conceptually contains:

- student;
- academic cycle;
- final domain summaries;
- final competency data;
- final card payload/snapshot;
- finalized status;
- finalized timestamp;
- finalized-by reference.

Once finalized, the snapshot must be treated as immutable.

---

# 11. DOMAIN AND DESCRIPTOR MODEL

The frontend must NOT hardcode a permanent list of domains or descriptors into UI components.

The UI should receive the applicable structure through mock/API data.

Conceptual hierarchy:

HPC
 ├── Domain A
 │    ├── Competency 1
 │    │    ├── Descriptor
 │    │    └── Entry
 │    └── Competency 2
 │
 ├── Domain B
 │    └── ...
 │
 └── Domain N

This enables future academic configuration without rebuilding frontend components.

---

# 12. FRONTEND PRODUCT EXPERIENCE

The frontend shall provide a coherent academic workflow rather than disconnected demo screens.

Required experiences:

1. HPC Dashboard / Landing Page
2. Student Selection / HPC List
3. HPC Entry Workspace
4. Domain Summary
5. Holistic Card Preview
6. Finalization / Publish Action
7. PDF / Report Action
8. Loading States
9. Empty States
10. Error States
11. Responsive Behavior

---

# 13. HPC DASHBOARD

The landing experience should provide useful module context.

Suggested dashboard information:

- total applicable students;
- draft cards;
- in-progress cards;
- ready-for-review cards;
- finalized cards;
- recent HPC activity.

Dashboard must provide an obvious route into the student/card workflow.

Do not create decorative statistics that cannot eventually be backed by API data.

During frontend-only development, approved mock values may be used.

---

# 14. STUDENT / HPC LIST

Provide a searchable list of students/cards.

Possible columns:

- Student
- Admission / Student ID
- Class
- Section
- Academic Cycle
- HPC Status
- Completion
- Last Updated
- Action

Required interactions:

- search;
- status filter;
- class filter where applicable;
- academic-cycle filter;
- open HPC;
- open finalized card.

Mock data shall follow the same shape expected from the backend contract.

---

# 15. HPC ENTRY WORKSPACE

This is the primary working screen.

The screen should clearly identify:

- student;
- class/section where available;
- academic cycle;
- current HPC status;
- completion/progress;
- evaluator context where applicable.

The main area displays competencies/descriptors grouped by domain.

Example conceptual UI:

Domain
  |
  +-- Competency
       |
       +-- Descriptor
       +-- Entry control
       +-- Optional remark

The interface should support efficient entry without requiring the teacher to repeatedly navigate between pages.

Required behaviors:

- display applicable domains;
- display competencies;
- display descriptors;
- accept allowed entry values;
- accept remarks where contract permits;
- save draft;
- indicate saved/unsaved state;
- show validation errors;
- show completion state.

---

# 16. DOMAIN SUMMARY

FR-HPC-002 requires a domain summary.

The summary shall aggregate/display the student's HPC information by domain.

The source documents do NOT define a mandatory mathematical scoring algorithm.

Therefore:

DO NOT invent weighted scoring or percentage calculations unless separately approved.

The summary may represent:

- domain;
- competency completion;
- recorded descriptors;
- qualitative/approved rating representation;
- domain remarks where applicable.

Any computed scoring methodology must remain configurable/contract-driven rather than silently invented by an intern.

---

# 17. HOLISTIC CARD PREVIEW

FR-HPC-003 requires a holistic card preview.

The preview is the human-readable representation of the student's HPC before/after finalization.

It should present:

- student identity;
- academic context;
- domain sections;
- competency/descriptor information;
- relevant remarks;
- card status;
- finalization information where applicable.

The preview should visually resemble a professional school report document while remaining responsive in the application.

The preview must use real structured data rather than a static screenshot.

---

# 18. PDF FLOW

FR-HPC-004 requires PDF generation.

CTO direction states that the parent platform's existing report-card PDF service is the intended integration boundary.

Therefore the fresh HPC module must prepare a complete structured card payload that can be supplied to the platform PDF service.

During standalone/mock development:

- frontend may provide a PDF action/button;
- backend may expose the agreed report endpoint/contract;
- a mock or development implementation may be used where required for testing.

DO NOT build a competing platform-wide PDF architecture.

Final parent-platform PDF integration remains an EduSuite integration responsibility.

---

# 19. PUBLISH / FINALIZATION RULE

Publishing is a controlled action.

Approved permission concept:

academics.hpc.publish

Publishing should:

1. validate required HPC data;
2. confirm the card is eligible for finalization;
3. construct the final snapshot;
4. persist the immutable card snapshot;
5. mark appropriate status;
6. record finalization metadata;
7. produce/prepare report output;
8. generate the appropriate audit event during platform integration.

The frontend should use a professional confirmation dialog before finalization.

Never use:

window.confirm()

---

# 20. USER ROLES / PERMISSION CONCEPTS

CTO-defined permissions:

academics.hpc.view

Used to access applicable HPC information.

academics.hpc.edit

Used by approved academic users such as teachers to edit permitted HPC entries.

academics.hpc.publish

Used by approved coordinator/principal-level users to finalize/publish a card.

IMPORTANT:

The standalone module must NOT implement its own JWT or hardcoded platform authorization engine.

The final EduSuite platform will enforce permissions through shared infrastructure.

During independent development, mock role/permission states may be used only to demonstrate UI behavior.

---

# 21. TENANT ISOLATION

Every organization-owned HPC record must support tenant isolation.

Database/API operations involving tenant-owned information must include:

org_id

Conceptually:

Organization A
    |
    +-- Students A
    +-- Competencies A
    +-- HPC Entries A
    +-- HPC Cards A

Organization B
    |
    +-- Students B
    +-- Competencies B
    +-- HPC Entries B
    +-- HPC Cards B

Data from Organization A must never become accessible through Organization B queries.

During final SaaS integration, org_id must come from trusted authenticated platform context rather than arbitrary client input.

---

# 22. DATABASE REFERENCE DESIGN

The following is the team's fresh implementation design based on the CTO-required data concepts.

## Table 1 — client_hpc_competencies

Purpose:

Store configurable HPC competency/descriptor definitions.

Suggested fields:

id
org_id
domain_code
domain_name
competency_code
competency_name
descriptor_text
display_order
is_active
created_at
updated_at

Required considerations:

- primary key;
- org_id index;
- domain index;
- active-state index where useful;
- organization-safe uniqueness rules.

---

## Table 2 — client_hpc_entries

Purpose:

Store student HPC entries before finalization.

Suggested fields:

id
org_id
student_id
academic_cycle_id
competency_id
entry_value
remarks
evaluator_id
created_at
updated_at

Required relationships:

competency_id
    → client_hpc_competencies.id

student_id and academic_cycle_id represent integration references to parent-platform academic data.

Required indexes should support:

org_id
student_id
academic_cycle_id
competency_id

Duplicate entry behavior for the same student/cycle/competency must be controlled.

---

## Table 3 — client_hpc_cards

Purpose:

Store finalized HPC card snapshots.

Suggested fields:

id
org_id
student_id
academic_cycle_id
status
snapshot_json
finalized_by
finalized_at
created_at

The final snapshot must contain sufficient information to reproduce the published card without depending on later edits to competency definitions.

A finalized snapshot must not be silently updated.

---

# 23. DATABASE RULES

All tables must:

- use appropriate primary keys;
- use org_id where tenant scoped;
- use appropriate foreign keys;
- use appropriate indexes;
- include timestamps where required;
- use consistent naming;
- avoid unnecessary duplicate data except deliberate immutable snapshot data.

SQL must not contain hardcoded local credentials.

SQL migrations must not contain:

USE <database>;

---

# 24. BACKEND ARCHITECTURE

Required architecture:

Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MariaDB

Responsibilities:

Routes:
- endpoint declaration;
- platform middleware integration points.

Controllers:
- request parsing;
- response handling;
- service invocation.

Services:
- HPC business rules;
- validation orchestration;
- lifecycle logic;
- summary construction;
- finalization logic.

Repositories:
- parameterized SQL;
- tenant-scoped database access;
- persistence.

Do not put the complete business implementation directly inside route files.

---

# 25. PROPOSED API CONTRACT

Base conceptual route:

/api/v1/hpc

## GET /api/v1/hpc/students

Purpose:
Return students/cards applicable to the HPC workflow.

Supports conceptual query parameters:

search
class_id
status
academic_cycle_id
page
limit

---

## GET /api/v1/hpc/students/:studentId

Purpose:
Return student HPC workspace information.

Expected data areas:

student
academicContext
cardStatus
completion
domains
entries

---

## GET /api/v1/hpc/competencies

Purpose:
Return applicable competency/descriptor structure.

Possible filters:

academic_cycle_id
class_id

---

## GET /api/v1/hpc/students/:studentId/entries

Purpose:
Return the student's current HPC entries for the selected cycle.

---

## PUT /api/v1/hpc/students/:studentId/entries

Purpose:
Create/update permitted HPC draft entries.

Conceptual request:

{
  "academicCycleId": 1,
  "entries": [
    {
      "competencyId": 101,
      "value": "VALUE_FROM_APPROVED_SCALE",
      "remarks": "Optional qualitative remark"
    }
  ]
}

IMPORTANT:

The literal rating values must come from approved configuration/contract data.

Do not hardcode an invented national scale.

---

## GET /api/v1/hpc/students/:studentId/summary

Purpose:
Return the domain summary.

---

## GET /api/v1/hpc/students/:studentId/preview

Purpose:
Return the complete structured holistic-card preview.

---

## POST /api/v1/hpc/students/:studentId/finalize

Purpose:
Finalize/publish the HPC card.

Conceptual request:

{
  "academicCycleId": 1
}

The service must validate the card before creating the immutable snapshot.

---

## GET /api/v1/hpc/cards/:cardId

Purpose:
Return a finalized HPC card snapshot.

---

## GET /api/v1/hpc/cards/:cardId/pdf

Purpose:
Represent the integration endpoint/action for report-card PDF output.

Final PDF implementation must align with the parent EduSuite report-card PDF service.

---

# 26. STANDARD API RESPONSE FORMAT

Successful response:

{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}

List response:

{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}

Error response:

{
  "success": false,
  "error": {
    "code": "HPC_ERROR_CODE",
    "message": "Human-readable error"
  }
}

Frontend and backend developers must use the same agreed response structure.

---

# 27. VALIDATION REQUIREMENTS

Backend validation must cover applicable cases including:

- valid student reference;
- valid academic cycle;
- valid competency;
- competency belongs to applicable organization/context;
- permitted entry value;
- valid remarks length;
- duplicate-entry prevention;
- finalization eligibility;
- finalized-card immutability.

Frontend validation improves usability.

Backend validation remains authoritative.

---

# 28. ERROR HANDLING

The application must not silently display success when an operation fails.

Examples:

Save failure
→ display error state/toast.

Invalid entry
→ display validation feedback.

Student not found
→ proper not-found state.

No competencies configured
→ useful empty/configuration state.

Finalization failure
→ keep current card state and explain failure.

PDF unavailable
→ display report-generation failure state.

---

# 29. REQUIRED FRONTEND STATES

Every major page must consider:

Loading
Loaded
Empty
Error

Entry forms additionally require:

Idle
Editing
Saving
Saved
Validation Error

Finalization requires:

Eligible
Not Eligible
Confirming
Publishing
Published
Failed

---

# 30. RESPONSIVE REQUIREMENTS

Applicable pages must support:

- desktop;
- tablet;
- phone.

Large competency grids must not simply overflow off-screen.

Responsive strategies may include:

- stacked competency cards;
- controlled horizontal scrolling where appropriate;
- responsive tables;
- collapsible domain sections;
- mobile action bars.

---

# 31. UI / DESIGN STANDARD

Follow the current EduSuite design direction.

Core visual tokens:

Navy:
#0F2147

Gold:
#C8A04E

Ivory:
#F7F4EC

Typography direction:

- Playfair Display
- Source Sans

Use:

- consistent spacing;
- professional cards;
- accessible forms;
- visible focus states;
- clear hierarchy;
- restrained shadows;
- smooth interaction states;
- professional loading/skeleton states;
- platform-style toast feedback;
- reusable dialog components.

Do not introduce an unrelated design system.

---

# 32. FRONTEND FOLDER STRUCTURE

Recommended fresh structure:

frontend/
│
├── app/
│   ├── hpc/
│   │   ├── page.tsx
│   │   ├── students/
│   │   │   └── [studentId]/
│   │   │       └── page.tsx
│   │   └── cards/
│   │       └── [cardId]/
│   │           └── page.tsx
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── src/
│   ├── modules/
│   │   └── hpc/
│   │       ├── components/
│   │       ├── services/
│   │       ├── types/
│   │       ├── mocks/
│   │       └── utils/
│   │
│   └── components/
│       └── ui/
│
├── public/
├── package.json
├── tsconfig.json
├── next.config.*
└── .env.example

Exact file decomposition may be improved by the developer, but business boundaries must remain clear.

---

# 33. BACKEND FOLDER STRUCTURE

backend/
│
├── src/
│   ├── config/
│   │
│   └── modules/
│       └── hpc/
│           ├── routes/
│           │   └── hpc.routes.js
│           ├── controllers/
│           │   └── hpc.controller.js
│           ├── services/
│           │   └── hpc.service.js
│           ├── repositories/
│           │   └── hpc.repository.js
│           ├── validators/
│           │   └── hpc.validator.js
│           └── utils/
│
├── server.js
├── package.json
├── .env.example
└── .gitignore

---

# 34. DATABASE FOLDER STRUCTURE

database/
│
├── migrations/
│   ├── 001_create_hpc_competencies.sql
│   ├── 002_create_hpc_entries.sql
│   ├── 003_create_hpc_cards.sql
│   └── 004_add_hpc_indexes.sql
│
├── seeds/
│   └── hpc_development_seed.sql
│
└── README.md

Seed data is for development/testing only.

Do not treat development seed competency definitions as permanent national policy.

---

# 35. TEAM ASSIGNMENTS

## 35.1 SUNIDHI — FRONTEND DEVELOPER 1

Primary ownership:

HPC working/entry experience.

Implement:

- HPC dashboard/landing page;
- student/HPC list;
- search/filter UI;
- student selection;
- HPC entry workspace;
- domain navigation;
- competency display;
- descriptor display;
- entry controls;
- remarks UI;
- completion/progress display;
- save-draft interactions;
- loading states;
- empty states;
- error states;
- responsive behavior for owned screens.

Use mock data that follows this contract.

Do NOT wait for backend completion.

Do NOT invent a different API/data model.

---

# 35.2 ANKIT — FRONTEND DEVELOPER 2

Primary ownership:

Summary/report experience.

Implement:

- domain summary;
- holistic card preview;
- card status presentation;
- finalization confirmation UI;
- publish/finalize interaction;
- finalized-card view;
- PDF/report action;
- loading states;
- error states;
- responsive report preview;
- reusable HPC display components.

Use the exact same contract/types as Frontend Developer 1.

Do not create a separate frontend application architecture.

---

# 35.3 NEHA — BACKEND DEVELOPER 1

Primary ownership:

HPC competency and entry workflow.

Implement:

- HPC module routes for owned endpoints;
- competency retrieval;
- student HPC retrieval;
- draft entry retrieval;
- draft entry creation/update;
- validation;
- controller/service/repository layering;
- parameterized SQL;
- tenant-scoped repository operations;
- standardized responses;
- appropriate backend error handling.

Do NOT:

- implement custom JWT;
- parse Bearer tokens as a module authentication system;
- create hardcoded permission constants;
- create a competing platform authentication layer.

---

# 35.4 JATIN — BACKEND DEVELOPER 2

Primary ownership:

Summary/card/finalization workflow.

Implement:

- domain-summary service;
- holistic-preview service;
- card retrieval;
- finalization endpoint;
- final snapshot construction;
- finalized-card immutability protection;
- PDF integration-facing endpoint/contract;
- validation;
- standardized responses;
- tenant-scoped repository operations.

Finalization must not silently overwrite a previously finalized card.

Do not build a separate platform PDF architecture.

---

# 35.5 KHUSHBOO — TEAM LEAD / DATABASE / ARCHITECTURE

Primary ownership:

- module contract;
- technical coordination;
- database design;
- migration design;
- schema relationships;
- indexes;
- org_id strategy;
- shared mock/API contract;
- frontend/backend contract alignment;
- code review;
- security review;
- final integration coordination where required;
- Git/repository preparation;
- handoff to CTO/Founder.

Database responsibility includes:

client_hpc_competencies
client_hpc_entries
client_hpc_cards

Team Lead also verifies that independent submissions remain compatible with this contract.

---

# 36. SHARED MOCK CONTRACT

Frontend development shall use contract-compatible mocks.

Example:

{
  "student": {
    "id": 1001,
    "name": "Demo Student",
    "studentCode": "STU-1001",
    "className": "Class 6",
    "sectionName": "A"
  },
  "academicCycle": {
    "id": 1,
    "name": "2026-27"
  },
  "status": "IN_PROGRESS",
  "completion": {
    "completed": 8,
    "total": 12
  },
  "domains": [
    {
      "id": 1,
      "name": "Demo Domain",
      "competencies": [
        {
          "id": 101,
          "name": "Demo Competency",
          "descriptor": "Configurable competency descriptor",
          "allowedValues": [
            "LEVEL_1",
            "LEVEL_2",
            "LEVEL_3"
          ],
          "entry": {
            "value": "LEVEL_2",
            "remarks": "Development mock remark"
          }
        }
      ]
    }
  ]
}

IMPORTANT:

"Demo Domain", "LEVEL_1", etc. are development placeholders.

They are NOT being declared by this contract as official NEP categories.

---

# 37. SECURITY RULES

Module developers must NOT create:

- local JWT authentication;
- jwt.verify();
- jwt.sign();
- custom Bearer-token parsing;
- hardcoded production passwords;
- database credentials in source files;
- hardcoded admin bypasses.

Final platform authentication is provided through shared EduSuite infrastructure.

All SQL values must use parameterized queries.

Never build queries by directly interpolating untrusted request data.

---

# 38. AUDIT REQUIREMENTS

Publishing/finalization is an auditable business action.

The final platform integration must support an event concept such as:

hpc.card.finalized

with appropriate:

- organization;
- actor;
- student/card reference;
- timestamp;
- relevant metadata.

Do not build an independent platform-wide audit system inside this standalone module.

Prepare the module so shared platform auditing can be attached cleanly.

---

# 39. TESTING EXPECTATIONS

Frontend must verify:

- page rendering;
- loading states;
- empty states;
- error states;
- student selection;
- search/filter behavior;
- entry editing;
- validation;
- domain summary;
- preview;
- confirmation dialog;
- responsive layout;
- TypeScript validation.

Required frontend command:

npx tsc --noEmit

Production verification:

npm run build

---

Backend must verify:

- server startup;
- route availability;
- validation;
- parameterized queries;
- tenant filtering;
- entry CRUD behavior;
- summary behavior;
- preview behavior;
- finalization behavior;
- immutable finalized card behavior;
- invalid-resource handling;
- database failure handling.

---

Database must verify:

- migrations execute;
- tables exist;
- relationships work;
- indexes exist;
- duplicate constraints behave correctly;
- tenant data remains separable;
- finalized snapshot persists;
- backend can connect successfully.

---

# 40. ACCEPTANCE CRITERIA

ACA-HPC is implementation-ready when:

1. Applicable students/cards can be viewed.

2. Applicable competencies/descriptors can be loaded.

3. An authorized editing context can enter/update draft HPC information.

4. Entries persist through the backend/database implementation.

5. HPC information is grouped into domain summaries.

6. A holistic card preview can be generated from structured data.

7. Finalization validates the card before publishing.

8. Finalization creates an immutable card snapshot.

9. Finalized card data can be retrieved.

10. The module exposes the required PDF/report integration flow.

11. Loading, empty, error and validation states exist.

12. Responsive behavior is verified.

13. Tenant-owned data is org-scoped.

14. SQL is parameterized.

15. No independent JWT/authentication architecture exists.

16. Frontend and backend follow the same contract.

17. No hardcoded production credentials exist.

18. TypeScript validation succeeds.

19. Frontend production build succeeds.

20. Backend starts and required API tests succeed.

"UI completed" alone does NOT mean the module is complete.

---

# 41. DEVELOPMENT PROCESS

The required engineering sequence is:

MODULE CONTRACT
      ↓
SHARED MOCK / API CONTRACT
      ↓
PARALLEL DEVELOPMENT

Sunidhi ───── Frontend A
Ankit ─────── Frontend B

Neha ──────── Backend A
Jatin ─────── Backend B

Khushboo ──── Database / Architecture

      ↓
SUBMISSION
      ↓
REVIEW
      ↓
INTEGRATION / EXPERIMENT AS DIRECTED
      ↓
TESTING
      ↓
GIT
      ↓
CTO / FOUNDER PLATFORM ALIGNMENT

---

# 42. GIT WORKFLOW

Each developer works only in their assigned branch/workspace according to the Team Lead's Git instructions.

Developers must not:

- push directly to main unless explicitly authorized;
- commit node_modules;
- commit .next;
- commit .env;
- commit .env.local;
- commit secrets;
- overwrite another developer's work.

Allowed configuration template:

.env.example

Before submission:

- remove generated artifacts;
- verify project structure;
- run required checks;
- confirm assigned functionality works;
- provide clean source files.

---

# 43. ENVIRONMENT RULES

Frontend example:

NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1

Backend environment should contain local database configuration through environment variables.

Actual passwords are never placed in the engineering contract or committed to Git.

---

# 44. IMPORTANT IMPLEMENTATION BOUNDARIES

The following decisions are LOCKED for this team build:

1. Build HPC business functionality from scratch.

2. Use Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

3. Do not use Vite.

4. Use Node.js + Express backend.

5. Use MariaDB.

6. Use controller/service/repository layering.

7. Use parameterized SQL.

8. Maintain org_id tenant scoping.

9. Do not build local platform authentication.

10. Do not invent a fixed NEP scoring formula that is absent from the approved requirements.

11. Competencies/descriptors must be data-driven.

12. Finalized HPC cards are immutable snapshots.

13. Publishing is permission-controlled and auditable at platform integration.

14. PDF behavior must remain compatible with the shared EduSuite report-card PDF architecture.

15. Frontend and backend must implement one shared contract.

---

# 45. OUT OF SCOPE FOR THIS MODULE BUILD

Unless separately approved, developers must not add:

- attendance management;
- timetable management;
- examination management;
- fee management;
- student admissions;
- parent portal;
- chat/messaging;
- AI-generated student evaluation;
- independent authentication;
- independent notification infrastructure;
- independent PDF platform;
- hardcoded statutory/national scoring rules not present in the approved requirements.

These belong to other product domains or require separate approval.

---

# 46. DEFINITION OF DONE

A developer's assigned portion is considered ready for submission only when:

- assigned functionality exists;
- code runs;
- contract is followed;
- mock/API shapes match;
- required states exist;
- errors are handled;
- responsive behavior is considered;
- no secrets are committed;
- generated folders are removed;
- required validation command succeeds;
- source is understandable;
- assigned work can be reviewed independently.

The overall module becomes platform-ready only after the appropriate integration, tenant, permission, audit, functional and technical validation defined by EduSuite governance.

---

# 47. FINAL MODULE VISION

ACA-HPC should ultimately provide this experience:

Teacher / Academic User
        |
        v
Select Student
        |
        v
Open HPC Workspace
        |
        v
Review Domains
        |
        v
Enter Competencies / Descriptors
        |
        v
Save Progress
        |
        v
Review Domain Summary
        |
        v
Holistic Card Preview
        |
        v
Authorized Review
        |
        v
Finalize / Publish
        |
        v
Immutable HPC Card Snapshot
        |
        v
EduSuite Report Card / PDF

The module must feel like one part of EduSuite, not a separate application.

---

# 48. FINAL TEAM INSTRUCTION

Every developer must read this contract before implementation.

If a requirement is unclear:

DO NOT silently invent business behavior.

Raise the question to the Team Lead.

If implementation requires changing:

- API contracts;
- database relationships;
- tenant behavior;
- finalization behavior;
- permission behavior;
- scoring methodology;
- PDF architecture;

the change must first be discussed and approved.

One Module.
One Contract.
One Data Model.
One API Agreement.
One EduSuite Platform.

---

END OF HPC REPORT CARD MODULE ENGINEERING CONTRACT