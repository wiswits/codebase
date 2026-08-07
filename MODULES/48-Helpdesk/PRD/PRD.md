# PRD — Helpdesk

**Purpose.** How schools tell US something is broken — tickets flow to our GitHub. Area-precision tagging shipped (area_path).

**Primary roles.** all roles report; platform triages

**Core workflow.** User reports → ticket → triage → fix → autoclose via 'Fixes WW-nn' trailer.

## Scope (current edition)
- Report-an-Issue floating button
- Ticket pipeline + GitHub sync
- Ideas/suggestions intake
- Public contact endpoint

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
