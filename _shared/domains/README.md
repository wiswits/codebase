# _shared/domains — the SHARED tier

Three-tier layout for the module library (**Core → Shared → Module**):

- **Core** (`_shared/apps/…`): the cross-everything contract every module wires
  into — `core/registry.js` (MOUNT_ORDER), `config/navConfig.ts`, `lib/apiClient.ts`.
- **Shared** (`_shared/domains/<domain>/`): code that several *product-modules*
  legitimately share as ONE live domain folder. Stored **once** here so it can
  never drift between module copies.
- **Module** (`MODULES/NN-Name/`): each module's spec (STATUS/PRD/CODE_MAP) plus
  only the code that is truly its own.

## What lives here and who shares it

| Shared domain | One live folder used by these product-modules |
|---|---|
| `hr/`         | 31-Staff-Attendance · 33-Work-Reports · 35-Performance-PMS · 37-EMPS-Extras (backend) · 32-Staff-Leaves · 34-Payroll (web) |
| `payments/`   | 41-Fee-Gateway · 43-SaaS-Billing |
| `blueprints/` | 57-Org-Settings-and-Branding · 58-School-Branch-Management |
| `fees/`       | 39-Fee-Structures · 40-Fee-Collection-and-Ledger |

Each of those modules carries a `code/SHARED_CODE.md` pointing back here.

> This is still a SAFE COPY of what prod runs (commit `31210d4e`, snapshot
> 2026-08-06). The live runnable code remains in `wiswits/wiswits-code`.
