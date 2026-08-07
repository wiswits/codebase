# PRD — Certificates

**Purpose.** Design and issue verifiable certificates. Intern build REJECTED as duplicate (cherry-pick only if a diff proves a real gap).

**Primary roles.** admin, principal

**Core workflow.** Design → issue to students → anyone verifies via QR forever.

## Scope (current edition)
- Design studio (3 paths + letterhead + fonts)
- Issue + QR verification
- Soft-delete + reuse designs
- Certificates outlive the school (permanence rule)

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
