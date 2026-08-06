# PRD — Visitors

**Purpose.** Who is in the building, signed in by the front desk. Ported from EduSuite via the intake pipeline — the reference port.

**Primary roles.** admin, principal, reception

**Core workflow.** Visitor arrives → check-in with host → pass printed → check-out.

## Scope (current edition)
- Front-desk check-in register
- Host lookup by name
- Printable visitor pass
- Gate-pass sub-module

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **SOON-GATED (DONE — flow-test + flag flip only)** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `EduSuite/ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
