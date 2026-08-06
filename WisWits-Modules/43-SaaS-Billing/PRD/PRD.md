# PRD — SaaS Billing

**Purpose.** How schools pay US. Launch model is manual + honest 409 on the automated door. Full subscription machinery already deployed, waiting on business (KYC), not code.

**Primary roles.** platform owner only

**Core workflow.** Sales bargain → org activated on plan → invoice from owner console → (later) automated mandate.

## Scope (current edition)
- Bargain → onboard → invoice → live
- Owner-console invoices
- Plans: Prarambh/Pragati/Prakhar/Param
- Automated Razorpay subscriptions = post-launch (KI-115 KYC pending)

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **MANUAL AT LAUNCH (LOCKED by AK)** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `EduSuite/ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
