# PRD — Question Bank

**Purpose.** The question store powering quizzes, worksheets, and paper generation. Cross-tenant reads ONLY via libraryScope.js (the sanctioned scope).

**Primary roles.** admin, coordinator, teacher

**Core workflow.** Import/author questions → tag to taxonomy → consumed by quiz/worksheet generators.

## Scope (current edition)
- Subjects/topics/chapters taxonomy
- Question CRUD + import (RESULT: CLEAN protocol)
- Cross-org platform library via sanctioned libraryScope

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
