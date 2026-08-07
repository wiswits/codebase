# Visitor Management Database

This directory contains the database assets required by the Visitor
Management module.

## Database Engine

MariaDB is the primary database used by the module.

The backend uses the `mysql2` Node.js driver for MariaDB connectivity.

---

## Structure

database/
├── migrations/
│   ├── 001_create_visitor_logs.sql
│   └── 002_create_visitor_passes.sql
├── seed/
│   └── seed_development.sql
└── README.md

---

## Tables

### client_visitor_logs

Stores tenant-scoped visitor lifecycle records including:

- visitor identity/contact details
- visitor type
- visit purpose
- host information
- check-in information
- checkout information
- lifecycle status
- actor references
- timestamps

Supported lifecycle states:

- checked_in
- checked_out
- cancelled

Every record is scoped using `org_id`.

---

### client_visitor_passes

Stores passes issued to checked-in visitors.

A pass belongs to a visitor record through:

client_visitor_passes.visitor_log_id
→ client_visitor_logs.id

Supported pass states:

- active
- expired
- revoked

Passes are also tenant-scoped using `org_id`.

---

## Multi-Tenant Requirement

`org_id` is mandatory on Visitor Management tables.

Application queries must always scope tenant-owned records using
the authenticated user's organization context.

The module must never trust an `org_id` supplied by the frontend.

Production organization context is expected from:

req.user.org_id

through the platform authentication layer.

---

## Migration Rules

Migration files follow the platform naming convention:

NNN_description.sql

Example:

001_create_visitor_logs.sql

Migration files must NOT contain:

USE database_name;

Database selection is the responsibility of the platform migration
runner/environment.

---

## Development Seed

`seed/seed_development.sql` contains local development data only.

It must not be treated as production data.

---

## Permissions

Visitor Management routes currently declare permission requirements such as:

- visitor:view
- visitor:create
- visitor:update
- visitor:checkout
- visitor:pass:create

Permission catalog persistence is owned by the shared WisWits platform.

No local permission-table migration is included because the shared
platform permission schema is not present in this standalone assembly.

---

## Production Integration

The standalone module currently uses platform adapters for local
integration.

When merged into the main SaaS platform:

- shared authentication replaces the local authentication adapter
- shared database utilities replace/fulfil the database adapter
- shared permission enforcement fulfils `requirePermission(...)`
- shared audit infrastructure fulfils mutation audit calls
- shared notification infrastructure can replace the local notification adapter

Visitor Management business logic must not implement its own JWT
authentication or independent platform permission system.