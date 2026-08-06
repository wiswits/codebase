# PRD — Fee Gateway

**Purpose.** Lets a SCHOOL collect fees online from parents (distinct from #43, us billing the school).

**Primary roles.** admin (setup), parent (pay)

**Core workflow.** School connects gateway → parent pays online → ledger reconciles.

## Scope (current edition)
- School-side online fee collection config
- Razorpay integration (school's own account)

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **CONFIG EXISTS — verify end-to-end before marketing** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `EduSuite/ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
