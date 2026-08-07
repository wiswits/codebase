# WisWits Database

## Event Management Module

This directory contains the database migrations and development seed data for the WisWits Event Management module.

## Database Technology

- Database: MariaDB
- Engine: InnoDB
- Character Set: utf8mb4
- Collation: utf8mb4_unicode_ci
- Local Database Name: `wiswits_dev`

---

## Directory Structure

database/
├── migrations/
│   └── 001_create_event_management_tables.sql
├── seeds/
│   └── event_management_seed.sql
└── README.md

---

## Event Management Tables

### client_events

Stores Event Management event records.

### client_event_rsvps

Stores user RSVP responses for events.

Relationship:

client_events (1) → (N) client_event_rsvps

### client_event_resources

Stores resources that can be allocated to events.

Examples:

- Projectors
- Microphones
- Equipment
- Other event resources

### client_event_resource_bookings

Connects events with resources and records their booking period.

Relationships:

client_events (1) → (N) client_event_resource_bookings

client_event_resources (1) → (N) client_event_resource_bookings

---

## Multi-Tenant Design

Event Management tables contain:

`org_id`

Backend queries must always scope tenant-owned data using the organization identifier.

Example:

SELECT *
FROM client_events
WHERE org_id = ?;

The client must not be trusted to arbitrarily choose another organization's `org_id`.
The backend must derive and validate tenant context through the approved authentication/authorization layer.

---

## Environment Configuration

Backend database configuration must use environment variables.

Example:

DB_HOST=localhost
DB_PORT=3307
DB_NAME=wiswits_dev
DB_USER=wiswits_app
DB_PASSWORD=your_local_database_password

Do not hardcode database credentials in application source code.

`DB_PORT=3307` is the current local development configuration used by the database developer.

Other developers must configure `DB_PORT` according to their local MariaDB installation.

---

## Local Database Creation

Example:

CREATE DATABASE wiswits_dev
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

---

## Running Migrations

Select the development database:

USE wiswits_dev;

Then execute:

SOURCE <PROJECT_PATH>/database/migrations/001_create_event_management_tables.sql;

---

## Development Seed Data

After the migration has completed:

SOURCE <PROJECT_PATH>/database/seeds/event_management_seed.sql;

Seed data is intended only for local development and testing.

---

## Application Database User

Backend applications should not connect using the MariaDB root account.

A dedicated local application user should be configured through environment variables.

Required application operations:

- SELECT
- INSERT
- UPDATE
- DELETE

Administrative operations and schema migrations should be performed separately.

---

## Security Rules

- Never commit real database passwords.
- Never commit `.env`.
- Use `.env.example` for configuration documentation.
- Do not connect the application using the MariaDB root account.
- All tenant-owned queries must respect `org_id`.
- Database credentials must come from environment variables.

---

## Current Status

Event Management database foundation:

- MariaDB setup completed
- Development database created
- Event Management migration created
- Event tables created
- Foreign-key relationships tested
- Development seed data tested
- RSVP relationship tested
- Resource-booking relationship tested

The schema currently represents the standalone Event Management demo implementation.

Existing WisWits production schemas must be reviewed and reconciled during final module integration.