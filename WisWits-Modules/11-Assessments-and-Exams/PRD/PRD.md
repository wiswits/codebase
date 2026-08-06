# PRD — Assessments and Exams

**Purpose.** Exam definition through marks to published results. EduSuite Exam-Cell build = candidate exam-OPS layer (hall tickets, seating, invigilation) on top — never a replacement.

**Primary roles.** admin, principal, coordinator, teacher

**Core workflow.** Define exam → enter marks → compute → publish (audited).

## Scope (current edition)
- Exam creation + marks entry
- Grade computation
- Publish gates (audit-logged)

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
