# HPC Report Card Module

## Entity Relationship Diagram

```text
+------------------------------------------------------+
|            client_hpc_competencies                   |
+------------------------------------------------------+
| PK  id                                               |
|     org_id                                           |
|     domain_code                                      |
|     domain_name                                      |
|     competency_code                                  |
|     competency_name                                  |
|     descriptor_text                                  |
|     display_order                                    |
|     is_active                                        |
|     created_at                                       |
|     updated_at                                       |
+------------------------------------------------------+
                    |
                    |
                    | 1
                    |
                    | N
+------------------------------------------------------+
|               client_hpc_entries                     |
+------------------------------------------------------+
| PK  id                                               |
| FK  competency_id                                    |
|     org_id                                           |
|     student_id                                       |
|     academic_cycle_id                                |
|     entry_value                                      |
|     remarks                                          |
|     evaluator_id                                     |
|     status                                           |
|     created_at                                       |
|     updated_at                                       |
+------------------------------------------------------+
                    |
                    |
                    | Snapshot
                    |
                    v
+------------------------------------------------------+
|                client_hpc_cards                      |
+------------------------------------------------------+
| PK  id                                               |
|     org_id                                           |
|     student_id                                       |
|     academic_cycle_id                                |
|     status                                           |
|     snapshot_json                                    |
|     finalized_by                                     |
|     finalized_at                                     |
|     created_at                                       |
+------------------------------------------------------+
```

---

## Relationship

```
client_hpc_competencies
        1
        |
        |
        |----< client_hpc_entries

client_hpc_entries
        |
        |
        | Finalized Snapshot
        |
        V

client_hpc_cards
```

---

## Business Flow

```
Create Competencies
        ↓

Teacher creates HPC Entries
        ↓

Reviewer verifies entries
        ↓

Status → READY_FOR_REVIEW
        ↓

Finalize Report Card
        ↓

Snapshot stored in
client_hpc_cards
```

---

## Tables

### client_hpc_competencies

Stores all configurable competencies.

---

### client_hpc_entries

Stores teacher-entered competency assessments before finalization.

---

### client_hpc_cards

Stores immutable finalized HPC report cards.

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

## Multi-Tenant

Every table contains:

- org_id

which isolates data for every school.

---

## Database Engine

- MariaDB
- InnoDB
- utf8mb4
- Foreign Keys
- Indexed Columns
- Unique Constraints