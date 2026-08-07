# PRD — Timetable

**Purpose.** Weekly period schedule. NOTE: teacher↔class assignment lives in three places read in two directions — timetable is one of them; keep consistent (see memory).

**Primary roles.** admin, coordinator; teacher/student read

**Core workflow.** Build grid per section → assign teacher+subject per slot → views render per role.

## Scope (current edition)
- Period grid per section
- Teacher assignment per subject-period
- Teacher + student views

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
