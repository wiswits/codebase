# PRD — Admissions CRM

**Purpose.** The one admissions pipeline. Intern Admission/Registration builds are REJECTED as duplicates; only their number-series + document-checklist ideas may be absorbed here.

**Primary roles.** admin, principal, reception

**Core workflow.** Enquiry/lead → stage progression → demo → convert → student minted with admission number.

## Scope (current edition)
- Lead pipeline with stages + demos
- Public /apply/[token] intake
- Duplicate check
- Convert → student + admission number (ADM-<year>-<id>)

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
