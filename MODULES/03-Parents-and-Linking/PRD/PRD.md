# PRD — Parents and Linking

**Purpose.** Connects guardians to students so fees, attendance, report cards and events reach home.

**Primary roles.** admin, reception, parent (self)

**Core workflow.** Parent account created (or self-registers) → invite code links child(ren) → portal shows per-child data.

## Scope (current edition)
- Parent accounts + child linking by invite code
- My Children view
- Parent portal access to fees/attendance/reports

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **LIVE (link surface partially wired)** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `MODULES/INTAKE_ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
