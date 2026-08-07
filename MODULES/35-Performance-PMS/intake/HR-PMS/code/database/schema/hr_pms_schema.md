# ============================================================
# EduSuite SaaS
# HR-PMS (Performance Management System)
# Database Schema Documentation
# ============================================================

Version: 1.0

Module: HR-PMS

Author: Khushboo (Database & Integration Lead)

Status: Development

---

# Purpose

This document describes the canonical database schema used by the HR Performance Management System.

The schema is designed to:

- Support multi-tenant architecture
- Follow EduSuite CTO standards
- Support future integrations
- Maintain data integrity
- Work with the shared backend architecture

---

# Database

Database Name

```
edusuite_hr_pms
```

Storage Engine

```
InnoDB
```

Character Set

```
utf8mb4
```

Collation

```
utf8mb4_unicode_ci
```

---

# Database Architecture

```
client_appraisal_cycles
            │
            │
            ▼
client_appraisal_goals
            │
            │
            ▼
client_appraisal_reviews
```

---

# Table 1

## client_appraisal_cycles

Purpose

Stores appraisal/review cycles.

Examples

- FY 2026 Review
- Mid Year Review
- Probation Review

Primary Key

```
id
```

Important Columns

| Column | Description |
|---------|-------------|
| id | Primary Key |
| org_id | Tenant ID |
| cycle_name | Review cycle name |
| cycle_code | Unique cycle code |
| description | Cycle description |
| start_date | Cycle start |
| end_date | Cycle end |
| review_due_date | Review submission deadline |
| status | draft / active / completed / archived |
| created_by | Creator |
| updated_by | Last updater |
| created_at | Created timestamp |
| updated_at | Updated timestamp |

Indexes

- idx_cycle_org
- idx_cycle_status
- idx_cycle_dates
- idx_created_by

Unique Key

(org_id, cycle_code)

---

# Table 2

## client_appraisal_goals

Purpose

Stores employee performance goals.

Relationship

Many Goals

↓

One Cycle

Primary Key

```
id
```

Foreign Key

```
cycle_id

↓

client_appraisal_cycles.id
```

Important Columns

| Column | Description |
|---------|-------------|
| id | Primary Key |
| org_id | Tenant ID |
| cycle_id | Appraisal Cycle |
| employee_id | Employee |
| goal_title | Goal title |
| goal_description | Description |
| category | Goal category |
| priority | Priority |
| weightage | Goal weightage |
| target_value | Target |
| achieved_value | Achieved |
| progress_percentage | Completion percentage |
| status | pending / in_progress / completed / cancelled |
| remarks | Additional notes |
| created_by | Creator |
| updated_by | Updater |

Indexes

- idx_goal_org
- idx_goal_cycle
- idx_goal_employee
- idx_goal_status
- idx_goal_priority
- idx_goal_category
- idx_goal_progress

Validation

Weightage

```
0 – 100
```

Progress

```
0 – 100
```

---

# Table 3

## client_appraisal_reviews

Purpose

Stores both

- Self Reviews
- Reviewer Reviews

using one canonical table.

Relationship

Many Reviews

↓

One Goal

↓

One Cycle

Primary Key

```
id
```

Foreign Keys

```
cycle_id

↓

client_appraisal_cycles.id
```

```
goal_id

↓

client_appraisal_goals.id
```

Important Columns

| Column | Description |
|---------|-------------|
| id | Primary Key |
| org_id | Tenant ID |
| cycle_id | Review cycle |
| goal_id | Goal |
| employee_id | Employee |
| reviewer_id | Reviewer |
| review_type | self / reviewer |
| rating | Rating |
| comments | Review comments |
| strengths | Strengths |
| improvements | Areas of improvement |
| achievements | Achievements |
| review_status | draft / submitted / approved / rejected |
| submitted_at | Submission timestamp |
| approved_at | Approval timestamp |
| created_by | Creator |
| updated_by | Updater |

Validation

Rating

```
0 – 5
```

Unique Constraint

```
(
org_id,
cycle_id,
goal_id,
employee_id,
review_type
)
```

Indexes

- idx_review_org
- idx_review_cycle
- idx_review_goal
- idx_review_employee
- idx_review_reviewer
- idx_review_type
- idx_review_status
- idx_review_rating

---

# Relationships

client_appraisal_cycles

```
1

↓

N

client_appraisal_goals
```

client_appraisal_goals

```
1

↓

N

client_appraisal_reviews
```

---

# Multi-Tenant Design

Every table contains

```
org_id
```

Purpose

- Tenant Isolation
- Secure Queries
- Organization Level Filtering

Example

```sql
SELECT *
FROM client_appraisal_goals
WHERE org_id = ?;
```

---

# Audit Fields

Every table contains

- created_by
- updated_by
- created_at
- updated_at

Purpose

- Track Changes
- User Accountability
- Future Audit Logging

---

# Integration Notes

Current Module

Standalone

Future Integration

- Shared Authentication
- Shared Database Helper
- Shared User Module
- Shared Employee Module
- Shared Organization Module
- Audit Service

---

# Backend Usage

Backend Layers

```
Routes

↓

Controllers

↓

Services

↓

Repositories

↓

MariaDB
```

---

# Frontend Usage

Next.js

↓

REST APIs

↓

Backend

↓

Database

---

# Development Notes

The HR-PMS schema follows:

- Canonical table names
- Multi-tenant architecture
- Shared platform compatibility
- Parameterized SQL compatibility
- Production-ready naming
- EduSuite CTO standards

---

# End of Document