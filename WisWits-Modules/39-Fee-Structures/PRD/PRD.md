# PRD — Fee Structures

**Purpose.** Defining what a student owes. billableTotal() is THE amount answer — '₹700 Monthly' means ₹700 × months, never ₹700 flat.

**Primary roles.** admin, accountant

**Core workflow.** Define structure → assign to class/student → ledger opens.

## Scope (current edition)
- Structure + assignment with billableTotal() (per-period amounts)
- Assign door fixed (WW: fees-assign)

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
