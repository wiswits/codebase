# PRD — Library

**Purpose.** Physical library circulation. Intern build = diff-then-port-gaps-only (P2 dedup).

**Primary roles.** admin, librarian(role), student/parent view

**Core workflow.** Catalog books → issue/return → overdue tracking.

## Scope (current edition)
- Books, members, issues, categories
- Issue/return with race-condition-safe locking

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
