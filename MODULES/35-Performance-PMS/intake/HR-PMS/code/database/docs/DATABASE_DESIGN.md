# ============================================================
# WisWits SaaS
# HR-PMS (Performance Management System)
# Database Design Document
# ============================================================

**Version:** 1.0

**Module:** HR Performance Management System (HR-PMS)

**Author:** Khushboo (Database & Integration Lead)

**Status:** Development

---

# 1. Overview

This document describes the design decisions, architecture, and implementation strategy for the HR-PMS database module.

The schema has been designed according to:

- WisWits Engineering Standards
- CTO Technical Specification
- Module Engineering Contract
- Sir's Integration Remarks

The objective is to ensure that the database is production-ready, scalable, and integrates seamlessly with the WisWits SaaS platform.

---

# 2. Design Objectives

The database has been designed with the following goals:

- Multi-tenant architecture
- High performance
- Data integrity
- Easy backend integration
- Future scalability
- Consistent naming conventions
- Platform-wide compatibility

The schema intentionally avoids assumptions about other modules so it can be integrated without modifying the core application.

---

# 3. Architecture

The HR-PMS module follows a relational database design.

```
Appraisal Cycle
        │
        ▼
Employee Goals
        │
        ▼
Performance Reviews
```

Each entity has a clearly defined responsibility.

---

# 4. Database Tables

The module contains three canonical tables.

## 4.1 client_appraisal_cycles

Purpose

Stores appraisal periods.

Examples

- Annual Review
- Mid-Year Review
- Probation Review

Responsibilities

- Define review timelines
- Track cycle status
- Manage review periods

---

## 4.2 client_appraisal_goals

Purpose

Stores employee goals belonging to an appraisal cycle.

Responsibilities

- Goal definition
- Progress tracking
- Weightage allocation
- Goal categorization
- Employee assignment

Each goal belongs to exactly one appraisal cycle.

---

## 4.3 client_appraisal_reviews

Purpose

Stores performance reviews.

The system intentionally uses one table for both:

- Self Reviews
- Reviewer Reviews

This follows the approved module contract and avoids unnecessary duplication.

The distinction is maintained using:

```
review_type
```

Possible values

- self
- reviewer

---

# 5. Multi-Tenant Design

Every table contains

```
org_id
```

Purpose

- Tenant isolation
- Secure filtering
- SaaS compatibility

Typical query

```sql
SELECT *
FROM client_appraisal_goals
WHERE org_id = ?;
```

No query should access data without tenant filtering.

---

# 6. Primary Keys

Each table uses

```
BIGINT UNSIGNED AUTO_INCREMENT
```

Benefits

- Efficient indexing
- Large record capacity
- Easy integration

---

# 7. Foreign Key Strategy

Current foreign keys

- cycle_id → client_appraisal_cycles.id
- goal_id → client_appraisal_goals.id

References to shared platform entities such as:

- Organizations
- Employees
- Users

are intentionally deferred until the HR-PMS module is integrated into the complete WisWits SaaS database.

This keeps the standalone module independent while remaining integration-ready.

---

# 8. Validation Rules

## Appraisal Cycle

- End date must not be earlier than start date.

---

## Goals

Weightage

```
0–100
```

Progress

```
0–100
```

---

## Reviews

Rating

```
0–5
```

Only one review of a given type (self/reviewer) is allowed per employee, goal, and cycle.

---

# 9. Indexing Strategy

Indexes have been created on frequently queried columns.

Examples

- org_id
- cycle_id
- employee_id
- status
- review_type
- rating

Purpose

- Faster filtering
- Better JOIN performance
- Reduced query execution time

---

# 10. Audit Fields

Every table includes

- created_by
- updated_by
- created_at
- updated_at

Benefits

- Accountability
- Future audit logging
- Change tracking

The schema is prepared for integration with the platform's shared Audit Service.

---

# 11. Data Integrity

The database enforces integrity through:

- Primary Keys
- Foreign Keys
- Unique Constraints
- CHECK Constraints
- NOT NULL Constraints
- ENUM Validation

These measures reduce invalid data and improve application reliability.

---

# 12. Performance Considerations

The schema is optimized for common HR workflows.

Typical operations include:

- Listing appraisal cycles
- Viewing employee goals
- Fetching review history
- Filtering by organization
- Searching by employee
- Dashboard statistics

Indexes have been selected to support these operations efficiently.

---

# 13. Scalability

The schema is designed to support:

- Multiple organizations
- Thousands of employees
- Multiple review cycles
- Large volumes of goals
- Historical review records

No structural changes should be required as data volume grows.

---

# 14. Security Considerations

The database is intended to work with:

- Shared Authentication
- Shared Authorization
- Permission Middleware
- Parameterized SQL Queries

Sensitive access decisions are handled by the backend rather than the database.

---

# 15. Integration Strategy

The HR-PMS database will integrate with:

- HR Employee Module
- HR Organization Module
- Authentication Module
- User Management Module
- Audit Logging Service
- Notification Service
- Dashboard Module

This design minimizes coupling while allowing seamless integration into the main WisWits platform.

---

# 16. Compliance with CTO Standards

This database follows the approved engineering practices:

- Canonical table names
- Layered architecture compatibility
- Multi-tenant design
- Shared helper compatibility
- Parameterized SQL compatibility
- Audit-ready structure
- Production naming conventions
- Integration-first design

---

# 17. Sir's Integration Remarks

The schema has been designed keeping the following principles in mind:

- No module-specific authentication
- No standalone authorization logic
- Compatible with shared database helpers
- Compatible with shared audit logging
- Tenant-aware structure
- Easy drop-in integration with the main intern team's upstream workspacesitory

---

# 18. Future Enhancements

Possible future additions include:

- Competency-based evaluations
- KPI management
- 360-degree feedback
- Peer reviews
- Goal templates
- AI-assisted performance insights
- Performance analytics
- Review attachments
- HR approval workflow

The current design supports these enhancements without major restructuring.

---

# 19. Conclusion

The HR-PMS database has been designed as a production-ready, scalable, and integration-friendly module.

It follows the WisWits engineering standards, satisfies the approved module contract, and aligns with the CTO's technical specifications and Sir's integration expectations.

The schema is suitable for backend development, frontend integration, testing, and future expansion within the WisWits SaaS ecosystem.

---

**End of Document**