# PRD — Hostel Management

**Purpose.** Residential-school operations. Fills an empty Phase-1 slot (§8). Conveyor position 3.

**Primary roles.** admin, warden(role), parent visibility

**Core workflow.** Allocate room/bed → daily QR attendance → leave/gate-pass workflow → complaints.

## Scope (current edition)
- Room/bed hierarchy + allocation
- QR attendance
- Leave & gate-pass
- Complaints + fee bridge

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **GAP — most mature intern build, ready to port** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `MODULES/INTAKE_ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
