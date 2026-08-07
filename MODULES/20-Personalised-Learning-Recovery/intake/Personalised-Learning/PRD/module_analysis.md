# Personalised Learning
# Phase 1 – Module Analysis Report

---

# 1. Module Overview

## Module Name

Personalised Learning

### Purpose

The Personalised Learning module provides an intelligent adaptive learning platform that analyzes student performance, identifies weak concepts, generates personalized learning paths, recommends interventions, and continuously improves learning outcomes using analytics and algorithm-driven recommendations.

The module transforms assessment data into actionable learning plans for students, teachers, parents, and institution management.

---

# 2. Current Project Architecture

The uploaded implementation follows a separated frontend/backend architecture.

```text
Personalised-Learning/

├── frontend/
├── backend/
├── README.md
└── configuration files
```

### Assessment

✅ Separate frontend and backend

✅ REST API architecture

✅ Algorithm engine

✅ Analytics engine

✅ Adaptive learning workflows

✅ Multi-role dashboards

⚠️ Requires migration to EduSuite shared platform architecture

---

# 3. Frontend Analysis

## Current Technology

| Component | Current |
|------------|----------|
| Framework | React |
| Build Tool | Vite |
| Language | JavaScript (JSX) |
| Styling | CSS + Custom Components |
| Charts | Custom SVG/HTML Charts |
| State | React Context |

---

## Existing Frontend Structure

```text
frontend/

src/

├── components/
├── pages/
├── services/
├── utils/
├── hooks/
├── assets/
├── App.jsx
└── main.jsx
```

---

## Existing UI Features

The frontend contains interfaces for:

- Teacher Dashboard
- Student Dashboard
- Parent Dashboard
- Principal Dashboard
- Learning Insights
- Weak Area Analysis
- Recovery Cycles
- Assignments
- Tests
- Analytics
- Alerts
- Reports

---

## Assessment

### Strengths

- Multi-role dashboards
- Custom visualization components
- Analytics-focused UI
- Modular React structure
- Rich reporting interface

### Limitations

- JavaScript instead of TypeScript
- Vite instead of Next.js
- No EduSuite Design System
- No shared layouts
- Requires migration to shared UI architecture

---

# 4. Backend Analysis

## Current Technology Stack

| Component | Current |
|------------|----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL / MariaDB |
| Authentication | Middleware |
| API | REST |
| Algorithms | Custom Learning Engine |

---

## Existing Backend Structure

```text
backend/

src/

├── algorithms/
├── config/
├── db/
├── external/
├── middleware/
├── routes/
├── lib/
├── app.js
```

---

## Existing Backend Features

The backend currently includes:

- Weak Area Detection
- Root Cause Analysis
- Recovery Cycle Engine
- SM-2 Algorithm
- Behaviour Analysis
- Worksheet Generation
- Alerts
- Assignments
- Learning Insights
- Attempt Analytics
- Class Analytics
- Digest Generation
- External Curriculum Integration

---

## Assessment

### Strengths

- Advanced algorithm layer
- Modular REST APIs
- Analytics engine
- External adapter architecture
- Event-driven components

### Limitations

- Local middleware
- No EduSuite repository-service architecture
- Local authorization implementation
- Requires shared audit service
- Requires shared notification service
- Direct database integration

---

# 5. Database Analysis

The current implementation includes a comprehensive relational schema supporting adaptive learning.

Core entities include:

- Student Learning Profile
- Assignments
- Tests
- Attempts
- Weak Areas
- Recovery Cycles
- Worksheets
- Alerts
- Insights
- Analytics
- Behaviour Metrics

The README indicates approximately **22 database tables** supporting adaptive learning workflows.

Migration to EduSuite database standards is required.

---

# 6. Existing Business Capabilities

Current implementation supports:

- Personalized Learning Engine
- Adaptive Recommendations
- Weak Area Detection
- Root Cause Analysis
- Recovery Planning
- Assignments
- Worksheets
- Learning Analytics
- Behaviour Analysis
- Alerts
- Parent Insights
- Teacher Insights
- Principal Analytics

---

# 7. Existing Frontend Features

The frontend provides interfaces for:

- Teacher Portal
- Student Portal
- Parent Portal
- Principal Portal
- Learning Dashboard
- Analytics Dashboard
- Recovery Plans
- Assignments
- Tests
- Reports

---

# 8. Existing API Coverage

The backend exposes APIs for:

- Assignments
- Attempts
- Analytics
- Weak Area Analysis
- Alerts
- Insights
- Cycles
- Digest
- Offline Tests
- Learning Recommendations
- Recovery Plans

---

# 9. Business Workflow

```text
Assessment Completed

↓

Performance Analysis

↓

Weak Area Detection

↓

Root Cause Analysis

↓

Recovery Cycle Generation

↓

Personalized Learning Plan

↓

Worksheet & Assignment Creation

↓

Student Practice

↓

Progress Tracking

↓

Continuous Improvement
```

---

# 10. Existing Core Business Entities

The implementation currently manages:

- Student Learning Profile
- Assessment
- Assignment
- Attempt
- Weak Area
- Root Cause
- Recovery Cycle
- Worksheet
- Alert
- Insight
- Behaviour Analysis
- Analytics Report

Future EduSuite implementation shall further standardize these entities and integrate them with shared platform services.

---

# 11. Technical Strengths

## Frontend

- Multi-role experience
- Rich analytics dashboards
- Interactive visualizations
- Modular component design

---

## Backend

- Advanced adaptive learning algorithms
- Modular REST APIs
- Event-driven components
- External curriculum adapters
- Analytics engine

---

## Database

- Comprehensive adaptive learning schema
- Historical learning data
- Performance analytics
- Recommendation support

---

# 12. Platform Gap Analysis

| Area | Current Implementation | EduSuite Standard | Recommendation |
|------|------------------------|-------------------|----------------|
| Frontend | React + Vite | Next.js App Router | Rebuild |
| Language | JavaScript | TypeScript | Migrate |
| Routing | React Router | Next.js App Router | Replace |
| Authentication | Local Middleware | Shared authenticate() | Integrate |
| Authorization | Local Permission Logic | Platform RBAC | Integrate |
| Database Access | Direct MySQL | Shared query() | Replace |
| Notifications | Local Alerts | Shared Notification Service | Integrate |
| Audit | Limited | Shared Audit Service | Add |
| Layout | Module-specific | Shared EduSuite Layout | Replace |

---

# 13. SaaS Readiness Assessment

## Business Readiness

★★★★★

The module provides a comprehensive adaptive learning foundation, including analytics, diagnostics, personalized interventions, and learning recommendations.

---

## Technical Readiness

★★★★★

The architecture is mature and modular, especially the algorithm layer. However, migration to EduSuite standards—including TypeScript, layered backend architecture, shared platform services, and multi-tenant conventions—is required.

---

## Reusability

★★★★★

The adaptive learning algorithms, recommendation workflows, and analytics logic are highly reusable.

Following EduSuite engineering policy, the existing implementation shall be treated **only as a business and algorithm reference**. The new module shall be developed from scratch using the approved **PRD**, **CTO Technical Specification**, and **Engineering Execution Plan**.
