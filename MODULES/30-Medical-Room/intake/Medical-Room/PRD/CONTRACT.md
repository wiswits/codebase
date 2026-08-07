# ============================================================
# WisWits ERP
# Medical Room Module Engineering Contract
# ============================================================

Module Name      : Medical Room
Functional Lane  : Lane A – Core Administration
Organization     : WisWits Edutech Pvt. Ltd.
Priority         : High
Version          : 1.0
Development Type : Fresh Development (Build From Zero)
Architecture     : Enterprise Multi-Tenant SaaS

============================================================

# MODULE OVERVIEW

Module Name
Medical Room

Category
Core Administration

Purpose

The Medical Room Module serves as the centralized healthcare and first-aid management system of the WisWits ERP platform.
The module is responsible for maintaining student, employee, and visitor medical records, recording medical visits, managing treatments, prescriptions, medicine inventory, emergency cases, and healthcare reports while maintaining complete audit history and organization-level isolation.

The system enables institutions to efficiently manage day-to-day healthcare activities inside the campus through a secure and centralized platform.

============================================================

# BUSINESS OBJECTIVE

The objective of this module is to digitize the complete Medical Room operations and eliminate manual medical registers.

The module enables

✓ Student Medical Records
✓ Employee Medical Records
✓ Visitor Medical Records
✓ Medical Check-In
✓ Medical Check-Out
✓ First Aid Management
✓ Patient Visit Management
✓ Prescription Management
✓ Medicine Inventory
✓ Medicine Stock Management
✓ Emergency Case Management
✓ Follow-Up Management
✓ Health Reports
✓ Medical Analytics
✓ Medical History

The system should improve healthcare management, record keeping, transparency, and reporting.

============================================================

# BUSINESS SCOPE

The Medical Room Module includes

Medical Dashboard
↓
Patient Registration
↓
Medical Visits
↓
Medical Examination
↓
Diagnosis
↓
Prescription Management
↓
Medicine Inventory
↓
Medicine Dispensing
↓
Emergency Cases
↓
Follow-Up Visits
↓
Medical Reports
↓
Medical Analytics
↓
Medical History
↓
Dashboard

------------------------------------------------------------
# MODULE VISION

Develop a professional,
Enterprise-grade,
Secure,
Scalable,
API-driven,
Multi-tenant
Medical Room Management Module that integrates seamlessly into the WisWits ERP platform.

The module should support
Students
Employees
Visitors
Medical Staff
Multiple Organizations
Multiple Campuses
Medicine Inventory
Emergency Cases
Future Digital Prescriptions
Future Hospital Integration
Future Health Card Integration

============================================================

# SIR'S MANDATORY INTEGRATION REMARKS

The following engineering standards are mandatory.
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
requirePermission("medical:view")
requirePermission("medical:create")
requirePermission("medical:update")
requirePermission("medical:inventory")
requirePermission("medical:report")
Permission values shall be managed centrally.

------------------------------------------------------------
Audit Logging

Every mutation must trigger
audit()
Create
Update
Delete
Medicine Issue
Medicine Restock
Prescription
Emergency Case
Follow-Up
must generate audit events.

------------------------------------------------------------
Database Migrations
Migration Naming
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
• Enterprise Multi-Tenant SaaS
• REST APIs
• Layered Architecture
• Repository Pattern
• Service Pattern
• Controller Pattern

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

===========================================================
# ARCHITECTURE OVERVIEW
                Next.js App Router

                        │
                        ▼
                  REST API Layer
                        │
                        ▼
              Express.js Application
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
 Controllers       Services        Validators
                        │
                        ▼
                  Repositories
                        │
                        ▼
                 MariaDB Database
============================================================

# BUSINESS WORKFLOW
Patient Visit
↓
Medical Registration
↓
Medical Examination
↓
Diagnosis
↓
Prescription
↓
Medicine Dispensing
↓
Follow-Up
↓
Medical Reports
↓
Medical Analytics
↓
Dashboard
============================================================

# PRIMARY USERS
Super Administrator
Organization Administrator
Medical Officer
School Nurse
Doctor
Reception Staff
HR Manager
Students
Employees
Visitors

============================================================

# HIGH LEVEL PERMISSIONS
medical.view
medical.create
medical.update
medical.delete
medical.prescription
medical.inventory
medical.dispense
medical.report
medical.analytics
medical.settings
medical.emergency
medical.followup

=======================================================

#  DEVELOPMENT TEAM
| Developer | Role | Responsibility | Technology Stack |
|------------|------|----------------|------------------|
| **Ankit** | Frontend Developer 1 | Dashboard, Analytics, Inventory Dashboard, Shared Components, Charts | Next.js, React, TypeScript, Tailwind CSS |
| **Sunidhi** | Frontend Developer 2 | Patient Records, Medical Visits, Prescriptions, Medicine Inventory, Reports, Forms | Next.js, React, TypeScript, Tailwind CSS |
| **Jatin** | Backend Developer 1 | Controllers, Routes, REST APIs, Validation | Node.js, Express.js, TypeScript |
| **Neha** | Backend Developer 2 | Services, Repositories, Business Logic, SQL Queries | Node.js, Express.js, TypeScript |
| **Khushboo** | Database Engineer & Integration Lead | MariaDB Schema, Integration, Testing, Documentation, Final Assembly | MariaDB, SQL, Git |
============================================================
# FRONTEND RESPONSIBILITIES
------------------------------------------------------------
ANKIT
------------------------------------------------------------
Primary Responsibility
Medical Dashboard
Summary Cards
Analytics
Charts
Medical Statistics
Medicine Stock Dashboard
Quick Actions
Recent Medical Visits
Emergency Summary
Inventory Overview
Low Stock Alerts
Responsive Layout
Shared Components
------------------------------------------------------------
Owned Pages
Dashboard
Analytics
Overview
============================================================
------------------------------------------------------------
SUNITDHI
------------------------------------------------------------
Primary Responsibility
Patient Management
Medical Visits
Medical Records
Prescriptions
Medicine Inventory
Medicine Issue
Medicine Stock
Emergency Cases
Follow-Up Visits
Reports
History
Settings
Search
Filters
Dialogs
Responsive Tables

------------------------------------------------------------
Owned Pages
Patients
Medical Visits
Prescriptions
Inventory
Emergency
Reports
History
Settings
============================================================
 # BACKEND RESPONSIBILITIES
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
------------------------------------------------------------
NEHA
------------------------------------------------------------
Responsible For
Business Logic
Services
Repositories
Parameterized SQL
Transactions
Medicine Inventory Logic
Prescription Workflow
Emergency Workflow
udit Integration

============================================================

# DATABASE & INTEGRATION RESPONSIBILITIES
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
# FRONTEND STRUCTURE

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

===========================================================
#  APP ROUTER STRUCTURE

app/
│
├── layout.tsx
├── page.tsx
│
├── medical-room/



├── dashboard/
│      page.tsx
├── patients/
│      page.tsx

├── visits/
│      page.tsx

├── prescriptions/
│      page.tsx

├── inventory/
│      page.tsx

├── medicines/
│      page.tsx

├── emergency/
│      page.tsx

├── follow-ups/
│      page.tsx

├── reports/
│      page.tsx

├── analytics/
│      page.tsx

├── history/
│      page.tsx

├── settings/
│      page.tsx

└── [patientId]/

       ├── page.tsx

       └── edit/

              page.tsx

============================================================
#  COMPONENT STRUCTURE

src/
└── components/
│
├── dashboard/
├── patients/
├── visits/
├── prescriptions/
├── inventory/
├── medicines/
├── emergency/
├── follow-ups/
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
MedicalDashboard.tsx
MedicalSummary.tsx
MedicalStatistics.tsx
MedicineStockChart.tsx
PatientVisitChart.tsx
EmergencyStatistics.tsx
InventorySummary.tsx
QuickActions.tsx
RecentActivities.tsx
StatusCards.tsx
------------------------------------------------------------

src/components/analytics/
MedicalAnalytics.tsx
HealthAnalytics.tsx
MedicineUsageChart.tsx
MonthlyVisitChart.tsx
InventoryAnalytics.tsx
============================================================
#  SUNIDHI FOLDER OWNERSHIP

src/components/patients/
PatientTable.tsx
PatientForm.tsx
PatientDetails.tsx
PatientSearch.tsx
PatientStatus.tsx
------------------------------------------------------------

src/components/visits/
MedicalVisitTable.tsx
MedicalVisitForm.tsx
MedicalVisitDetails.tsx
------------------------------------------------------------

src/components/prescriptions/
PrescriptionTable.tsx
PrescriptionForm.tsx
PrescriptionDetails.tsx
------------------------------------------------------------

src/components/inventory/
MedicineTable.tsx
MedicineForm.tsx
MedicineIssue.tsx
MedicineStock.tsx
------------------------------------------------------------

src/components/emergency/
EmergencyCaseTable.tsx
EmergencyForm.tsx
EmergencyDetails.tsx
------------------------------------------------------------

src/components/reports/
MedicalReport.tsx
ExportMedicalReport.tsx
------------------------------------------------------------

src/components/history/
MedicalHistory.tsx
MedicalTimeline.tsx
============================================================

# SHARED COMPONENTS

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

# HOOKS

src/hooks/
usePatients.ts
useMedicalVisits.ts
usePrescriptions.ts
useInventory.ts
useDashboard.ts
useAnalytics.ts
useReports.ts
usePagination.ts
============================================================

# SERVICES

src/services/
patients.api.ts
medical-visits.api.ts
prescriptions.api.ts
inventory.api.ts
dashboard.api.ts
analytics.api.ts
reports.api.ts
api-client.ts
============================================================

# TYPES

src/types/
patient.types.ts
medical.types.ts
prescription.types.ts
inventory.types.ts
analytics.types.ts
dashboard.types.ts
report.types.ts
api.types.ts
============================================================

# UTILITIES
src/utils/
date.ts
formatter.ts
helpers.ts
validators.ts
inventory.ts
permissions.ts
constants.ts
============================================================
# BACKEND STRUCTURE

backend/
│
├── src/
├── tests/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── server.ts

===========================================================
# BACKEND SOURCE STRUCTURE

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

# MODULE STRUCTURE

modules/
└── medical-room/
        │
        ├── controllers/
        ├── routes/
        ├── services/
        ├── repositories/
        ├── validators/
        ├── middleware/
        ├── constants/
        ├── types/
        └── utils/

Every Medical Room feature must remain inside this module.
Never place business logic outside the module.

============================================================

# CONTROLLERS

controllers/
│
├── dashboard.controller.ts
├── patient.controller.ts
├── visit.controller.ts
├── prescription.controller.ts
├── medicine.controller.ts
├── inventory.controller.ts
├── emergency.controller.ts
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

# ROUTES

routes/
│
├── dashboard.routes.ts
├── patient.routes.ts
├── visit.routes.ts
├── prescription.routes.ts
├── medicine.routes.ts
├── inventory.routes.ts
├── emergency.routes.ts
├── report.routes.ts
├── analytics.routes.ts
├── history.routes.ts
├── settings.routes.ts
└── index.ts

------------------------------------------------------------

Routes are responsible for
✓ API Mapping
✓ Authentication Middleware
✓ Permission Middleware
✓ Validation Middleware
✓ Controller Mapping

============================================================

# SERVICES

services/
│
├── dashboard.service.ts
├── patient.service.ts
├── visit.service.ts
├── prescription.service.ts
├── medicine.service.ts
├── inventory.service.ts
├── emergency.service.ts
├── report.service.ts
├── analytics.service.ts
├── history.service.ts
└── settings.service.ts
------------------------------------------------------------

Service Responsibilities

✓ Business Logic
✓ Patient Management
✓ Medical Visits
✓ Prescription Workflow
✓ Medicine Inventory
✓ Emergency Handling
✓ Audit Calls
✓ Transactions

Services must NOT contain SQL.

============================================================
# REPOSITORIES

repositories/
│
├── dashboard.repository.ts
├── patient.repository.ts
├── visit.repository.ts
├── prescription.repository.ts
├── medicine.repository.ts
├── inventory.repository.ts
├── emergency.repository.ts
├── report.repository.ts
├── analytics.repository.ts
├── history.repository.ts
└── settings.repository.ts
------------------------------------------------------------

Repository Responsibilities
✓ CRUD Operations
✓ Parameterized SQL
✓ Database Transactions
✓ Data Retrieval
✓ Data Persistence
Repositories must never contain business logic.

============================================================
# VALIDATORS

validators/
│
├── patient.validator.ts
├── visit.validator.ts
├── prescription.validator.ts
├── medicine.validator.ts
├── inventory.validator.ts
├── emergency.validator.ts
├── report.validator.ts
├── analytics.validator.ts
└── settings.validator.ts
------------------------------------------------------------
Validation Includes

✓ Required Fields
✓ Patient Validation
✓ Medicine Validation
✓ Prescription Validation
✓ Inventory Validation
✓ Date Validation
✓ Organization Validation
============================================================
# MIDDLEWARE

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
# CONFIGURATION

config/
│
├── environment.ts
├── database.ts
├── logger.ts
├── permissions.ts
└── constants.ts
===========================================================
# TYPES

types/
│
├── patient.types.ts
├── visit.types.ts
├── prescription.types.ts
├── medicine.types.ts
├── inventory.types.ts
├── emergency.types.ts
├── report.types.ts
├── analytics.types.ts
└── api.types.ts
============================================================
# CONSTANTS

constants/
│
├── permissions.ts
├── medicines.ts
├── inventory.ts
├── patient-status.ts
├── emergency.ts
├── messages.ts
└── settings.ts
============================================================
# UTILITIES

utils/
│
├── formatter.ts
├── pagination.ts
├── helpers.ts
├── validators.ts
├── inventory.ts
├── export.ts
└── date.ts
============================================================
# BACKEND CODING FLOW

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
# SCHEMA FILES

schema/
│
├── client_medical_patients.sql
├── client_medical_visits.sql
├── client_prescriptions.sql
├── client_medicines.sql
├── client_medicine_inventory.sql
├── client_emergency_cases.sql
├── client_followups.sql
├── client_medical_reports.sql
├── client_medical_history.sql
└── client_medical_analytics.sql

===========================================================
# MIGRATIONS

migrations/
│
├── 001_create_patients.sql
├── 002_create_medical_visits.sql
├── 003_create_prescriptions.sql
├── 004_create_medicines.sql
├── 005_create_inventory.sql
├── 006_create_emergency_cases.sql
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
├── medicine_categories.seed.sql
├── default_medicines.seed.sql
├── permissions.seed.sql
├── emergency_levels.seed.sql
└── default_settings.seed.sql
============================================================
# INDEXES

indexes/
│
├── patient_indexes.sql
├── medicine_indexes.sql
├── inventory_indexes.sql
├── emergency_indexes.sql
└── report_indexes.sql
============================================================

# DATABASE VIEWS

views/

├── medical_dashboard.sql
├── inventory_summary.sql
├── patient_history.sql
├── medicine_stock.sql
└── emergency_summary.sql
============================================================
# STORED PROCEDURES

procedures/
│
├── issue_medicine.sql
├── update_inventory.sql
├── create_prescription.sql
├── register_visit.sql
└── generate_medical_report.sql
============================================================
# DATABASE FUNCTIONS

functions/
│
├── available_stock.sql
├── medicine_expiry.sql
├── patient_visit_count.sql
├── inventory_value.sql
└── emergency_priority.sql
============================================================
# DATABASE TRIGGERS

triggers/
│
├── inventory_audit.sql
├── patient_audit.sql
├── prescription_audit.sql
├── emergency_audit.sql
└── medicine_audit.sql
============================================================
# DOCUMENTATION

documentation/
│
├── er_diagram.md
├── table_relationships.md
├── api_reference.md
├── migration_guide.md
├── indexes.md
└── permissions.md
============================================================
# MAIN DATABASE TABLES
client_medical_patients
client_medical_visits
client_prescriptions
client_medicines
client_medicine_inventory
client_emergency_cases
client_followups
client_medical_reports
client_medical_history
client_medical_analytics
============================================================
# DATABASE STANDARDS

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
# DATABASE SECURITY

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

/api/v1/medical-room

============================================================
# API MODULES
Dashboard
Patients
Medical Visits
Prescriptions
Medicines
Inventory
Emergency Cases
Reports
Analytics
History
Settings
============================================================
# DASHBOARD ENDPOINTS
GET
/api/v1/medical-room/dashboard
GET
/api/v1/medical-room/dashboard/summary
============================================================
# PATIENT ENDPOINTS
GET
/api/v1/medical-room/patients
POST
/api/v1/medical-room/patients
GET
/api/v1/medical-room/patients/:id
PATCH
/api/v1/medical-room/patients/:id
DELETE
/api/v1/medical-room/patients/:id
============================================================
# MEDICAL VISIT ENDPOINTS
GET
/api/v1/medical-room/visits
POST
/api/v1/medical-room/visits
PATCH
/api/v1/medical-room/visits/:id
DELETE
/api/v1/medical-room/visits/:id
============================================================
# INVENTORY ENDPOINTS
GET
/api/v1/medical-room/inventory
POST
/api/v1/medical-room/inventory
PATCH
/api/v1/medical-room/inventory/:id
DELETE
/api/v1/medical-room/inventory/:id
============================================================
# REPORT ENDPOINTS
GET
/api/v1/medical-room/reports
GET
/api/v1/medical-room/reports/export
============================================================
# STANDARD API RESPONSE
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
Every API in the Medical Room Module must follow this response format.

===========================================================
# BUSINESS WORKFLOW
The Medical Room Module follows a structured workflow to ensure proper medical care, treatment recording, medicine management, emergency response, reporting, and audit tracking.

Patient
↓
Medical Registration
↓
Medical Examination
↓
Diagnosis
↓
Prescription
↓
Medicine Dispensing
↓
Follow-Up
↓
Medical Reports
↓
Medical Analytics
↓
Dashboard
============================================================
# MODULE FEATURES

The Medical Room Module provides
✓ Medical Dashboard
✓ Student Medical Records
✓ Employee Medical Records
✓ Visitor Medical Records
✓ Patient Registration
✓ Medical Visits
✓ Diagnosis Management
✓ Prescription Management
✓ Medicine Inventory
✓ Medicine Stock Monitoring
✓ Medicine Dispensing
✓ Emergency Case Management
✓ Follow-Up Management
✓ Medical Reports
✓ Medical Analytics
✓ Medical History
✓ Search
✓ Filters
✓ Export
✓ Responsive Dashboard
============================================================

# MEDICAL DASHBOARD

Dashboard shall display
• Total Patients Today
• Student Visits
• Employee Visits
• Visitor Visits
• Emergency Cases
• Medicines Issued Today
• Low Stock Medicines
• Expiring Medicines
• Monthly Medical Visits
• Recent Activities
• Quick Actions
• Medical Statistics
============================================================
# PATIENT MANAGEMENT

Patient Management includes

✓ Register Patient
✓ View Patient
✓ Update Patient
✓ Delete Patient
✓ Medical History
✓ Search Patient
✓ Filter Patients
✓ Patient Timeline
✓ Visit History

============================================================

# MEDICAL VISIT MANAGEMENT

Medical Visit Management includes

✓ Medical Examination
✓ Symptoms Recording
✓ Diagnosis
✓ Vital Signs
✓ Treatment Details
✓ Doctor Notes
✓ Follow-Up Recommendation
✓ Medical Visit History
============================================================

# PRESCRIPTION MANAGEMENT

Prescription Module includes

✓ Create Prescription
✓ Edit Prescription
✓ Medicine Selection
✓ Dosage Management
✓ Frequency
✓ Duration
✓ Prescription History
✓ Download Prescription
============================================================

# MEDICINE INVENTORY

Inventory Module includes

✓ Medicine Registration
✓ Medicine Categories
✓ Stock Entry
✓ Stock Update
✓ Medicine Issue
✓ Medicine Return
✓ Batch Management
✓ Expiry Tracking
✓ Low Stock Alerts
✓ Inventory History
============================================================

# EMERGENCY MANAGEMENT

Emergency Module includes

✓ Emergency Registration
✓ Emergency Treatment
✓ Emergency Contact
✓ Referral Management
✓ Ambulance Information
✓ Critical Case Tracking
✓ Emergency History
============================================================

# FOLLOW-UP MANAGEMENT

Follow-Up Module includes
✓ Schedule Follow-Up
✓ View Follow-Up
✓ Update Follow-Up
✓ Reminder Tracking
✓ Follow-Up Status
✓ Follow-Up History
============================================================

# REPORT MANAGEMENT

Reports Module provides
✓ Daily Medical Report
✓ Monthly Medical Report
✓ Medicine Usage Report
✓ Medicine Stock Report
✓ Patient Visit Report
✓ Emergency Report
✓ Inventory Report
✓ Prescription Report
✓ Export Reports
============================================================

#. ANALYTICS

Analytics Dashboard provides

✓ Patient Statistics
✓ Medical Visit Trends
✓ Medicine Consumption
✓ Inventory Analysis
✓ Emergency Analysis
✓ Follow-Up Statistics
✓ Department-wise Reports
✓ Monthly Analytics
============================================================

#  HISTORY MANAGEMENT

History Module maintains

✓ Patient History
✓ Medical Visit History
✓ Prescription History
✓ Inventory History
✓ Emergency History
✓ Follow-Up History
✓ Audit History

============================================================

# SEARCH & FILTERS

Every listing page should support

✓ Global Search
✓ Patient Filter
✓ Doctor Filter
✓ Medicine Filter
✓ Date Filter
✓ Emergency Filter
✓ Status Filter
✓ Sorting
✓ Pagination

============================================================
# STANDARD PAGE LAYOUT

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

===========================================================
# BUSINESS RULES

• Every patient record belongs to one organization.
• Every medical visit belongs to one patient.
• Every prescription belongs to one medical visit.
• Medicines cannot be issued if stock is unavailable.
• Expired medicines cannot be dispensed.
• Emergency cases must be recorded immediately.
• Deleted records should never appear in reports.
• Organization data must remain isolated.
• Every medical action must be audited.
============================================================
# MEDICAL WORKFLOW

Patient Registration
↓
Medical Examination
↓
Diagnosis
↓
Prescription
↓
Medicine Dispensing
↓
Treatment Completed
↓
Follow-Up
↓
Medical History

============================================================

#  INVENTORY WORKFLOW
Medicine Purchase
↓
Stock Entry
↓
Medicine Storage
↓
Medicine Issue
↓
Stock Update
↓
Low Stock Detection
↓
Restocking
↓
Inventory Report
============================================================
# STANDARD API FLOW

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

# STANDARD RESPONSE FORMAT
Success
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
------------------------------------------------------------
Failure
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
============================================================
# ERROR CODES
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
# PERMISSION MATRIX
medical.view
medical.create
medical.update
medical.delete
medical.inventory
medical.prescription
medical.emergency
medical.report
medical.analytics
medical.settings

# SECURITY & TESTING CHECKLIST

Security
□ Shared Authentication
□ Shared Permission Middleware
□ organization_id Scoping
□ Parameterized SQL
□ Transactions
□ Audit Logging
□ Validation
□ Secure API Responses

------------------------------------------------------------
Testing

Frontend
□ Dashboard
□ Patients
□ Medical Visits
□ Prescriptions
□ Inventory
□ Emergency Cases
□ Reports
□ Responsive UI

Backend
□ APIs
□ Validation
□ Controllers
□ Services
□ Repositories
□ Transactions

Database
□ Tables
□ Foreign Keys
□ Constraints
□ Indexes

Integration
□ Frontend Connected
□ Backend Connected
□ Database Connected
□ APIs Verified
□ Reports Verified

============================================================
# FINAL OBJECTIVE
The Medical Room Module shall provide a centralized, secure, scalable, and enterprise-ready healthcare management platform capable of managing patient records, medical visits, prescriptions, medicine inventory, emergency cases, follow-up treatments, reporting, analytics, and complete audit history while integrating seamlessly with the WisWits ERP ecosystem.
=====================================================
