# PRD — School Branch Management

**Purpose.** One organization, many schools — the multi-tenant promise's admin surface.

**Primary roles.** org owner, admin

**Core workflow.** Org adds branch → members assigned → school switcher scopes everything.

## Scope (current edition)
- Multi-branch under one org
- Campus + member management
- Institutes page (358 lines) reachable only via Settings link

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **BE BUILT, THIN SURFACE — wiring item** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `EduSuite/ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
