# CORE tier — the cross-everything spine

The innermost tier. **Every module wires into this; nothing here belongs to a
single module.** If Core changes, all 61 modules feel it.

## 1. Wiring contract (already isolated in `_shared/apps/`)
- `apps/backend/src/core/registry.js` — the `MOUNT_ORDER` list (64 mounts). The
  loader **hard-fails at boot** if a module isn't listed, is listed twice, or
  `dependsOn` an unknown name. This is what makes "unmounted module" bugs
  impossible.
- `apps/web/src/config/navConfig.ts` — the single nav tree.
- `apps/web/src/lib/apiClient.ts` — the single API client.

## 2. Shared middleware & utils (live in wiswits-code, required everywhere)
Referenced by nearly every route file via `../../`:
`config/db` · `middleware/auth` (`authenticate`) · `middleware/rbac`
(`requirePermission`, `userCan`) · `middleware/tenant` (`rejectOrgIdInPayload`) ·
`middleware/moduleGate` · `utils/{response,audit,logger,activeSchool}`.

## 3. Identity & enrolment spine (the data Core)
These tables are read/written by 20–41 of the 61 modules — the deepest coupling
in the product. No customer module "owns" them alone:

| Table | Anchored by | Touched by |
|---|---|---|
| `client_users` (+ `client_roles`, `client_user_roles`) | Core / auth | **41 modules** |
| `client_students` | 01-Students | **36** |
| `client_enrollments` | 08-Classes-and-Sections | **30** |
| `client_sections` | 08-Classes-and-Sections | **30** |
| `client_classes` | 08-Classes-and-Sections | **28** |
| `client_parents`, `client_parent_students` | 03-Parents-and-Linking | **23** |
| `client_organizations` | Core / Org | many |

**Consequence:** Students (01), Classes-and-Sections (08) and Parents-Linking
(03) are not separable from the rest — they are the substrate every other
module resolves identity through. Selling any of them "standalone" means
shipping this spine with it.

## 4. Rule
This is a SAFE COPY of prod (`31210d4e`). Core changes happen in
`wiswits/wiswits-code` only, behind its staging→prod gates — never here.
