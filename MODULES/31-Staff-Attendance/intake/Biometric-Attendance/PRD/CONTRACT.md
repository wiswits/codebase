# ============================================================
# WisWits ERP
# Biometric Attendance Module Engineering Contract
# ============================================================
Module Name      : Biometric Attendance
Organization     : WisWits Edutech Pvt. Ltd.
Category         : Human Resource Management
Version          : 1.0
============================================================
# MODULE OVERVIEW

Module Name
Biometric Attendance

Category
People & HR

Purpose
The Biometric Attendance Module serves as the centralized attendance management system of WisWits ERP.
The module is responsible for recording, synchronizing, monitoring, validating, and managing employee attendance through biometric devices while maintaining complete audit history and organization-level isolation.

The module provides real-time attendance visibility for administrators, HR managers, department heads, and employees.
The system supports seamless integration with biometric devices and automatically processes attendance records for reporting and future payroll calculations.
============================================================

# BUSINESS OBJECTIVE
The objective of this module is to automate employee attendance management using biometric devices while eliminating manual attendance processes.

The module enables
✓ Employee Check-In
✓ Employee Check-Out
✓ Device Synchronization
✓ Shift Management
✓ Attendance Monitoring
✓ Attendance Corrections
✓ Attendance Approval
✓ Late Arrival Tracking
✓ Early Exit Tracking
✓ Overtime Tracking
✓ Holiday Management
✓ Attendance Reports
✓ Attendance Analytics
✓ Attendance History

The system should improve attendance accuracy, transparency, and operational efficiency.
============================================================

# BUSINESS SCOPE

The Biometric Attendance Module includes
Attendance Dashboard
↓
Biometric Devices
↓
Employee Attendance
↓
Shift Management
↓
Attendance Corrections
↓
Attendance Approval
↓
Late Arrival Monitoring
↓
Early Exit Monitoring
↓
Overtime Tracking
↓
Attendance Reports
↓
Attendance Analytics
↓
Attendance History
↓
Dashboard
============================================================

# MODULE VISION
Develop a professional, Enterprise-grade,Secure,Scalable,API-driven,Multi-tenant

Biometric Attendance Module that integrates seamlessly into the WisWits ERP platform.

The module should support
Thousands of employees
Multiple organizations
Multiple branches
Multiple biometric devices
Multiple shifts
Future cloud synchronization
Future mobile attendance
Future facial recognition integration
Future GPS attendance integration
============================================================
# SIR'S MANDATORY INTEGRATION REMARKS

The following standards are mandatory.
------------------------------------------------------------
BACKEND
------------------------------------------------------------
Authentication
Developers MUST NOT implement custom authentication.
Do NOT use
❌ jwt.verify()
❌ jsonwebtoken
❌ Authorization Bearer Parsing
Authentication must always use
authenticate()
↓
req.user
↓
req.user.organization_id

------------------------------------------------------------

Database
Developers MUST NOT create local database pools.

Do NOT use
mysql.createPool()
Always use
query()
withTransaction()
from the shared platform database helper.

------------------------------------------------------------
Permissions
Never hardcode permissions.
Never create
permissions.js
Always use
requirePermission()
Examples
requirePermission("attendance:view")
requirePermission("attendance:create")
requirePermission("attendance:update")
requirePermission("attendance:approve")
requirePermission("attendance:report")
Permission values shall be managed centrally.

------------------------------------------------------------
Audit Logging
Every mutation must trigger
audit()
Create
Update
Delete
Approve
Reject
Synchronize
Import
Export
Correction
must generate audit events.
------------------------------------------------------------

Database Migrations
Migration naming format
001_create_tables.sql
002_indexes.sql
003_seed_permissions.sql

Never use
USE database;
inside migration files.
------------------------------------------------------------
FRONTEND
------------------------------------------------------------

Frontend shall use only

✓ Next.js App Router
✓ React
✓ TypeScript
✓ Tailwind CSS

Do NOT use
✗ Vite
✗ React Router
✗ Browser Alert
✗ Browser Confirm
✗ Browser Prompt

Instead use
Toast
Dialog
ConfirmDialog

------------------------------------------------------------
DESIGN SYSTEM
------------------------------------------------------------
Official WisWits Theme

Primary
#0F2147
Gold
#C8A04E
Ivory
#F7F4EC
Fonts
Playfair Display
Source Sans Pro
Every page must follow the official WisWits design language.

============================================================
# TECHNOLOGY STACK

Frontend
• Next.js (App Router)
• React
• TypeScript
• Tailwind CSS
• React Query
• Axios
• Lucide React
• Recharts
• React Hook Form
• Zod
• clsx
• tailwind-merge
------------------------------------------------------------

Backend
• Node.js
• Express.js
• TypeScript
• Express Validator
• Multer
• dotenv
• Helmet
• CORS
• Morgan

------------------------------------------------------------

Database
• MariaDB
• mysql2
------------------------------------------------------------

Architecture
• REST API
• Layered Architecture
• Repository Pattern
• Service Pattern
• Controller Pattern
• Enterprise Multi-Tenant SaaS
------------------------------------------------------------
Authentication
• Shared Authenticate Middleware
Authorization
• Shared Permission Middleware
------------------------------------------------------------

Development Tools
• Git
• GitHub
• Visual Studio Code
• npm
• ESLint
• Markdown
============================================================
# ARCHITECTURE OVERVIEW

                  Next.js App Router
                          │
                          ▼
                    REST API Layer
                          │
                          ▼
                 Express.js Application
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
 Controllers          Services         Validators
                          │
                          ▼
                    Repositories
                          │
                          ▼
                    MariaDB Database
============================================================

# BUSINESS WORKFLOW
Employee
↓
Biometric Device
↓
Attendance Synchronization
↓
Attendance Validation
↓
Shift Mapping
↓
Attendance Processing
↓
Late / Early Calculation
↓
Overtime Calculation
↓
Attendance Approval
↓
Attendance Reports
↓
Attendance Analytics
↓
Dashboard
============================================================
# PRIMARY USERS
Super Administrator
Organization Administrator
HR Manager
HR Executive
Department Head
Reporting Manager
Employees
System Administrator
============================================================

# HIGH LEVEL PERMISSIONS
attendance.view
attendance.create
attendance.update
attendance.delete
attendance.sync
attendance.approve
attendance.reject
attendance.report
attendance.analytics
attendance.settings
attendance.shift.manage
attendance.device.manage
============================================================

#  DEVELOPMENT TEAM
| Developer | Role | Responsibility | Technology Stack |
|------------|------|----------------|------------------|
| **Ankit** | Frontend Developer 1 | Dashboard, Analytics, Charts, Shared Components, Device Dashboard | Next.js, React, TypeScript, Tailwind CSS |
| **Sunidhi** | Frontend Developer 2 | Attendance Pages, Shift Management, Forms, Reports, Tables | Next.js, React, TypeScript, Tailwind CSS |
| **Jatin** | Backend Developer 1 | Controllers, Routes, REST APIs, Validation | Node.js, Express.js, TypeScript |
| **Neha** | Backend Developer 2 | Services, Repositories, Business Logic, SQL Queries | Node.js, Express.js, TypeScript |
| **Khushboo** | Database Engineer & Integration Lead | MariaDB Schema, Integration, Testing, Documentation, Final Assembly | MariaDB, SQL, Git |

============================================================
#  FRONTEND RESPONSIBILITIES
------------------------------------------------------------
ANKIT
------------------------------------------------------------
Primary Responsibility

Attendance Dashboard
Dashboard Cards
Charts
Statistics
Analytics
Shared Components
Responsive Layout
Quick Actions
Recent Attendance
Attendance Trends
Attendance Summary
Employee Presence Chart
Department Attendance Chart
Attendance KPI Cards
------------------------------------------------------------
Owned Pages
Dashboard
Analytics
Overview
------------------------------------------------------------
SUNITDHI
------------------------------------------------------------
Primary Responsibility

Attendance Records
Employee Attendance
Shift Management
Biometric Devices
Attendance Corrections
Attendance Requests
Reports
History
Settings
Search
Filters
Forms
Dialogs
Responsive Tables
------------------------------------------------------------

Owned Pages
Attendance
Devices
Shifts
Corrections
Reports
History
Settings
============================================================
#  BACKEND RESPONSIBILITIES
------------------------------------------------------------
JATIN
------------------------------------------------------------

Responsible For
Controllers
REST APIs
Routes
Validation
Authentication Integration
Permission Integration
Error Handling
API Documentation
============================================================
-----------------------------------------------------------
NEHA
------------------------------------------------------------
Responsible For

Business Logic
Services
Repositories
Parameterized SQL
Transactions
Attendance Calculations
Late Entry Logic
Early Exit Logic
Overtime Logic
Audit Integration
============================================================
#  DATABASE & INTEGRATION RESPONSIBILITIES
------------------------------------------------------------
KHUSHBOO
------------------------------------------------------------
Responsible For
Database Design
MariaDB Schema
Migration Files
Indexes
Foreign Keys
Views
Stored Procedures
Seed Files
Integration
Testing
Documentation
Git Merge
Deployment Verification
============================================================

#  DEVELOPMENT RULES
Every team member must
✓ Work only on assigned branch
✓ Follow folder ownership
✓ Follow coding standards
✓ Test locally before pushing
✓ Use meaningful commit messages
✓ Resolve TypeScript errors
✓ Resolve ESLint warnings
✓ Submit only working code
============================================================
#  FRONTEND STRUCTURE

frontend/
│
├── app/
├── public/
├── src/
├── components/
├── hooks/
├── services/
├── lib/
├── utils/
├── types/
├── constants/
├── styles/
├── assets/
├── middleware/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
============================================================
#  APP ROUTER STRUCTURE

app/
│
├── layout.tsx
├── page.tsx
│
├── attendance/
│   │
│   ├── page.tsx
│   │
│   ├── dashboard/
│   │      page.tsx
│   │
│   ├── records/
│   │      page.tsx
│   │
│   ├── shifts/
│   │      page.tsx
│   │
│   ├── devices/
│   │      page.tsx
│   │
│   ├── corrections/
│   │      page.tsx
│   │
│   ├── reports/
│   │      page.tsx
│   │
│   ├── analytics/
│   │      page.tsx
│   │
│   ├── history/
│   │      page.tsx
│   │
│   ├── settings/
│   │      page.tsx
│   │
│   └── [attendanceId]/
│          │
│          ├── page.tsx
│          │
│          └── edit/
│                 page.tsx
============================================================
#  COMPONENT STRUCTURE

src/
└── components/
    │
    ├── dashboard/
    ├── attendance/
    ├── shifts/
    ├── devices/
    ├── corrections/
    ├── reports/
    ├── analytics/
    ├── history/
    ├── settings/
    ├── forms/
    ├── tables/
    ├── dialogs/
    ├── shared/
    ├── layout/
    └── ui/

============================================================
#  ANKIT FOLDER OWNERSHIP

src/components/dashboard/
AttendanceDashboard.tsx
AttendanceSummary.tsx
AttendanceStatistics.tsx
AttendanceTrendChart.tsx
DepartmentAttendanceChart.tsx
EmployeePresenceChart.tsx
RealtimeAttendanceCard.tsx
QuickActions.tsx
RecentActivities.tsx
StatusCards.tsx

------------------------------------------------------------
src/components/analytics/

AttendanceAnalytics.tsx
AttendanceGraph.tsx
MonthlyAttendanceChart.tsx
WeeklyAttendanceChart.tsx
AttendanceHeatmap.tsx
LateArrivalChart.tsx
OvertimeChart.tsx
============================================================

#  SUNIDHI FOLDER OWNERSHIP
src/components/attendance/
AttendanceTable.tsx
AttendanceForm.tsx
AttendanceDetails.tsx
AttendanceFilters.tsx
AttendanceSearch.tsx
AttendanceStatusBadge.tsx
------------------------------------------------------------
src/components/shifts/
ShiftTable.tsx
ShiftForm.tsx
ShiftDetails.tsx
ShiftAssignment.tsx
------------------------------------------------------------
src/components/devices/
DeviceTable.tsx
DeviceForm.tsx
DeviceStatus.tsx
DeviceSync.tsx
------------------------------------------------------------
src/components/corrections/
CorrectionTable.tsx
CorrectionForm.tsx
CorrectionApproval.tsx
------------------------------------------------------------
src/components/reports/
AttendanceReport.tsx
ExportAttendance.tsx
AttendanceFilters.tsx
------------------------------------------------------------
src/components/history/
AttendanceHistory.tsx
AttendanceTimeline.tsx
============================================================
#  SHARED COMPONENTS
src/components/shared/
SearchBar.tsx
PageHeader.tsx
SummaryCard.tsx
StatusBadge.tsx
InfoCard.tsx
LoadingState.tsx
ErrorState.tsx
EmptyState.tsx
Pagination.tsx
ConfirmDialog.tsx
ToastProvider.tsx
============================================================
#  HOOKS
src/hooks/
useAttendance.ts
useDashboard.ts
useDevices.ts
useShifts.ts
useCorrections.ts
useReports.ts
useAnalytics.ts
usePagination.ts
============================================================
#  SERVICES
src/services/
attendance.api.ts
dashboard.api.ts
device.api.ts
shift.api.ts
report.api.ts
analytics.api.ts
api-client.ts
============================================================
#  TYPES
src/types/
attendance.types.ts
dashboard.types.ts
device.types.ts
shift.types.ts
analytics.types.ts
report.types.ts
api.types.ts
============================================================
#  UTILITIES
src/utils/
date.ts
attendance.ts
formatter.ts
validators.ts
constants.ts
permissions.ts
helpers.ts

============================================================

#  BACKEND STRUCTURE
backend/
│
├── src/
├── tests/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── server.ts

============================================================
#  BACKEND SOURCE STRUCTURE

src/
│
├── config/
├── middleware/
├── controllers/
├── routes/
├── services/
├── repositories/
├── validators/
├── database/
├── constants/
├── utils/
├── types/
├── modules/
└── app.ts
============================================================

#  MODULE STRUCTURE

modules/
└── biometric-attendance/
        │
        ├── controllers/
        ├── routes/
        ├── services/
        ├── repositories/
        ├── validators/
        ├── middleware/
        ├── types/
        ├── constants/
        └── utils/

Every attendance feature should remain inside this module.
Never place business logic outside the module.

============================================================
#  CONTROLLERS

controllers/
│
├── dashboard.controller.ts
├── attendance.controller.ts
├── biometric-device.controller.ts
├── shift.controller.ts
├── correction.controller.ts
├── report.controller.ts
├── analytics.controller.ts
├── history.controller.ts
└── settings.controller.ts
------------------------------------------------------------
Controller Responsibilities

Receive Request
↓
Validate Request
↓
Call Service
↓
Return Standard API Response
Controllers must never contain
✗ SQL Queries
✗ Business Logic
============================================================

#  ROUTES
routes/
│
├── dashboard.routes.ts
├── attendance.routes.ts
├── biometric-device.routes.ts
├── shift.routes.ts
├── correction.routes.ts
├── report.routes.ts
├── analytics.routes.ts
├── history.routes.ts
├── settings.routes.ts
└── index.ts

------------------------------------------------------------

# Routes are responsible for
✓ API Mapping
✓ Authentication Middleware
✓ Permission Middleware
✓ Validation Middleware
✓ Controller Mapping
============================================================

#  SERVICES

services/
│
├── dashboard.service.ts
├── attendance.service.ts
├── biometric-device.service.ts
├── shift.service.ts
├── correction.service.ts
├── report.service.ts
├── analytics.service.ts
├── history.service.ts
└── settings.service.ts
------------------------------------------------------------

# Service Responsibilities
✓ Business Logic
✓ Attendance Processing
✓ Shift Calculations
✓ Device Synchronization
✓ Attendance Corrections
✓ Audit Calls
✓ Transactions
Services must NOT contain SQL.

============================================================

#  REPOSITORIES
repositories/
│
├── dashboard.repository.ts
├── attendance.repository.ts
├── biometric-device.repository.ts
├── shift.repository.ts
├── correction.repository.ts
├── report.repository.ts
├── analytics.repository.ts
├── history.repository.ts
└── settings.repository.ts
------------------------------------------------------------

# Repository Responsibilities

✓ CRUD Operations
✓ Parameterized SQL
✓ Attendance Queries
✓ Reports Queries
✓ Device Queries
✓ Transaction Handling
Repositories must never contain business logic.

============================================================

#  VALIDATORS
validators/
│
├── attendance.validator.ts
├── biometric-device.validator.ts
├── shift.validator.ts
├── correction.validator.ts
├── report.validator.ts
├── analytics.validator.ts
└── settings.validator.ts
------------------------------------------------------------

# Validation Includes

✓ Required Fields
✓ Shift Validation
✓ Employee Validation
✓ Device Validation
✓ Date Validation
✓ Time Validation
✓ Organization Validation
============================================================

#  MIDDLEWARE

middleware/
│
├── authenticate.ts
├── requirePermission.ts
├── validation.middleware.ts
├── audit.middleware.ts
├── organization.middleware.ts
├── logger.middleware.ts
└── error.middleware.ts

Shared platform middleware must always be used.
Never implement local authentication.

============================================================

#  CONFIGURATION

config/
│
├── environment.ts
├── database.ts
├── logger.ts
├── permissions.ts
└── constants.ts
============================================================

#  TYPES
types/
│
├── attendance.types.ts
├── biometric-device.types.ts
├── shift.types.ts
├── correction.types.ts
├── report.types.ts
├── analytics.types.ts
├── dashboard.types.ts
└── api.types.ts
============================================================
#  CONSTANTS

constants/
│
├── permissions.ts
├── attendance.ts
├── shifts.ts
├── devices.ts
├── statuses.ts
├── messages.ts
└── holidays.ts
============================================================

#  UTILITIES
utils/
│
├── attendance.ts
├── formatter.ts
├── pagination.ts
├── helpers.ts
├── validators.ts
├── export.ts
└── date.ts
============================================================

#  BACKEND CODING FLOW

Client
↓
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
Repository
↓
MariaDB
↓
Response

Never bypass this architecture.
============================================================
#  DATABASE STRUCTURE

database/
│
├── schema/
├── migrations/
├── seeds/
├── indexes/
├── views/
├── procedures/
├── functions/
├── triggers/
├── documentation/
└── README.md

============================================================
#  SCHEMA FILES

schema/
│
├── client_biometric_devices.sql
├── client_attendance_records.sql
├── client_attendance_shifts.sql
├── client_attendance_corrections.sql
├── client_attendance_reports.sql
├── client_attendance_analytics.sql
├── client_attendance_history.sql
└── client_holiday_calendar.sql
============================================================

#  MIGRATIONS
migrations/
│
├── 001_create_biometric_devices.sql
├── 002_create_attendance_records.sql
├── 003_create_shift_management.sql
├── 004_create_attendance_corrections.sql
├── 005_create_reports.sql
├── 006_create_history.sql
├── 007_create_indexes.sql
└── 008_seed_permissions.sql
Migration Rules

✓ Sequential Numbering
✓ One Responsibility Per File
✓ No USE database;
============================================================

#  SEED FILES
seeds/
│
├── attendance_permissions.seed.sql
├── default_shifts.seed.sql
├── attendance_status.seed.sql
├── holiday_calendar.seed.sql
└── default_settings.seed.sql
============================================================
# INDEXES

indexes/
│
├── attendance_indexes.sql
├── employee_indexes.sql
├── device_indexes.sql
├── report_indexes.sql
└── analytics_indexes.sql
============================================================

#  DATABASE VIEWS
views/
│
├── attendance_summary.sql
├── employee_attendance.sql
├── attendance_dashboard.sql
├── overtime_summary.sql
└── monthly_attendance.sql
============================================================

#  STORED PROCEDURES
procedures/
│
├── sync_biometric_data.sql
├── calculate_overtime.sql
├── process_attendance.sql
├── generate_attendance_report.sql
└── update_dashboard.sql
============================================================

#  DATABASE FUNCTIONS
functions/
│
├── calculate_working_hours.sql
├── calculate_late_minutes.sql
├── calculate_early_exit.sql
├── calculate_overtime.sql
└── attendance_percentage.sql
============================================================

# DATABASE TRIGGERS
triggers/
│
├── attendance_audit.sql
├── correction_audit.sql
├── shift_audit.sql
├── device_audit.sql
└── report_audit.sql
============================================================

#  DOCUMENTATION
documentation/
│
├── er_diagram.md
├── database_relationships.md
├── api_reference.md
├── migration_guide.md
├── indexes.md
└── permissions.md
============================================================

#  MAIN DATABASE TABLES
client_biometric_devices
client_attendance_records
client_attendance_shifts
client_attendance_corrections
client_attendance_reports
client_attendance_analytics
client_attendance_history
client_holiday_calendar
============================================================

#  DATABASE STANDARDS

Every table must include
✓ id
✓ organization_id
✓ created_by
✓ updated_by
✓ created_at
✓ updated_at
Where applicable

✓ status
✓ remarks
✓ deleted_at
============================================================

#  DATABASE SECURITY
Mandatory
✓ organization_id Scoping
✓ Parameterized SQL
✓ Transactions
✓ Foreign Keys
✓ Indexes
Never

✗ SELECT *
✗ Dynamic SQL
✗ Hardcoded organization_id
✗ mysql.createPool()

============================================================
#  API ROOT
/api/v1/attendance
============================================================

# API MODULES

Dashboard
Attendance
Biometric Devices
Shifts
Corrections
Reports
Analytics
History
Settings

============================================================
# DASHBOARD ENDPOINTS

GET
/api/v1/attendance/dashboard
GET
/api/v1/attendance/dashboard/summary
============================================================
#  ATTENDANCE ENDPOINTS
GET
/api/v1/attendance
POST
/api/v1/attendance
GET
/api/v1/attendance/:id
PATCH
/api/v1/attendance/:id
DELETE
/api/v1/attendance/:id
============================================================
#  BIOMETRIC DEVICE ENDPOINTS
GET
/api/v1/attendance/devices
POST
/api/v1/attendance/devices
PATCH
/api/v1/attendance/devices/:id
DELETE
/api/v1/attendance/devices/:id
POST
/api/v1/attendance/devices/sync
============================================================
# SHIFT ENDPOINTS
GET
/api/v1/attendance/shifts
POST
/api/v1/attendance/shifts
PATCH
/api/v1/attendance/shifts/:id
DELETE
/api/v1/attendance/shifts/:id
============================================================
#  REPORT ENDPOINTS
GET
/api/v1/attendance/reports
GET
/api/v1/attendance/reports/export
============================================================
#  STANDARD API RESPONSE
Success
{
  "success": true,
  "message": "",
  "data": {}
}
Failure

{
  "success": false,
  "message": "",
  "errors": []
}
Every API in the Biometric Attendance Module must follow this response format.

===========================================================

#  BUSINESS WORKFLOW

The Biometric Attendance Module follows a structured workflow to ensure accurate attendance recording, validation, synchronization, reporting, and audit tracking.

Employee
↓
Biometric Device
↓
Attendance Synchronization
↓
Attendance Validation
↓
Shift Mapping
↓
Attendance Processing
↓
Late Arrival Calculation
↓
Early Exit Calculation
↓
Overtime Calculation
↓
Attendance Approval
↓
Reports
↓
Analytics
↓
Dashboard
============================================================

# MODULE FEATURES
The Biometric Attendance Module provides
✓ Attendance Dashboard
✓ Employee Attendance
✓ Biometric Device Management
✓ Shift Management
✓ Attendance Corrections
✓ Attendance Approval
✓ Attendance Synchronization
✓ Overtime Tracking
✓ Holiday Calendar
✓ Reports
✓ Search
✓ Filters
✓ Export
✓ Responsive Dashboard
============================================================

# ATTENDANCE DASHBOARD
Dashboard shall display
• Today's Attendance
• Present Employees
• Absent Employees
• Late Arrivals
• Early Exits
• Employees on Leave
• Employees on Holiday
• Active Devices
• Attendance Trends
• Weekly Statistics
• Monthly Statistics
• Quick Actions
============================================================

#  ATTENDANCE MANAGEMENT
Attendance Management includes
✓ Check-In Records
✓ Check-Out Records
✓ Daily Attendance
✓ Attendance Summary
✓ Manual Attendance Entry
✓ Attendance Verification
✓ Attendance Approval
✓ Attendance Locking
✓ Attendance History
============================================================

#  BIOMETRIC DEVICE MANAGEMENT
Device Management includes
✓ Register Device
✓ Edit Device
✓ Delete Device
✓ Device Status
✓ Device Synchronization
✓ Device Health Monitoring
✓ Last Sync Information
✓ Device Assignment
✓ Device Logs
============================================================
#  SHIFT MANAGEMENT
Shift Management includes
✓ Create Shift
✓ Edit Shift
✓ Delete Shift
✓ Shift Assignment
✓ Working Hours
✓ Break Hours
✓ Grace Time
✓ Weekly Off Configuration
✓ Shift Calendar
============================================================

#  ATTENDANCE CORRECTIONS

Attendance Corrections include
✓ Correction Request
✓ Missing Punch Request
✓ Manual Correction
✓ HR Review
✓ Manager Approval
✓ Correction History
✓ Audit Trail

============================================================

#  REPORT MANAGEMENT
Reports Module provides
✓ Daily Attendance Report
✓ Weekly Attendance Report
✓ Monthly Attendance Report
✓ Department Attendance Report
✓ Employee Attendance Report
✓ Overtime Report
✓ Late Arrival Report
✓ Early Exit Report
✓ Device Synchronization Report
✓ Attendance Summary Report
============================================================

#  ANALYTICS
Analytics Dashboard provides
✓ Attendance Percentage
✓ Monthly Trends
✓ Department Performance
✓ Late Arrival Trends
✓ Overtime Trends
✓ Device Performance
✓ Attendance Comparison
✓ Workforce Analytics
============================================================
# HISTORY MANAGEMENT
History Module maintains
✓ Attendance History
✓ Device History
✓ Shift History
✓ Correction History
✓ Approval History
✓ Audit History
✓ Synchronization Logs
============================================================
#  SEARCH & FILTERS
Every listing page should support
✓ Global Search
✓ Employee Filter
✓ Department Filter
✓ Device Filter
✓ Shift Filter
✓ Date Filter
✓ Status Filter
✓ Sorting
✓ Pagination
============================================================

#  STANDARD PAGE LAYOUT
Every page must contain
Page Header
↓
Breadcrumb
↓
Action Buttons
↓
Search
↓
Filters
↓
Summary Cards
↓
Table
↓
Pagination
↓
Footer
============================================================

#  BUSINESS RULES
• Every attendance record belongs to one organization.
• Every attendance record belongs to one employee.
• Every biometric device belongs to one organization.
• Every employee can have only one attendance record per working day.
• Attendance records cannot be duplicated.
• Deleted records should never appear in active reports.
• Organization data must remain isolated.
• Every attendance modification must be audited.
============================================================

#  DEVICE SYNCHRONIZATION WORKFLOW
Biometric Device
↓
Capture Attendance
↓
Device Synchronization
↓
Validate Employee
↓
Validate Shift
↓
Store Attendance
↓
Generate Attendance Record
↓
Update Dashboard
↓
Generate Reports
============================================================
#  ATTENDANCE APPROVAL WORKFLOW
Employee Attendance
↓
Attendance Validation
↓
Manager Review
↓
HR Approval
↓
Attendance Finalization
↓
Reports
↓
Analytics

============================================================

#  STANDARD API FLOW
Client
↓
Route
↓
Authentication
↓
Permission Check
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
↓
Response
============================================================
#  ERROR CODES
400
Bad Request
401
Unauthorized
403
Forbidden
404
Not Found
409
Conflict
422
Validation Failed
500
Internal Server Error
============================================================
#  PERMISSION MATRIX
attendance.view
attendance.create
attendance.update
attendance.delete
attendance.sync
attendance.approve
attendance.report
attendance.analytics
attendance.device.manage
attendance.shift.manage
attendance.settings

#  SECURITY CHECKLIST

□ Shared Authentication
□ Shared Permission Middleware
□ organization_id Scoping
□ Parameterized SQL
□ Transactions
□ Audit Logging
□ Validation
□ Error Handling
□ Secure API Responses

============================================================
#  TESTING CHECKLIST

Frontend
□ Dashboard
□ Attendance Records
□ Shift Management
□ Device Management
□ Reports
□ Responsive UI
□ Search
□ Filters
Backend
□ API Testing
□ Validation
□ Controllers
□ Services
□ Repositories
□ Device Sync APIs
Database
□ Tables
□ Constraints
□ Foreign Keys
□ Indexes
□ Transactions
Integration
□ Frontend Connected
□ Backend Connected
□ Database Connected
□ Device Sync Verified
□ API Responses Verified

============================================================
#  FINAL OBJECTIVE

The Biometric Attendance Module shall provide a centralized, secure, scalable, and enterprise-ready attendance management platform capable of handling biometric attendance, shift management, attendance approvals, overtime tracking, reporting, analytics, and complete audit history while integrating seamlessly with the WisWits ERP ecosystem.

============================================================

