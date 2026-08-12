# Blueprints domain — contracts & coupling map

One shared folder (`_shared/domains/blueprints/`) serves **two product-modules** —
the org/school setup spine.

## Route surface (from `blueprints.module.js`)
| Descriptor | Mount | Surface |
|---|---|---|
| `blueprints.institution` | `/api/institution` | Org/branch setup, labels, role blueprints, feature toggles |

(The `Owner/Admin/Teacher/Student/Parent` entries in the file are **role
blueprint data**, not route descriptors.)

## Product-module → surface
| Module | Focus |
|---|---|
| **57-Org-Settings-and-Branding** | org identity, labels, branding, role blueprints |
| **58-School-Branch-Management** | schools/branches, per-branch setup seeds |

## Tables
**Owned/primary:** `client_labels`, `client_schools`, `client_organizations`, `client_leave_types`
**Read/seed from other domains:** `client_feature_flags` (**60-Module-Management**),
`client_classes`, `client_sections`, `client_subjects`, `client_roles` (People/academic setup)

## Core dependencies
`config/db` · `auth` · `rbac` · `utils/activeSchool` · `utils/response`.

## Key coupling
**Direct code import:** `blueprint.service.js` requires
`../custom-fields/customFields.service` → **blueprints depends on 54-Custom-Fields**.
This is a hard cross-domain `require`, not just a shared table.
