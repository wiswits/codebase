# PRD — Payroll

**Purpose.** Salary structures → payroll runs → payslips. Everything else in the HR suite is already native; this is the missing piece. School-simple, not GST/PF/ESI compliance (§7 defers that to a future connector).

**Primary roles.** hr_manager, admin; staff self (payslips)

**Core workflow.** Define salary structure → monthly run → review → payslip PDFs.

## Scope (current edition)
- ('Coming Q2 2026' tab today)
- Scope source: Neha's HRMS build + the HR-Payroll intern contract — payroll ONLY

## Requirements (inherited, non-negotiable)
- Module anatomy per `PRODUCT_PRD.md` §2 (org_id scoping, permissions, audit, six loading
  states, SimLab design, simple-English copy).
- §1 Product Principles: reduces teacher workload · ≤3 clicks · mobile-first · no
  ERP/LMS jargon · beautiful by default.
- Definition of Done: `CLAUDE.md` §20, all eleven points.

## Status vs spec
Current status: **PLACEHOLDER — the one real HR gap (SUG-0111)** — see `../STATUS.md`. Gaps between this PRD and the live
build are tracked in `FINAL_LAUNCH_PLAN.md` / `MODULES/INTAKE_ROADMAP.md`; enrich this PRD
when the module gets its dedicated cycle.
