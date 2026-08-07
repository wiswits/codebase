# PRD — Module Management

**Purpose.** The control plane deciding what each school sees. Superadmin side is live; the tenant-facing toggle UI is the one genuinely unbuilt piece.

**Primary roles.** platform owner; admin (future)

**Core workflow.** Platform/plan sets entitlements → nav renders per org → (future) admin self-serve toggles.

## Scope (current edition)
- Per-org module on/off (nav_flags)
- Plan gating (ON for new orgs, off for legacy)
- Org Control Room (superadmin) live
- Tenant-side Settings > Features page = the missing UI

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **BUILT, DARK — Features page unbuilt (BE mounted)** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `MODULES/INTAKE_ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
