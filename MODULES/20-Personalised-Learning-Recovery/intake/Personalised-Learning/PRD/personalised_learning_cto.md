# Personalised Learning
# CTO Technical Specification
---
# Document Information

| Field | Value |
|-------|-------|
| Product | WisWits SaaS Platform |
| Module | Personalised Learning |
| Module Code | PLM |
| Document Type | CTO Technical Specification |
| Version | 1.0 |
| Status | Draft |
| Architecture Version | WisWits Engineering Standard v1 |

# Purpose

This document defines the technical architecture, engineering standards, migration strategy, and implementation guidelines for the Personalised Learning module.

It complements the Product Requirements Document (PRD) by defining how the module shall be engineered while ensuring alignment with the WisWits SaaS Platform architecture.

---

# Relationship with Other Documents

| Document | Purpose |
|----------|---------|
| module_analysis.md | Existing implementation analysis |
| personalised_learning_prd.md | Business requirements |
| personalised_learning_cto.md | Technical architecture |
| personalised_learning_engineering.md | Engineering execution |

---

# 1. Engineering Objectives

The implementation of the Personalised Learning module shall:

- Align with WisWits platform architecture.
- Reuse shared platform services.
- Support multi-tenant deployment.
- Deliver intelligent adaptive learning workflows.
- Support scalable recommendation engines.
- Enable analytics-driven academic interventions.
- Follow WisWits engineering standards.
- Minimize technical debt.
- Support future AI integrations.

---

# 2. Existing Technical Analysis

The existing Personalised Learning module provides an advanced adaptive learning solution but differs from WisWits platform standards in several architectural areas.

---

## Frontend

Current implementation uses:

- React
- Vite
- JavaScript (JSX)
- React Context
- Custom visualization components

### Strengths

- Multi-role dashboards
- Rich analytics UI
- Modular components
- Interactive charts
- Adaptive learning workflows

### Limitations

- Uses JavaScript instead of TypeScript.
- Uses Vite instead of Next.js.
- No WisWits Design System.
- No shared layouts.
- Limited reusable component library.

---

## Backend

Current implementation uses:

- Node.js
- Express.js
- REST APIs
- Algorithm Engine
- Learning Analytics Engine
- Local middleware

### Strengths

- Advanced adaptive learning algorithms
- Modular APIs
- Analytics engine
- Recommendation workflows
- External curriculum adapters

### Limitations

- Local authentication middleware.
- Local authorization logic.
- No repository-service layered architecture.
- No centralized audit service.
- No shared notification service.
- Direct database integration.

---

## Database

Current implementation provides:

- Learning Profiles
- Assessments
- Weak Areas
- Recommendations
- Recovery Cycles
- Assignments
- Worksheets
- Behaviour Analytics

### Strengths

- Rich adaptive learning schema
- Historical analytics
- Recommendation support
- Learning history

### Limitations

- No shared query abstraction.
- Requires WisWits multi-tenant migration.
- Needs standardized schema conventions.

---

# 3. Platform Gap Assessment

| Engineering Area | Existing Module | WisWits Standard | Required Action |
|------------------|----------------|-------------------|-----------------|
| Frontend Framework | React + Vite | Next.js App Router | Rebuild |
| Language | JavaScript | TypeScript | Migrate |
| Routing | React Router | App Router | Replace |
| Authentication | Local Middleware | Shared authenticate() | Replace |
| Authorization | Local Permission Logic | Platform RBAC | Integrate |
| Audit Logging | Limited | Shared Audit Service | Integrate |
| Notifications | Local Alerts | Shared Notification Service | Integrate |
| Database Access | Direct SQL | Shared query() / withTransaction() | Replace |
| Layout | Local Layout | Shared WisWits Layout | Replace |

---

# 4. Target Platform Architecture

The Personalised Learning module shall be implemented as a native WisWits platform module.

```text
WisWits Platform

│

├── Web Application (Next.js)

│      │

│      ├── Personalised Learning

│      ├── Student Management

│      ├── Exam Cell

│      ├── Coaching

│      └── Shared Components

│

├── Backend Services

│      │

│      ├── Learning Service

│      ├── Recommendation Engine

│      ├── Analytics Service

│      ├── Notification Service

│      ├── Audit Service

│      └── Reporting Service

│

└── MariaDB
```

The module shall consume shared platform services instead of implementing duplicate capabilities.

---

# 5. Approved Technology Stack

## Frontend

| Component | Standard |
|-----------|----------|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Forms | React Hook Form |
| Validation | Zod |
| HTTP Client | Shared API Client |

---

## Backend

| Component | Standard |
|-----------|----------|
| Runtime | Node.js |
| Framework | Express.js |
| Architecture | Layered Architecture |
| API Style | REST |
| Validation | Shared Validation Middleware |
| Authentication | Shared authenticate() |
| Authorization | requirePermission() |
| Audit | Shared Audit Service |

---

## Database

| Component | Standard |
|-----------|----------|
| Database | MariaDB |
| Query Layer | Shared query() |
| Transactions | withTransaction() |
| Migration Framework | Platform Migration Standard |

---

# 6. Engineering Principles

The module shall follow these engineering principles:

- Platform First
- Security by Default
- Multi-Tenant Architecture
- Reusability
- Contract-First Development
- Layered Architecture
- Scalability
- Maintainability
- Testability
- AI-Ready Architecture

---

# 7. Module Architecture Overview

The Personalised Learning module shall adopt a layered architecture.

```text
Presentation Layer

↓

Routing Layer

↓

Authentication Middleware

↓

Authorization Middleware

↓

Validation Middleware

↓

Controller Layer

↓

Service Layer

↓

Recommendation Engine

↓

Analytics Engine

↓

Repository Layer

↓

Database Layer

↓

MariaDB
```

Each layer shall have a clearly defined responsibility.

The Recommendation Engine and Analytics Engine shall remain independent business services to support future AI enhancements.

---

# 8. Recommended Repository Structure

```text
apps/

├── web/

│   └── src/

│       └── modules/

│           └── personalised-learning/

│               ├── components/
│               ├── pages/
│               ├── hooks/
│               ├── services/
│               ├── api/
│               ├── types/
│               ├── validations/
│               ├── utils/
│               ├── constants/
│               └── index.ts

└── backend/

    └── src/

        └── modules/

            └── personalised-learning/

                ├── controllers/
                ├── services/
                ├── engines/
                │     ├── recommendation/
                │     ├── analytics/
                │     ├── recovery/
                │     └── insights/
                ├── repositories/
                ├── routes/
                ├── validators/
                ├── middleware/
                └── migrations/
```

---

# 9. Coding Standards

The Personalised Learning module shall comply with WisWits Engineering Standards.

Mandatory requirements include:

- Layered architecture
- Modular file organization
- TypeScript for frontend and backend
- Parameterized SQL queries
- Shared authentication middleware
- Shared authorization middleware
- Audit logging for every business mutation
- Shared notification service
- Shared database utilities
- WisWits Design System
- Comprehensive validation
- Reusable services and components
- Independent recommendation and analytics engines

No module shall duplicate shared platform functionality where an approved platform service already exists.
# 10. Backend Architecture Overview

The Personalised Learning module shall follow the WisWits Backend Engineering Standard based on a layered architecture.

The backend shall support adaptive learning, recommendation generation, learning analytics, assessments, recovery planning, reporting, and platform integrations while ensuring scalability, maintainability, and security.

---

## Backend Design Principles

The backend implementation shall:

- Follow layered architecture.
- Keep controllers lightweight.
- Place business logic inside services.
- Isolate database access through repositories.
- Separate AI and analytics engines from business services.
- Support transaction-safe academic workflows.
- Maintain organization isolation.
- Generate audit logs for business mutations.
- Follow contract-first API development.

---

# 11. Backend Layered Architecture

The backend shall follow the architecture below.

```text
HTTP Request

↓

Routes

↓

Authentication Middleware

↓

Authorization Middleware

↓

Validation Middleware

↓

Controller

↓

Service

↓

Recommendation Engine

↓

Analytics Engine

↓

Repository

↓

Database

↓

Response
```

Each layer shall have a clearly defined responsibility.

---

# 12. Route Layer

The Route Layer shall:

- Register REST endpoints.
- Apply authentication middleware.
- Apply authorization middleware.
- Apply validation middleware.
- Forward requests to controllers.

Routes shall never contain business logic.

Example Structure

```text
routes/

learning-profile.routes.ts

recommendation.routes.ts

weak-area.routes.ts

root-cause.routes.ts

learning-plan.routes.ts

recovery.routes.ts

assignment.routes.ts

worksheet.routes.ts

assessment.routes.ts

analytics.routes.ts

report.routes.ts

notification.routes.ts
```

---

# 13. Authentication Standard

Authentication shall **NOT** be implemented inside the Personalised Learning module.

The module shall exclusively use the shared WisWits authentication middleware.

Approved Standard

```text
authenticate()
```

The middleware shall:

- Validate authenticated sessions.
- Resolve authenticated user.
- Resolve organization context.
- Populate request context.

Available request information

```text
req.user.id

req.user.org_id

req.user.role
```

The following are prohibited:

❌ jwt.verify()

❌ Authorization header parsing

❌ Bearer token parsing

❌ Custom authentication middleware

Authentication remains a platform responsibility.

---

# 14. Authorization Standard

Authorization shall follow the WisWits Role-Based Access Control (RBAC) model.

The module shall use:

```text
requirePermission()
```

Example permissions

```text
learning:view

learning:update

recommendation:generate

recommendation:approve

weak-area:view

recovery:manage

assignment:assign

worksheet:generate

assessment:view

analytics:view

report:view
```

Permission definitions shall remain within the platform permission catalog.

---

# 15. Controller Layer

Controllers shall:

- Receive requests.
- Validate request context.
- Call services.
- Return standardized API responses.

Controllers shall NOT:

- Execute SQL.
- Generate recommendations.
- Perform analytics.
- Calculate learning scores.
- Process recovery cycles.
- Send notifications directly.

Controllers should remain thin and stateless.

---

# 16. Service Layer

The Service Layer shall contain all business logic.

Responsibilities include:

- Learning profile management
- Assessment processing
- Assignment management
- Worksheet management
- Learning plan management
- Recovery cycle management
- Recommendation orchestration
- Analytics orchestration
- Report preparation
- Notification triggering
- Audit event generation

Services shall coordinate platform workflows while delegating specialized processing to the Recommendation and Analytics Engines.

---

# 17. Recommendation Engine

The Recommendation Engine shall remain an independent service.

Responsibilities include:

- Weak area evaluation
- Personalized learning recommendations
- Assignment recommendation
- Worksheet recommendation
- Learning path generation
- Difficulty adjustment
- Recovery planning
- Learning prioritization

The Recommendation Engine shall expose reusable interfaces for other WisWits academic modules.

---

# 18. Analytics Engine

The Analytics Engine shall provide advanced academic intelligence.

Responsibilities include:

- Learning progress calculation
- Concept mastery analysis
- Behaviour analytics
- Performance trend analysis
- Intervention effectiveness
- Student analytics
- Class analytics
- Institution analytics
- Predictive learning indicators

The Analytics Engine shall support future AI enhancements without affecting business services.

---

# 19. Repository Layer

Repositories shall encapsulate all database operations.

Responsibilities include:

- CRUD operations
- Search
- Filtering
- Pagination
- Assessment queries
- Recommendation queries
- Analytics queries
- Recovery queries
- Historical data retrieval
- Transaction support
- Query optimization

Repositories shall expose reusable methods to services.

Business rules shall never exist inside repositories.

---

# 20. Database Access Standard

The module shall NOT create database pools.

The following are prohibited:

❌ mysql.createPool()

❌ mysql.createConnection()

❌ Direct database initialization

Instead, repositories shall use the shared platform database utilities.

Approved Platform Utilities

```text
query()

withTransaction()
```

Benefits include:

- Shared connection pooling
- Transaction management
- Standardized error handling
- Platform monitoring

---

# 21. API Standards

All APIs shall follow WisWits REST conventions.

General Principles

- RESTful endpoints
- Predictable resource naming
- Standardized responses
- Consistent error handling
- Version-ready design

Example Resources

```text
/learning-profiles

/recommendations

/weak-areas

/root-causes

/learning-plans

/recovery-cycles

/assignments

/worksheets

/assessments

/analytics

/reports

/notifications
```

Supported Operations

- Create
- Read
- Update
- Delete
- Search
- Filter
- Pagination
- Export

---

# 22. Validation Standards

Every request shall be validated before entering business logic.

Validation shall include:

- Required fields
- Student existence
- Assessment validity
- Subject validation
- Recommendation eligibility
- Learning plan consistency
- Recovery plan validation
- Assignment eligibility
- Organization validation

Validation failures shall return standardized platform error responses.

---

# 23. Error Handling Strategy

The module shall use centralized platform error handling.

Errors shall be categorized as:

- Validation Errors
- Authentication Errors
- Authorization Errors
- Business Rule Violations
- Resource Not Found
- Conflict Errors
- Internal Server Errors

Controllers shall not implement custom error formatting.

---

# 24. Transaction Management

Business operations involving multiple database updates shall execute within platform-managed transactions.

Examples include:

- Assessment processing
- Recommendation generation
- Learning plan creation
- Recovery cycle creation
- Assignment generation
- Worksheet generation
- Progress updates
- Analytics aggregation

Transactions shall use:

```text
withTransaction()
```

Rollback shall occur automatically if any operation fails.

---

# 25. Audit Logging

Every business mutation shall generate an audit event.

Examples include:

- Learning profile created
- Recommendation generated
- Learning plan assigned
- Recovery cycle initiated
- Assignment assigned
- Worksheet generated
- Assessment completed
- Analytics generated

Approved Platform Function

```text
audit(
    req,
    "learning-plan.created",
    "learning_plan",
    learningPlanId
)
```

Audit logs shall capture:

- User
- Organization
- Timestamp
- Entity
- Action
- Entity Identifier

---

# 26. Notification Integration

The Personalised Learning module shall not send notifications directly.

Instead, it shall invoke the shared Notification Service.

Supported Channels

- In-App
- Email
- SMS
- Push Notifications (Future)

Examples include:

- New learning recommendation
- Assignment reminder
- Recovery plan notification
- Assessment reminder
- Progress milestone
- Parent progress update
- Teacher intervention alert

Notification templates shall remain configurable through the platform.

---

# 27. Backend Engineering Standards

All backend implementations shall comply with WisWits Engineering Standards.

### Security

- Shared authentication only
- Shared authorization only
- No credential handling inside the module

### Database

- Parameterized SQL only
- Shared database utilities
- Transaction-safe operations

### Code Quality

- Layered architecture
- Small services
- Reusable repositories
- Independent recommendation and analytics engines
- Consistent naming conventions

### Performance

- Optimized queries
- Proper indexing
- Pagination for large datasets
- Efficient analytics processing

### Platform Integration

- Shared Audit Service
- Shared Notification Service
- Shared Permission Catalog
- Shared Authentication
- Shared Database Layer
# 28. Database Architecture Overview

The Personalised Learning module shall adopt the WisWits Platform Database Architecture.

The database layer shall provide:

- Data integrity
- High performance
- Multi-tenant isolation
- Transaction consistency
- Scalable schema design
- AI-ready data structures
- Platform interoperability

MariaDB shall be the approved relational database management system.

---

# 29. Database Design Principles

The database shall follow WisWits engineering standards.

## Normalization

Data shall be normalized to reduce redundancy while maintaining efficient query performance.

---

## Referential Integrity

Relationships between learning profiles, assessments, recommendations, assignments, worksheets, recovery cycles, behaviour analytics, and reports shall be maintained using foreign keys where appropriate.

---

## Multi-Tenant Design

Every business entity shall belong to a single organization.

Every business table shall contain:

```text
org_id
```

Every business query shall be scoped using:

```sql
WHERE org_id = ?
```

Cross-organization access shall never be permitted.

---

## Auditability

Business entities shall integrate with the shared Audit Service.

Historical activity shall not be stored inside business tables.

---

## Scalability

The schema shall support:

- Multiple organizations
- Multiple campuses
- Millions of assessment records
- Large student populations
- AI model enhancements
- Future adaptive learning algorithms

---

# 30. Core Business Entities

The module shall maintain the following entities.

| Entity | Purpose |
|----------|----------|
| Learning Profile | Student learning record |
| Assessment | Assessment result |
| Assignment | Learning activity |
| Worksheet | Practice activity |
| Weak Area | Concept gap |
| Root Cause | Performance diagnosis |
| Learning Plan | Personalized roadmap |
| Recovery Cycle | Improvement workflow |
| Recommendation | AI recommendation |
| Learning Insight | Academic insight |
| Behaviour Record | Learning behaviour |
| Notification Reference | Notification linkage |
| Report | Analytics report |
| Audit Reference | Audit linkage |

---

# 31. Entity Relationships

The conceptual relationship model shall be:

```text
Organization

│

├── Students

│      │

│      ├── Learning Profiles

│      │        │

│      │        ├── Assessments

│      │        ├── Weak Areas

│      │        ├── Recommendations

│      │        ├── Learning Plans

│      │        │       │

│      │        │       ├── Assignments

│      │        │       ├── Worksheets

│      │        │       └── Recovery Cycles

│      │        │

│      │        ├── Behaviour Records

│      │        └── Learning Insights

│

└── Reports
```

Relationships shall enforce referential integrity while supporting efficient querying.

---

# 32. Table Standards

Every business table shall follow the WisWits database standard.

Required Columns

```text
id

org_id

created_at

updated_at

created_by

updated_by
```

Optional Columns

```text
deleted_at

deleted_by

status

remarks
```

Business tables shall use consistent naming conventions.

---

# 33. Naming Conventions

Database objects shall follow WisWits naming standards.

## Tables

```text
learning_profiles

assessments

assignments

worksheets

weak_areas

root_causes

learning_plans

recovery_cycles

recommendations

learning_insights

behaviour_records

reports
```

Plural snake_case naming shall be used.

---

## Primary Keys

```text
id
```

---

## Foreign Keys

```text
student_id

assessment_id

learning_plan_id

recommendation_id

assignment_id

worksheet_id

recovery_cycle_id

weak_area_id

root_cause_id
```

---

## Index Names

```text
idx_org_student

idx_assessment

idx_learning_plan

idx_assignment

idx_recommendation

idx_progress

idx_subject

idx_status
```

---

## Constraint Names

```text
fk_profile_student

fk_assessment_profile

fk_plan_profile

fk_assignment_plan

fk_worksheet_plan

fk_recovery_plan

fk_recommendation_profile
```

---

# 34. Indexing Strategy

Indexes shall optimize high-frequency queries.

Recommended indexes include:

- org_id
- student_id
- assessment_id
- learning_plan_id
- subject
- status
- recommendation_status
- created_at

Composite indexes may include:

```text
(org_id, student_id)

(org_id, subject)

(org_id, learning_plan_id)

(org_id, recommendation_status)

(org_id, created_at)
```

---

# 35. Transaction Strategy

The following operations shall execute within platform-managed transactions.

Examples include:

- Learning profile creation
- Assessment processing
- Recommendation generation
- Learning plan creation
- Assignment generation
- Worksheet generation
- Recovery cycle updates
- Progress synchronization

Transactions shall use:

```text
withTransaction()
```

Rollback shall occur automatically if any operation fails.

---

# 36. Migration Standards

Database schema changes shall use platform migration files.

Migration filenames shall follow:

```text
001_create_learning_profiles.sql

002_create_assessments.sql

003_create_weak_areas.sql

004_create_root_causes.sql

005_create_learning_plans.sql

006_create_recovery_cycles.sql

007_create_assignments.sql

008_create_worksheets.sql

009_create_recommendations.sql

010_create_learning_insights.sql

011_create_behaviour_records.sql

012_create_reports.sql
```

Migration Rules

✔ Sequential numbering

✔ Descriptive filenames

✔ Platform compatible

✔ Idempotent where possible

---

The following are prohibited.

❌

```sql
USE database_name;
```

❌ Hardcoded database selection

The platform migration runner determines the active database.

---

# 37. SQL Standards

All SQL shall comply with WisWits database standards.

Required

✔ Parameterized queries

✔ Prepared statements

✔ Shared `query()` utility

✔ Indexed searches

✔ Explicit column selection

---

Prohibited

❌ SELECT *

❌ String concatenated SQL

❌ Dynamic table names

❌ Inline credentials

Preferred Example

```sql
SELECT
    id,
    student_id,
    learning_score,
    mastery_level,
    status
FROM learning_profiles
WHERE org_id = ?
AND status = ?;
```

---

# 38. Data Integrity Rules

The database shall enforce:

- Primary Keys
- Foreign Keys
- Unique Constraints
- Required Fields
- Referential Integrity
- Valid Status Values

Business validation shall remain within the Service Layer.

Examples include:

- Every learning profile shall belong to one student.
- Every recommendation shall reference an existing learning profile.
- Recovery cycles shall only exist for active learning plans.
- Assessments shall belong to valid subjects.
- Learning scores shall remain within configured institutional limits.

---

# 39. Soft Delete Strategy

Business entities shall support soft deletion where appropriate.

Recommended columns

```text
deleted_at

deleted_by
```

Deleted records shall:

- Remain available for audit
- Be excluded from operational queries
- Support historical reporting

---

# 40. Backup & Recovery

The database architecture shall support:

- Automated backups
- Point-in-time recovery
- Disaster recovery
- Backup verification
- Secure backup storage

Backup policies shall be managed by the WisWits platform administration.

---

# 41. Performance Optimization

Database performance shall be optimized through:

- Proper indexing
- Efficient joins
- Query optimization
- Pagination
- Connection pooling
- Shared database utilities

Large assessment datasets, recommendation history, learning analytics, behaviour records, and institutional reports shall be continuously monitored and optimized.

---

# 42. Data Retention Strategy

The platform shall retain historical learning records according to institutional policies.

Historical information shall support:

- Learning history
- Assessment history
- Recommendation history
- Assignment history
- Recovery history
- Behaviour analytics
- Audit records
- Compliance requirements

Retention policies shall remain configurable where supported.

---

# 43. Database Security Standards

The database layer shall comply with the following standards.

✔ Organization isolation

✔ Parameterized SQL

✔ Shared database access

✔ Transaction management

✔ Least-privilege database access

✔ Audit support

✔ Secure credential management

Sensitive academic records, assessment results, learning recommendations, behaviour analytics, and personalized learning plans shall only be accessible through authorized business services.
# 44. Frontend Architecture Overview

The Personalised Learning module shall adopt the WisWits Frontend Architecture.

The frontend shall provide:

- Responsive adaptive learning interfaces
- Modular component architecture
- Reusable UI components
- Secure authenticated pages
- High-performance rendering
- Consistent user experience
- Accessibility compliance
- Rich analytics visualization

The frontend shall be implemented using **Next.js App Router** and the WisWits Design System.

---

# 45. Approved Frontend Technology Stack

| Component | Standard |
|-----------|----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI Library | React |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Forms | React Hook Form |
| Validation | Zod |
| Charts | Recharts |
| Data Fetching | Shared API Client |
| Notifications | Shared Toast Component |

No alternative frontend framework shall be used.

---

# 46. Frontend Project Structure

The module shall follow the standard WisWits frontend architecture.

```text
modules/

personalised-learning/

│

├── components/

├── pages/

├── hooks/

├── services/

├── api/

├── types/

├── validations/

├── utils/

├── constants/

└── index.ts
```

Every feature shall remain modular and reusable.

---

# 47. Next.js App Router

The module shall use the App Router architecture.

Example routing structure:

```text
app/

(dashboard)/

personalised-learning/

page.tsx

learning-profile/

page.tsx

learning-plans/

page.tsx

recommendations/

page.tsx

weak-areas/

page.tsx

root-causes/

page.tsx

recovery-cycles/

page.tsx

assignments/

page.tsx

worksheets/

page.tsx

assessments/

page.tsx

analytics/

page.tsx

reports/

page.tsx

parent-dashboard/

page.tsx

notifications/

page.tsx

settings/

page.tsx
```

React Router shall not be used.

---

# 48. Layout Architecture

The module shall use the shared WisWits Dashboard Layout.

Standard layout:

```text
Header

↓

Sidebar

↓

Breadcrumb

↓

Page Content

↓

Footer
```

The module shall not implement custom layouts unless approved by the platform team.

---

# 49. Component Architecture

The UI shall be composed using reusable components.

Core components include:

- Dashboard KPI Cards
- Learning Progress Cards
- Learning Profile Cards
- Recommendation Cards
- Weak Area Cards
- Root Cause Cards
- Recovery Cycle Cards
- Assignment Cards
- Worksheet Cards
- Assessment Cards
- Analytics Charts
- Heatmaps
- Learning Timeline
- Search Bar
- Filter Panel
- Pagination
- Status Badges
- Progress Indicators
- Confirmation Dialogs
- Toast Notifications
- Empty State
- Loading Skeleton

All components shall follow the WisWits Design System.

---

# 50. State Management

The frontend shall minimize unnecessary global state.

Recommended approach:

- Local component state
- React Context (shared platform contexts only)
- Shared API hooks
- URL-based filters where appropriate

Business data shall always be retrieved through platform APIs.

---

# 51. API Integration

The frontend shall never communicate directly with the database.

All communication shall occur through the shared API client.

Example API groups:

```text
Learning Profile API

Recommendation API

Weak Area API

Root Cause API

Learning Plan API

Recovery Cycle API

Assignment API

Worksheet API

Assessment API

Analytics API

Report API

Notification API
```

REST endpoints shall follow WisWits API conventions.

---

# 52. Forms & Validation

Forms shall use:

- React Hook Form
- Zod validation
- Shared form components
- Shared error components

Validation shall occur at:

- Client-side
- Server-side

Business rules shall always be validated by backend services.

---

# 53. Dashboard Design

The Personalised Learning Dashboard shall display:

- Overall Learning Score
- Learning Progress
- Weak Concepts
- Active Learning Plans
- Pending Assignments
- Upcoming Assessments
- Recovery Progress
- Recommendation Summary
- Recent Activities
- Notifications

Dashboard widgets shall be reusable.

---

# 54. Design System

The module shall adopt the WisWits Design System.

Standard UI elements include:

- Typography
- Color Palette
- Cards
- Buttons
- Forms
- Tables
- Modals
- Icons
- Alerts
- Charts
- Navigation
- Layout Components

Visual consistency shall be maintained across the platform.

---

# 55. Responsive Design

The frontend shall support:

- Desktop
- Laptop
- Tablet
- Mobile

Core workflows including learning plans, recommendations, assignments, worksheets, assessments, analytics, and reports shall remain fully functional across supported devices.

---

# 56. Accessibility Standards

The frontend shall comply with accessibility best practices.

Requirements include:

- Keyboard navigation
- Semantic HTML
- Screen reader compatibility
- Focus management
- High color contrast
- Accessible form labels
- Error announcements

---

# 57. Performance Strategy

Frontend performance shall be optimized through:

- Lazy loading
- Dynamic imports
- Code splitting
- Image optimization
- Memoization
- API caching where appropriate
- Optimized rendering

Large learning datasets, analytics dashboards, recommendation engines, historical assessments, and institutional reports shall support pagination and virtual scrolling where applicable.

---

# 58. Error Handling

The frontend shall display user-friendly error messages.

Examples include:

- Validation errors
- Network failures
- Unauthorized access
- Session expiration
- Missing learning data

Errors shall never expose internal implementation details.

---

# 59. Frontend Security

Frontend security shall follow WisWits platform standards.

Requirements include:

- Secure session handling
- Protected routes
- Shared authentication context
- Shared authorization checks
- CSRF protection (platform-managed)
- XSS prevention
- Secure API communication

Sensitive learning algorithms and recommendation logic shall never be implemented on the client.

---

# 60. Frontend Engineering Standards

The frontend shall comply with WisWits engineering standards.

### Architecture

- Component-based design
- Modular organization
- Reusable UI
- Shared layouts

---

### Code Quality

- TypeScript
- Strong typing
- Small reusable components
- Clear naming conventions

---

### Performance

- Lazy loading
- Efficient rendering
- Optimized API usage

---

### Platform Integration

- Shared Design System
- Shared API Client
- Shared Authentication
- Shared Notification Components
- Shared Layout Components
# 61. Security Architecture

The Personalised Learning module shall comply with the WisWits Platform Security Architecture.

Security shall be implemented through shared platform services rather than module-specific implementations.

---

## Authentication

Authentication shall be provided exclusively through the WisWits Authentication Service.

Approved Standard

✔ Shared authenticate()

The following are prohibited:

❌ jwt.verify()

❌ Authorization header parsing

❌ Custom authentication middleware

❌ Module-specific login implementation

Authenticated user information shall be available through:

```text
req.user.id

req.user.org_id

req.user.role
```

---

## Authorization

Authorization shall follow the WisWits Role-Based Access Control (RBAC) framework.

Approved Standard

```text
requirePermission()
```

Example permissions

```text
learning:view

learning:update

recommendation:generate

recommendation:approve

assessment:view

assignment:assign

worksheet:generate

analytics:view

report:view

settings:manage
```

Permission definitions shall remain centralized within the platform.

---

## Multi-Tenant Isolation

Every request shall operate within the authenticated organization.

Every database query shall include:

```sql
WHERE org_id = ?
```

Cross-organization data access shall never be permitted.

---

## Data Security

Sensitive academic information shall be protected through:

- Parameterized SQL queries
- Secure API communication
- Least-privilege access
- Server-side validation
- Shared audit logging
- Secure file references

Learning profiles, assessment results, recommendations, behaviour analytics, and intervention plans shall only be accessible to authorized users.

---

# 62. Performance Standards

The Personalised Learning module shall satisfy the following engineering expectations.

## Backend

- Optimized recommendation processing
- Efficient analytics calculations
- Optimized SQL queries
- Reduced database round trips
- High-performance assessment processing

---

## Frontend

- Lazy loading
- Optimized rendering
- Efficient API usage
- Responsive dashboards
- Reusable components

---

## Database

- Indexed searches
- Optimized joins
- Shared connection pooling
- Efficient historical analytics queries

---

# 63. Caching Strategy

Caching shall improve application performance without compromising learning accuracy.

Suitable caching candidates include:

- Learning configuration
- Subject metadata
- Curriculum mappings
- Recommendation templates
- Dashboard widgets
- Institution configuration

The following shall always retrieve real-time data:

- Assessment results
- Learning progress
- Weak area analysis
- Recommendations
- Recovery cycles
- Notifications

---

# 64. Logging & Monitoring

The module shall integrate with the WisWits monitoring framework.

Application logs shall include:

- API requests
- Recommendation generation
- Analytics execution
- Business events
- System errors
- Audit events

Monitoring shall support:

- Error tracking
- Performance monitoring
- Recommendation execution time
- Analytics execution time
- Database health
- API availability

---

# 65. Testing Strategy

Testing shall comply with WisWits Engineering Quality Standards.

## Unit Testing

Test:

- Recommendation Engine
- Analytics Engine
- Learning Services
- Validators
- Recovery logic
- Learning score calculations

---

## Integration Testing

Verify:

- API endpoints
- Authentication
- Authorization
- Database operations
- Transactions
- Recommendation workflows

---

## Frontend Testing

Verify:

- Components
- Forms
- Dashboards
- Charts
- Navigation
- Validation

---

## End-to-End Testing

Validate complete workflows including:

- Assessment submission
- Weak area detection
- Recommendation generation
- Learning plan creation
- Assignment generation
- Worksheet generation
- Recovery cycle completion
- Learning analytics generation
- Parent dashboard updates
- Report generation

---

# 66. Code Quality Standards

Every implementation shall comply with WisWits Engineering Standards.

## Architecture

✔ Layered Architecture

✔ Modular Design

✔ Independent Recommendation Engine

✔ Independent Analytics Engine

✔ Shared Platform Services

---

## Code

✔ Small reusable services

✔ Clear naming conventions

✔ Comprehensive validation

✔ Error handling

✔ Documentation

---

## Database

✔ Parameterized SQL

✔ Shared query()

✔ withTransaction()

---

## Security

✔ Shared authentication

✔ Shared authorization

✔ Audit logging

---

## Frontend

✔ Design System

✔ Shared Layout

✔ Platform Components

---

# 67. DevOps & Deployment Strategy

Deployment shall follow the WisWits Platform deployment workflow.

```text
Developer

↓

Pull Request

↓

Code Review

↓

Automated Tests

↓

QA Verification

↓

Security Verification

↓

Staging Deployment

↓

Production Deployment
```

Deployment shall be managed through the approved CI/CD pipeline.

---

# 68. CI/CD Standards

The following quality gates shall be completed before deployment.

Required Checks

✔ Build Success

✔ Linting

✔ Unit Tests

✔ Integration Tests

✔ Security Validation

✔ Migration Validation

✔ Code Review Approval

Only modules passing all quality gates shall be eligible for production deployment.

---

# 69. Release Management

The Personalised Learning module shall follow Semantic Versioning.

Example

```text
Major.Minor.Patch

1.0.0
```

Each release shall include:

- Version Number
- Features
- Improvements
- Bug Fixes
- Migration Notes
- Known Issues

---

# 70. Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect recommendations | Reduced learning effectiveness | Continuous validation of recommendation engine |
| Large analytics workload | Slow dashboards | Optimized indexing and background processing |
| Incomplete assessment data | Inaccurate learning plans | Data validation before recommendation generation |
| AI model evolution | Compatibility issues | Modular engine architecture |
| Integration failures | Missing learning insights | Shared platform APIs |
| Data inconsistency | Incorrect academic analytics | Transaction-safe operations |

---

# 71. Migration Strategy

The existing Personalised Learning implementation shall be treated as a business and algorithm reference only.

Migration workflow:

```text
Legacy Module Analysis

↓

PRD Approval

↓

CTO Technical Specification

↓

Engineering Execution

↓

Fresh Development

↓

Testing

↓

Platform Integration

↓

Production Deployment
```

Migration principles:

- Existing source code shall **not** be copied directly.
- Existing recommendation algorithms shall be analyzed and redesigned where necessary.
- Existing implementation shall be used only to understand business workflows and adaptive learning logic.
- Development shall begin from a clean codebase following WisWits engineering standards.
- Shared platform services shall replace all module-specific implementations.

---

# 72. Technical Acceptance Criteria

The module shall be considered technically complete when:

- Platform architecture standards are implemented.
- Shared authentication is integrated.
- Shared authorization is integrated.
- Recommendation Engine is operational.
- Analytics Engine is operational.
- Shared audit service is integrated.
- Shared notification service is integrated.
- Database standards are satisfied.
- Frontend standards are satisfied.
- API standards are satisfied.
- Security validation is complete.
- Performance benchmarks are achieved.
- Automated tests pass.
- Documentation is complete.

---

# 73. Future Technical Roadmap

## Phase 2

- AI-assisted personalized tutoring
- Intelligent adaptive question generation
- Dynamic learning path optimization
- Gamified recommendation engine

---

## Phase 3

- Predictive academic forecasting
- Voice-enabled AI learning assistant
- Personalized mentoring engine
- Mobile adaptive learning application

---

## Phase 4

- Generative AI learning companion
- Institution-wide academic intelligence platform
- Cross-module predictive analytics
- Enterprise learning intelligence ecosystem

Future enhancements shall reuse existing platform services wherever possible.

---

# 74. Engineering Governance

Every future enhancement shall:

- Follow the approved PRD.
- Comply with the CTO Technical Specification.
- Be implemented through the Engineering Execution Plan.
- Pass code review.
- Pass automated testing.
- Pass security validation.
- Pass integration testing.

No feature shall bypass the established engineering governance process.

---

# 75. CTO Recommendation

The current Personalised Learning implementation provides an excellent business and algorithmic foundation for adaptive learning, recommendations, recovery planning, and academic analytics.

However, it shall **not** be merged directly into the WisWits SaaS Platform.

Instead, it shall serve as a **business and algorithm reference** for a fresh implementation built according to:

- WisWits Product Requirements Document (PRD)
- WisWits CTO Technical Specification
- WisWits Engineering Execution Plan
- WisWits Platform Standards

This approach ensures architectural consistency, maintainability, scalability, security, AI readiness, and long-term compatibility with the WisWits SaaS ecosystem.
