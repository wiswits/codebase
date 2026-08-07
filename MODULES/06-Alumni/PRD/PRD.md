# PRD — Alumni

**Purpose.** Former-student directory. THREE builds exist (native, intern port, Neha's Network+Mentorship) — one reconciliation pending; mentorship features not yet built.

**Primary roles.** admin, principal

**Core workflow.** Student marked alumni → profile appears → directory browse/search.

## Scope (current edition)
- Directory + profile pages
- Backed by native client_alumni_profiles
- Lifecycle auto-creates profile on student → alumni

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **SOON-GATED (one-flag flip; verify prod migration first)** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `MODULES/INTAKE_ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
