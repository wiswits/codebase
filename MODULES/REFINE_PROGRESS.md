# Per-module refinement progress

Each module is refined on 4 axes: **consistent structure · code review/cleanup ·
cross-module contracts · docs complete**. Order: shared clusters first.

Legend: ✅ done · 🔄 in progress · ⬜ pending

## Shared clusters (first)

| # | Module | Shared domain | Refined |
|---|---|---|---|
| 31 | Staff-Attendance | hr | ✅ |
| 33 | Work-Reports-and-Scorecards | hr | ✅ |
| 35 | Performance-PMS | hr | ✅ |
| 37 | EMPS-Extras | hr | ✅ |
| 41 | Fee-Gateway | payments | ✅ |
| 43 | SaaS-Billing | payments | ✅ |
| 57 | Org-Settings-and-Branding | blueprints | ✅ |
| 58 | School-Branch-Management | blueprints | ✅ |
| 39 | Fee-Structures | fees | ✅ |
| 40 | Fee-Collection-and-Ledger | fees | ✅ |

Each cluster has a `_shared/domains/<domain>/CONTRACTS.md` = the authoritative
ownership + coupling map; each module's `CODE_MAP.md` links to it.

## CORE + erp spine (the deepest coupling)

| # | Module | Tier | Refined |
|---|---|---|---|
| — | CORE spine (`_shared/CORE.md`) | core | ✅ |
| 01 | Students | erp | ✅ |
| 03 | Parents-and-Linking | erp | ✅ |
| 08 | Classes-and-Sections | erp | ✅ |
| 09 | Timetable | erp | ✅ |
| 10 | Student-Attendance | erp | ✅ |
| 11 | Assessments-and-Exams | erp | ✅ |
| 12 | Report-Cards | erp | ✅ |
| 27 | Library | erp | ✅ |
| 28 | Transport | erp | ✅ |

`_shared/CORE.md` = identity/enrolment spine; `_shared/domains/erp/CONTRACTS.md`
= per-module file/table ownership + the spine every erp module stands on.

## Next up (standalone modules, 01→61 order)
Remaining ~40 modules mostly own their data (thin coupling) — each gets the same
consistent structure + contracts + docs pass.
