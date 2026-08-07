# PRD — Asset and Inventory

**Purpose.** School asset + consumable tracking. Fills an empty Phase-1 slot (§8). Conveyor position 4.

**Primary roles.** admin, accountant, inventory-keeper(role)

**Core workflow.** Register assets/stock → issue/consume → purchase/return cycles → reports.

## Scope (current edition)
- Stock in/out, purchases, returns
- Vendors + categories
- Reports

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **GAP — intern build ready** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `MODULES/INTAKE_ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
