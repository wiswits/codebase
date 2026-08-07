# HPC Report Card Database

## Overview

This folder contains the complete database implementation for the HPC Report Card module.

---

## Folder Structure

```
database/

├── migrations/
├── schema/
├── scripts/
├── seeds/
└── README.md
```

---

## Installation

Execute the migration script:

```sql
SOURCE database/scripts/run_migrations.sql;
```

---

## Development Seed

Populate sample development data:

```sql
SOURCE database/seeds/hpc_development_seed.sql;
```

---

## Rollback

Remove all HPC database objects:

```sql
SOURCE database/scripts/rollback.sql;
```

---

## Tables

| Table | Purpose |
|--------|---------|
| client_hpc_competencies | Competency Master |
| client_hpc_entries | Teacher Assessment Entries |
| client_hpc_cards | Finalized Report Cards |

---

## Lifecycle

```
DRAFT
↓

IN_PROGRESS
↓

READY_FOR_REVIEW
↓

FINALIZED
```

---

## Database Standards

- MariaDB
- InnoDB Engine
- utf8mb4 Character Set
- Foreign Keys
- Unique Constraints
- Indexed Columns
- Multi-tenant (`org_id`)
- Transaction-safe migrations

---

## Author

WisWits Engineering Team