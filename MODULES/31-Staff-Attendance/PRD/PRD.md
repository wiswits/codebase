# PRD — Staff Attendance

**Purpose.** Employee attendance with geofencing. EduSuite Biometric contract = future device-sync layer on this, not a new module.

**Primary roles.** hr_manager, admin, principal; staff self

**Core workflow.** Staff check in/out (geofenced) → HR reviews → overrides audited.

## Scope (current edition)
- Day view, check-in/out, late-by minutes
- Audit-logged override
- Geofence policy editor
- Biometric device config in Settings

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
