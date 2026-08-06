# PRD — Student Attendance

**Purpose.** Daily attendance with the strictest performance + freshness budget in the platform.

**Primary roles.** teacher, class teacher; admin/principal oversight

**Core workflow.** Teacher opens section → marks → saves → parents see it same-day.

## Scope (current edition)
- Daily/period marking
- Save < 500ms budget
- Parent visibility
- Never-stale caching rule

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
