# Fees domain — contracts & coupling map

Backend `erp/fees.routes.js` (mounts as `erp.fees` → `/api/fees`) + web
`(dashboard)/fees/page.tsx`, shared by **two product-modules**.

## Product-module split
| Module | Focus |
|---|---|
| **39-Fee-Structures** | fee heads/components, structures, installment plans |
| **40-Fee-Collection-and-Ledger** | assignment to students, collection, ledger/receipts |

Same file, two product views — Structures defines, Collection charges.

## Tables
**Owned:** `client_fee_structures`, `client_fee_components`, `client_fee_installments`,
`client_fee_assignments`, `client_fee_payments`
**Read from other domains — cannot be cut:**
- `client_students`, `client_enrollments`, `client_classes`, `client_sections`, `client_users` → **People/Enrolment spine**
- `client_organizations` → Core/Org

## Core dependencies
`config/db` · `auth` · `rbac` · `middleware/moduleGate` · `utils/{activeSchool,audit,headcount,money,response}` ·
services `feeLedger` · `notificationService`.

## Key coupling
`client_fee_payments`/`client_fee_assignments` are the shared boundary with
**Payments (41-Fee-Gateway)** — Fees records, the gateway settles. And every
fee assignment resolves a real student via the enrolment spine, so Fees is
downstream of **01-Students / 08-Classes-and-Sections**.
