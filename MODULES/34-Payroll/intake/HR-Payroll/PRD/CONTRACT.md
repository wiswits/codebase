# Intake — HR Payroll Management Module Engineering Contract

## Module Information

**Module Number:** Module 9  
**Module Name:** HR Payroll Management  
**Module ID:** HR-PAY  
**Lane:** People & HR  
**Priority:** P4 / Critical  
**Risk Classification:** CRITICAL — Financial  
**Development Type:** Fresh Development From Zero  
**Module Key:** `hr_payroll`

---

# 1. Module Purpose

The HR Payroll Management module provides a controlled digital workflow for managing employee salary structures, payroll runs, manual deductions, arrears, payslips, and payslip PDF generation.

The module will allow authorized users to:

- Create and manage employee salary structures
- Prepare payroll runs
- Review payroll information
- Add approved manual deductions
- Add approved arrears
- View employee payslips
- Generate/download payslip PDFs
- Search and filter payroll records
- Review payroll-run status
- Access payroll information according to permissions

This module is financial in nature and therefore requires stricter validation, authorization, auditability, and integration testing than a normal CRUD module.

---

# 2. Development Rule — Build From Zero

Module 9 will be developed completely FROM ZERO.

The team must create:

- Fresh frontend
- Fresh backend
- Fresh database schema
- Fresh API implementation
- Fresh validation
- Fresh module integration
- Fresh test data

Previous Payroll/HRMS code or previous intern implementations are NOT the development base for this module.

The approved PRD/technical documents are used only to determine:

- Functional requirements
- Security boundaries
- Financial restrictions
- Required table names
- Permission names
- Module registration
- Engineering rules

Implementation will be created fresh by our team.

---

# 3. Team Assignment & Tech Stack

| Team Member | Area | Primary Responsibility | Tech Stack |
|---|---|---|---|
| **Ankit** | Frontend | Payroll Dashboard + Salary Structure UI | Next.js + React + TypeScript + Tailwind CSS |
| **Sunidhi** | Frontend | Payroll Runs + Payslips + Deductions/Arrears UI | Next.js + React + TypeScript + Tailwind CSS |
| **Jatin** | Backend | Salary Structure + Payroll Records APIs | Node.js + Express.js + TypeScript + REST APIs |
| **Neha** | Backend | Payroll Run Workflow + Payslip + Deduction/Arrear APIs | Node.js + Express.js + TypeScript + REST APIs |
| **Khushboo** | Database + Integration | MariaDB schema + integration + final implementation coordination + testing | MariaDB + SQL + Node/Express Integration + Git/GitHub |

---

# 4. Common Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- REST API integration
- Responsive component architecture

## Backend

- Node.js
- Express.js
- TypeScript
- REST API architecture

Layered structure:

Route
↓
Controller
↓
Validator
↓
Service
↓
Repository
↓
MariaDB

## Database

- MariaDB
- SQL
- Foreign keys
- Indexed queries where appropriate
- Organization-scoped data
- Migration/schema scripts
- Seed/test data

## Development

- VS Code
- Git
- GitHub
- npm
- PowerShell / Terminal
- Feature branches

---

# 5. Tech Stack Rule

Developers must NOT independently replace:

- Next.js
- React
- TypeScript
- Express
- MariaDB

with another framework/database.

Do not independently introduce:

- MongoDB
- Firebase
- PostgreSQL
- Another backend framework
- Another frontend application
- ORM architecture
- Separate payroll application

without approval.

All team members are building ONE Payroll module.

---

# 6. Mandatory Functional Requirements

The approved HR-PAY scope contains six core requirements.

## FR-PAY-001 — Salary Structure Builder

Authorized users must be able to manage employee salary structures.

---

## FR-PAY-002 — Payroll Run Wizard

Authorized users must be able to perform the approved payroll-run workflow.

---

## FR-PAY-003 — Payslip View

Authorized users/employees must be able to view applicable payslip information.

---

## FR-PAY-004 — Payslip PDF

The system must support payslip PDF output.

---

## FR-PAY-005 — Arrears

Approved manual arrears must be supported.

---

## FR-PAY-006 — Deductions

Approved manual deductions must be supported.

---

# 7. CRITICAL PAYROLL BOUNDARY

This is the most important rule in Module 9.

Our native Payroll scope is:

Gross Salary
+
Manual Arrears
-
Manual Deductions
=
Controlled Payroll Result

The module must NOT implement:

- PF calculation
- ESI calculation
- TDS calculation
- GST accounting
- Statutory payroll engine
- Tax filing
- E-filing
- Statutory reporting
- Government payroll submission

These features are OUT OF SCOPE.

---

# 8. Payroll Calculation Restriction

Frontend developers must NEVER implement payroll calculations.

Backend interns must also NOT invent financial formulas.

For example, developers must NOT independently decide:

basicSalary * 0.12

or:

grossSalary - customTaxFormula

or any PF/ESI/TDS/tax/statutory calculation.

Financial calculation behavior is controlled separately.

The team's responsibility is to correctly build:

- Data collection
- Salary structure management
- Workflow
- APIs
- Persistence
- Manual deduction/arrear handling
- Payslip presentation
- Validation
- Permissions
- Integration

not to invent financial policy.

---

# 9. Core Payroll Workflow

HR / Payroll User
        ↓
Payroll Dashboard
        ↓
Salary Structures
        ↓
Employee Salary Assignment
        ↓
Payroll Period
        ↓
Prepare Payroll Run
        ↓
Review Employees
        ↓
Manual Arrears / Deductions
        ↓
Authorized Payroll Execution
        ↓
Payroll Result
        ↓
Payslip
        ↓
Payslip PDF

---

# 10. Main Payroll Areas

Module 9 contains five major functional areas:

1. Payroll Dashboard
2. Salary Structures
3. Payroll Runs
4. Deductions & Arrears
5. Payslips

---

# 11. Payroll Dashboard

The dashboard should provide a useful payroll overview.

Suggested information:

- Current payroll period
- Total employees in current run
- Payroll run status
- Total gross payroll
- Total manual deductions
- Total arrears
- Payslips generated
- Recent payroll runs

Dashboard values must eventually come from real backend/database data.

Frontend mock values may be used during parallel development but must follow the agreed contract.

---

# 12. Salary Structure Management

Required functionality:

- Salary structure list
- Create salary structure
- View salary structure
- Edit salary structure
- Assign structure to employee where applicable
- Search salary structures
- Filter records

Suggested salary information:

- Employee
- Salary structure name
- Gross salary
- Effective date
- Status
- Notes

The frontend must NOT derive statutory deductions.

---

# 13. Salary Structure UI

Suggested flow:

Salary Structures
      ↓
Select Employee
      ↓
Enter Approved Salary Information
      ↓
Review
      ↓
Save
      ↓
Backend Validation
      ↓
Database Persistence

Possible statuses:

- Draft
- Active
- Inactive

Frontend/backend/database must use the same agreed values.

---

# 14. Payroll Run Management

A payroll run represents payroll processing for a defined payroll period.

Required UI:

- Payroll run list
- Create/prepare payroll run
- Payroll run details
- Employee payroll records
- Payroll-run status
- Search/filter
- Review action

Suggested flow:

Select Payroll Period
        ↓
Prepare Run
        ↓
Load Applicable Employees
        ↓
Review Salary Data
        ↓
Review Arrears
        ↓
Review Deductions
        ↓
Authorized Execution
        ↓
Payslip Records

---

# 15. Proposed Payroll Run States

For our implementation contract:

- Draft
- Prepared
- Processing
- Completed
- Failed

Any transition affecting financial results must be backend-controlled.

The frontend must not simply change payroll-run status locally.

---

# 16. Deductions

The module supports MANUAL deductions only.

Examples of the data structure may include:

- Employee
- Payroll run
- Deduction title
- Amount
- Reason
- Notes
- Created by
- Created date

The system should allow:

- Add deduction
- View deduction
- Update allowed deduction information before final processing
- Remove/cancel an allowed draft deduction where applicable

No statutory deduction formula is to be implemented.

---

# 17. Arrears

The module supports manual arrears.

Suggested information:

- Employee
- Payroll run
- Arrear title
- Amount
- Reason
- Notes
- Created by
- Created date

Required operations:

- Add arrear
- View arrear
- Update allowed arrear information
- Remove/cancel allowed draft arrear where applicable

---

# 18. Payslip

The payslip experience should clearly display applicable payroll information.

Suggested sections:

Employee Information

Payroll Period

Salary Information

Gross Salary

Manual Arrears

Manual Deductions

Final Payroll Amount

Payroll Status

Generated Date

---

# 19. Payslip PDF

FR-PAY-004 requires payslip PDF functionality.

The UI should provide an appropriate action such as:

View Payslip
Download PDF

The PDF must represent the same approved payroll record shown in the system.

The PDF must NOT perform independent financial calculations.

It consumes finalized/approved payroll values.

---

# 20. Frontend Architecture

Suggested structure:

src/
└── modules/
    └── payroll/
        │
        ├── components/
        │   ├── dashboard/
        │   ├── salary/
        │   ├── runs/
        │   ├── adjustments/
        │   └── payslips/
        │
        ├── hooks/
        ├── services/
        ├── types/
        ├── constants/
        └── utils/

Reusable components should remain separate from route/page components.

---

# 21. Frontend — Ankit

Ankit owns:

## Payroll Dashboard

- Payroll overview
- Summary cards
- Current payroll period
- Recent payroll runs
- Quick actions

## Salary Structures

- Salary structure list
- Salary structure details
- Create salary structure form
- Edit salary structure form
- Employee salary display
- Search
- Filters
- Status badges

Required states:

- Loading
- Empty
- Error
- Retry
- Success

---

# 22. Frontend — Sunidhi

Sunidhi owns:

## Payroll Runs

- Payroll run list
- Payroll run wizard
- Payroll run details
- Employee payroll table
- Run status display

## Adjustments

- Deduction UI
- Add deduction
- Arrear UI
- Add arrear
- Adjustment details

## Payslips

- Payslip list
- Payslip details
- Payslip preview
- PDF action

Required states:

- Loading
- Empty
- Error
- Retry
- Success

---

# 23. Shared Frontend Rules

Ankit and Sunidhi must share:

- Button components
- Form components
- Search controls
- Filters
- Cards
- Tables
- Status badges
- Modals
- Confirmation dialogs
- Loading states
- Error states
- Empty states

Do NOT create two unrelated design systems.

---

# 24. UI/UX Requirements

Payroll is financial software.

The interface should prioritize:

- Clarity
- Accuracy
- Readability
- Clear financial labels
- Strong visual hierarchy
- Explicit confirmation
- Clear status
- Clear errors
- Responsive behavior

Avoid:

- Excessive animation
- Decorative gradients
- Ambiguous buttons
- Hidden financial information
- Confusing status colors
- Silent operations

---

# 25. Responsive Requirements

Required:

- Desktop
- Tablet
- Mobile

Large payroll tables should adapt appropriately.

Possible mobile behavior:

- Responsive cards
- Horizontal table scrolling
- Condensed columns

No critical financial information should disappear merely because the screen is smaller.

---

# 26. Backend Architecture

Suggested structure:

src/
└── modules/
    └── payroll/
        │
        ├── controllers/
        ├── services/
        ├── repositories/
        ├── routes/
        ├── validators/
        ├── types/
        └── utils/

Request flow:

Route
  ↓
Authorization
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MariaDB

---

# 27. Proposed API Namespace

All fresh Payroll APIs should remain grouped under:

/api/v1/hr/payroll

---

# 28. Proposed API Contract

## Dashboard

GET
/api/v1/hr/payroll/dashboard

---

## Salary Structures

GET
/api/v1/hr/payroll/salary-structures

POST
/api/v1/hr/payroll/salary-structures

GET
/api/v1/hr/payroll/salary-structures/:salaryStructureId

PATCH
/api/v1/hr/payroll/salary-structures/:salaryStructureId

---

## Payroll Runs

GET
/api/v1/hr/payroll/runs

POST
/api/v1/hr/payroll/runs

GET
/api/v1/hr/payroll/runs/:runId

PATCH
/api/v1/hr/payroll/runs/:runId

---

## Payroll Run Execution

POST
/api/v1/hr/payroll/runs/:runId/execute

IMPORTANT:

This endpoint is highly restricted.

The backend intern must wire the workflow/authorization boundary but must NOT invent the financial calculation algorithm.

---

## Deductions

GET
/api/v1/hr/payroll/runs/:runId/deductions

POST
/api/v1/hr/payroll/runs/:runId/deductions

PATCH
/api/v1/hr/payroll/deductions/:deductionId

---

## Arrears

GET
/api/v1/hr/payroll/runs/:runId/arrears

POST
/api/v1/hr/payroll/runs/:runId/arrears

PATCH
/api/v1/hr/payroll/arrears/:arrearId

---

## Payslips

GET
/api/v1/hr/payroll/payslips

GET
/api/v1/hr/payroll/payslips/:payslipId

GET
/api/v1/hr/payroll/payslips/:payslipId/pdf

---

# 29. API Response Contract

Successful response:

{
  "success": true,
  "message": "Payroll records retrieved successfully.",
  "data": []
}

Failure:

{
  "success": false,
  "message": "Unable to retrieve payroll records."
}

Frontend and backend must use one consistent response structure.

---

# 30. Search / Filtering

Applicable collection APIs should support search/filtering.

Examples:

?search=employee

?status=completed

?period=2026-07

Possible filters:

- Employee
- Payroll period
- Payroll status
- Salary structure status
- Payslip status

---

# 31. Backend — Jatin

Jatin owns:

## Salary Structure APIs

- Create
- List
- Get
- Update
- Search
- Filter
- Validation

## Payroll Data APIs

- Payroll record retrieval
- Dashboard-supporting data
- Employee/payroll lookup where required

He owns the applicable:

- Routes
- Controllers
- Services
- Repositories
- Validators

Jatin must NOT implement independent financial formulas.

---

# 32. Backend — Neha

Neha owns:

## Payroll Run Workflow

- Create run
- List runs
- Get run
- Allowed run-state operations
- Run validation

## Deductions

- Create
- Retrieve
- Update allowed draft records
- Validation

## Arrears

- Create
- Retrieve
- Update allowed draft records
- Validation

## Payslips

- List
- Retrieve
- PDF endpoint integration

Neha must NOT invent payroll calculation logic.

---

# 33. Backend Shared Rules

Jatin and Neha must:

- Use parameterized SQL
- Avoid duplicate middleware
- Avoid duplicate utilities
- Avoid route collisions

---

# 34. Database Ownership

Database development is owned by Khushboo.

The Payroll schema will be created fresh for this implementation.

Database:

MariaDB

---

# 35. Required Payroll Tables

The approved table names are:

client_salary_structures

client_payroll_runs

client_payslips

client_salary_deductions

client_salary_arrears

The schema itself will be created fresh.

---

# 36. client_salary_structures

Purpose:

Stores employee salary structures.

Suggested fields:

- id
- organization_id
- employee_id
- structure_name
- gross_salary
- effective_from
- effective_to
- status
- notes
- created_by
- created_at
- updated_at

Financial values should use an appropriate fixed-precision database type.

Do NOT use floating-point storage for money.

---

# 37. client_payroll_runs

Purpose:

Stores payroll-run information.

Suggested fields:

- id
- organization_id
- payroll_period
- run_reference
- status
- employee_count
- gross_total
- arrears_total
- deductions_total
- final_total
- prepared_by
- executed_by
- prepared_at
- executed_at
- created_at
- updated_at

---

# 38. client_salary_deductions

Purpose:

Stores manual deductions.

Suggested fields:

- id
- organization_id
- payroll_run_id
- employee_id
- deduction_title
- amount
- reason
- notes
- created_by
- created_at
- updated_at

---

# 39. client_salary_arrears

Purpose:

Stores manual arrears.

Suggested fields:

- id
- organization_id
- payroll_run_id
- employee_id
- arrear_title
- amount
- reason
- notes
- created_by
- created_at
- updated_at

---

# 40. client_payslips

Purpose:

Stores payroll-result/payslip records.

Suggested fields:

- id
- organization_id
- payroll_run_id
- employee_id
- salary_structure_id
- gross_salary
- arrears_total
- deductions_total
- final_amount
- status
- generated_at
- pdf_reference
- created_at
- updated_at

---

# 41. Database Relationships

Conceptually:

Employee
   |
   └── Salary Structure
            |
            ↓
       Payroll Run
            |
      +-----+------+
      |            |
 Deductions      Arrears
      |            |
      +-----+------+
            |
         Payslip

All applicable records must remain organization-scoped.

---

# 42. Tenant Isolation

Every applicable Payroll record must belong to an organization.

organization_id

must be enforced at the backend/database query level.

Organization A must never retrieve:

- Organization B salary structures
- Organization B payroll runs
- Organization B deductions
- Organization B arrears
- Organization B payslips

Tenant isolation is mandatory because payroll information is sensitive financial data.

---

# 43. Permissions

Required permission keys:

hr.payroll.view

hr.payroll.manage

hr.payroll.run

## hr.payroll.view

Employee/self-scope should permit access only to the applicable user's own payslip information.

## hr.payroll.manage

For authorized payroll/accounting/admin operations.

## hr.payroll.run

Most restricted Payroll permission.

Required for actual payroll-run execution.

The frontend hiding a button is NOT authorization.

The backend must enforce these permissions.

---

# 44. Sensitive Data

Payroll contains sensitive financial information.

Do not:

- Log salary values unnecessarily
- Expose payroll data to unauthorized users
- Return cross-tenant financial records
- Put financial data into public URLs unnecessarily
- Store secrets in source code
- Commit .env files

---

# 45. Validation

Backend validation is authoritative.

Validate:

- Organization
- Employee
- Salary structure
- Payroll period
- Monetary values
- Deduction
- Arrear
- Run state
- Permission
- Payslip access

Reject invalid financial inputs.

---

# 46. Money Handling

Financial values must be treated carefully.

Database:

Use fixed-precision DECIMAL values.

Avoid binary floating-point for persisted money.

Formatting belongs in the presentation layer.

Calculation behavior must follow approved payroll logic and must not be independently invented by interns.

---

# 47. Audit Requirements

Financial mutations should be traceable.

Important actions include:

- Salary structure creation/change
- Deduction creation/change
- Arrear creation/change
- Payroll run preparation
- Payroll execution
- Payslip generation

Where the final audit mechanism is implemented, records should identify the responsible actor and relevant timestamp.

---

# 48. Frontend Mock Rule

Frontend may initially use contract-compatible mocks.

Example:

{
  "id": 4,
  "employeeId": 21,
  "payrollPeriod": "2026-07",
  "grossSalary": "50000.00",
  "arrearsTotal": "1500.00",
  "deductionsTotal": "500.00",
  "finalAmount": "51000.00",
  "status": "completed"
}

These values are MOCK DATA.

Frontend developers must NOT derive `finalAmount` using invented payroll logic.

---

# 49. Parallel Development

                PAYROLL CONTRACT
                       |
          +------------+------------+
          |                         |
       Frontend                   Backend
   Ankit + Sunidhi             Jatin + Neha
          |                         |
      Contract mocks            Contract APIs
          |                         |
          +------------+------------+
                       |
                    Database
                    Khushboo
                       |
                   Integration
                       |
                    Testing
                       |
                 Final Assembly

---

# 50. Recommended Branches

Ankit:

ankit-hr-payroll

Sunidhi:

sunidhi-hr-payroll

Jatin:

jatin-hr-payroll

Neha:

neha-hr-payroll

Khushboo handles database and final assembly/integration.

---

# 51. Git Rules

Before working:

git switch <your-branch>

Developers must NOT work directly on main.

Do not commit:

- node_modules
- .next
- dist
- .env
- local secrets
- logs
- build caches
- IDE temporary files

Commit:

- Source code
- package.json
- lockfiles
- .env.example
- Database scripts
- Documentation

---

# 52. Final Assembly Structure

Payroll-Management-Assembly/
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
│   └── HR_PAYROLL_MODULE_CONTRACT.md
│
└── README.md

Incoming submissions remain preserved.

The final directory contains the integrated implementation.

---

# 53. Integration Flow

Frontend
    ↓
Payroll REST API
    ↓
Authorization
    ↓
Validation
    ↓
Controller
    ↓
Payroll Service
    ↓
Repository
    ↓
MariaDB
    ↓
API Response
    ↓
Frontend

The UI must display values returned by the approved backend workflow.

---

# 54. Minimum Integration Testing

## Salary Structures

Test:

- Create salary structure
- List salary structures
- View structure
- Edit allowed information
- Search
- Filter
- Database persistence

## Payroll Runs

Test:

- Create payroll run
- View payroll run
- View employee records
- Run-state behavior
- Permission behavior

## Deductions

Test:

- Add manual deduction
- Retrieve deduction
- Update allowed deduction
- Confirm persistence

## Arrears

Test:

- Add arrear
- Retrieve arrear
- Update allowed arrear
- Confirm persistence

## Payslips

Test:

- Retrieve payslip
- Verify correct employee
- Verify correct organization
- Verify payroll values
- Verify PDF endpoint/output

---

# 55. Security Testing

Verify:

- Cross-organization requests fail
- Unauthorized payroll viewing fails
- Unauthorized management fails
- Unauthorized payroll execution fails
- Invalid IDs fail safely
- Invalid monetary values fail
- Invalid run states fail
- SQL input remains parameterized
- Sensitive errors are not exposed

---

# 56. Frontend Verification

Run:

npm install

npx tsc --noEmit

npm run build

The frontend must build without critical TypeScript/build errors.

---

# 57. Backend Verification

Run:

npm install

npm run typecheck

npm run build

Backend must compile successfully.

---

# 58. Database Verification

Verify:

- Tables create successfully
- Foreign keys work
- Required indexes exist
- Decimal money fields behave correctly
- Organization filtering works
- Seed/test records work
- Invalid relationships are rejected

---

# 59. Definition of Done

Module 9 is DONE only when:

- Salary structure builder works
- Payroll-run workflow works
- Payslip view works
- Payslip PDF works
- Manual arrears work
- Manual deductions work
- Search/filter works where applicable
- Frontend works
- Backend works
- Database works
- Frontend/backend integration succeeds
- Backend/database integration succeeds
- Data persists
- Tenant isolation is verified
- Permissions are verified
- Payroll execution is appropriately restricted
- Validation exists
- Error handling exists
- Loading states exist
- Empty states exist
- Retry behavior exists where appropriate
- Responsive behavior is verified
- Audit-relevant actions are traceable
- TypeScript checks pass
- Builds pass
- Integration tests pass
- README is complete
- Final assembly is prepared
- No critical defect remains

"UI completed" does NOT mean Payroll is completed.

---

# 60. Critical Team Rule

Ankit and Sunidhi:

BUILD THE PAYROLL FRONTEND.

They DO NOT design payroll calculations.

Jatin and Neha:

BUILD THE APPROVED BACKEND WORKFLOW AND APIs.

They DO NOT invent payroll formulas or statutory calculations.

Khushboo:

OWNS DATABASE + INTEGRATION + FINAL IMPLEMENTATION COORDINATION.

Financial calculation logic must remain within the approved controlled boundary.

---

# 61. Explicitly Prohibited Implementation

DO NOT implement:

PF

ESI

TDS

GST payroll accounting

Tax filing

Government statutory reporting

E-filing

Automatic statutory deduction formulas

Independent tax engines

These are outside Module 9.

---

# 62. Final Objective

The final Module 9 implementation should provide:

Salary Structure
       ↓
Payroll Period
       ↓
Payroll Run
       ↓
Manual Adjustments
       ↓
Controlled Processing
       ↓
Payslip
       ↓
PDF

while remaining:

- Secure
- Organization-scoped
- Permission-controlled
- Financially safe
- API-driven
- Responsive
- Maintainable
- Testable
- Integration-ready
- Consistent with WisWits

---

END OF MODULE CONTRACT