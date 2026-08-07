# PRD — Staff

**Purpose.** Directory of every employee. Feeds HR attendance, leaves, payroll (future), and teaching assignments.

**Primary roles.** admin, principal, hr_manager

**Core workflow.** Add staff → assign role/department → they appear in HR, timetable, and communication targeting.

## Scope (current edition)
- Staff directory CRUD
- Role + department assignment
- Document storage (teacher documents)

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **LIVE** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `MODULES/INTAKE_ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
