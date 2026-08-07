# PRD — Dashboard and Widgets

**Purpose.** First screen after login — per-role at-a-glance state of the school.

**Primary roles.** all roles

**Core workflow.** Login → role dashboard → drill into modules.

## Scope (current edition)
- Per-role home dashboard
- KPI/insight widget feeds
- 30s cache budget

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
