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

## Next up (erp core + remaining, then the rest 01→61)
The `erp` domain is already de-duplicated (each module owns its own routes
file); it gets the same CONTRACTS treatment next, then the standalone modules.
