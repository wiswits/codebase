# PRD — Students

**Purpose.** The master record of every learner. Single source of truth for identity, enrolment, and status across all other modules.

**Primary roles.** admin, principal, teacher (read), reception

**Core workflow.** Admission (via CRM convert or manual add) → profile completion → section enrolment → everything else references the student id.

## Scope (current edition)
- Student profiles + admission records
- Search under 1s (perf budget)
- Custom fields support
- Status lifecycle (active/alumni/archived)

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
