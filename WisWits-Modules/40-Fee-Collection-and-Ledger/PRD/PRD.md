# PRD — Fee Collection and Ledger

**Purpose.** Money in, correctly counted. Enrolment fan-out and refund double-count classes are FIXED — regression tests guard them.

**Primary roles.** accountant, admin; parent pays/views

**Core workflow.** Cashier collects → ledger updates → receipt issued → reports reconcile.

## Scope (current edition)
- Collection (cash/UPI/card modes)
- feeLedger = the ONE money answer
- Refunds excluded from collected
- Receipts (shareable /receipt/[id])

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **LIVE** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `EduSuite/ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
