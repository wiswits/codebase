# PRD — WhatsApp

**Purpose.** WhatsApp delivery channel for school comms — the channel Indian parents actually read.

**Primary roles.** admin, principal

**Core workflow.** Configure provider → send templated messages to targeted guardians.

## Scope (current edition)
- WhatsApp send integration (provider-based)
- Templates

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
