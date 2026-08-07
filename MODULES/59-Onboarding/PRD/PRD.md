# PRD — Onboarding

**Purpose.** Sign up → first campus → working, with zero support contact (§3). Application is not a tenant — approval provisions.

**Primary roles.** public applies; platform approves

**Core workflow.** School applies → we approve → org provisioned on a live plan → welcome email.

## Scope (current edition)
- Self-serve /apply → application → approval → provision
- One orgProvisioning path (two-doors class killed)
- 278-check onboarding_loop.js verifier

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
